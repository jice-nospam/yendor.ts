/**
 * ==============================================================================
 * Group: map topology
 * ==============================================================================
 */

import * as Core from "../core/main";
import * as Yendor from "../yendor/main";
import * as Actors from "../actors/main";
import {Map} from "./map";

type TopologyObjectId = number;
const NONE: TopologyObjectId = -1;

abstract class TopologyObject implements Core.IComparable {
    protected _id: TopologyObjectId;
    get id() { return this._id; }
    constructor(id: TopologyObjectId) {
        this._id = id;
    }
    public abstract getDescription(): string;
    public equals(c: TopologyObject): boolean {
        return this._id === c.id;
    }
}
/**
 * Class: Connector
 * Represent a map cell connecting two sectors (generally a door)
 */
export class Connector extends TopologyObject {
    public pos: Core.Position;
    public sector1Id: TopologyObjectId;
    public sector2Id: TopologyObjectId;
    /**
     * Property: gut
     * Whether there's no alternative route connecting this connectors' adjacent sectors
     */
    public gut: boolean = false;
    /**
     * Property: lock
     * If not undefined, this connector is locked. This is the key number
     */
    public lock: number|undefined;

    constructor(id: TopologyObjectId, pos: Core.Position, sector1Id: TopologyObjectId) {
        super(id);
        this.pos = pos;
        this.sector1Id = sector1Id;
    }

    /**
     * Function: isDummy
     * Whether this connector connects two parts of the same sector
     */
    public isDummy(): boolean { return this.sector2Id === undefined; }

    public getDescription(): string {
        return (this.gut ? "gut " : "") + "connector " + this.id + " : "
            + this.pos.x + "-" + this.pos.y + " between " + this.sector1Id + " and " + this.sector2Id;
    }
}

/**
 * Class: Sector
 * Represent a group of connected map cells. There exists a path between any two cells of this sector.
 */
export class Sector extends TopologyObject {
    /**
     * Property: seed
     * Any cell of the sector. This is used to start the floodfilling algorithm.
     */
    public seed: Core.Position;
    public cellCount: number = 0;
    public connectors: TopologyObjectId[] = [];
    /**
     * Property: key
     * If not undefined, this sector contains the key to a lock
     */
    public key: number;

    private deadEnd: boolean = true;

    constructor(id: TopologyObjectId, seed: Core.Position) {
        super(id);
        this.seed = seed;
    }

    public isDeadEnd(): boolean { return this.deadEnd; }

    public getDescription(): string {
        return (this.deadEnd ? "dead end " : "") + "sector " + this.id + " : "
            + this.seed.x + "-" + this.seed.y + " (" + this.cellCount + " cells)";
    }

    public addConnector(id: TopologyObjectId) {
        if (this.connectors.indexOf(id) === -1) {
            this.connectors.push(id);
            if (this.deadEnd) {
                this.deadEnd = this.connectors.length < 2;
            }
        } else {
            this.deadEnd = false;
        }
    }
}

export interface IPuzzleStep {
    /**
     * Property: connectorId
     * the connector that has the locked door
     */
    connectorId: TopologyObjectId;
    /**
     * Property: keySectorId
     * the sector that contains the key
     */
    keySectorId: TopologyObjectId;
}

/**
 * Class: TopologyMap
 * Represents the map as a list of sectors separated by connectors.
 * This is used to generate door/key puzzles.
 */
export class TopologyMap {
    private width: number;
    private height: number;
    /**
     * Property: objectMap
     * Associate a topology object to each walkable map cell (either a sector or a connector)
     */
    private objectMap: TopologyObjectId[][] = [];
    /**
     * Property: objects
     * All existing sectors and connectors
     */
    private objects: TopologyObject[] = [];
    private _sectors: Sector[] = [];
    private _connectors: Connector[] = [];
    private _puzzle: IPuzzleStep[] = [];

    get puzzle() { return this._puzzle; }

    get sectors() { return this._sectors; }
    get connectors() { return this._connectors; }

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        for (let x = 0; x < width; ++x) {
            this.objectMap[x] = [];
            for (let y = 0; y < height; ++y) {
                this.objectMap[x][y] = NONE;
            }
        }
    }

    public createSector(seed: Core.Position): Sector {
        let sector: Sector = new Sector(this.objects.length, seed);
        this.objects.push(sector);
        this._sectors.push(sector);
        return sector;
    }

    public createConnector(pos: Core.Position, sector1Id: TopologyObjectId): Connector {
        let connector: Connector = new Connector(this.objects.length, pos, sector1Id);
        this.objects.push(connector);
        this._connectors.push(connector);
        return connector;
    }

    public getObjectId(pos: Core.Position): TopologyObjectId {
        return this.objectMap[pos.x][pos.y];
    }

    public setObjectId(pos: Core.Position, id: TopologyObjectId) {
        this.objectMap[pos.x][pos.y] = id;
    }

    public getSector(pos: Core.Position): Sector;
    public getSector(id: TopologyObjectId): Sector;
    public getSector(param: any): Sector {
        if (param instanceof Core.Position) {
            return this.getSectorFromPosition(param);
        } else {
            return this.getSectorFromId(param);
        }
    }

    public getConnector(pos: Core.Position): Connector;
    public getConnector(id: TopologyObjectId): Connector;
    public getConnector(param: any): Connector {
        if (param instanceof Core.Position) {
            return this.getConnectorFromPos(param);
        } else {
            return this.getConnectorFromId(param);
        }
    }

    public getRandomPositionInSector(id: TopologyObjectId, rng: Yendor.Random): Core.Position {
        let pos: Core.Position = new Core.Position(-1, 0);
        let sector: Sector = this.getSectorFromId(id);
        let cellNum: number = rng.getNumber(1, sector.cellCount);
        do {
            do {
                pos.x++;
                if (pos.x === this.width) {
                    pos.x = 0;
                    pos.y++;
                    if (pos.y === this.height) {
                        pos.y = 0;
                    }
                }
            } while (this.objectMap[pos.x][pos.y] !== id);
            cellNum--;
        } while (cellNum > 0);
        return pos;
    }

    /**
     * Function: computePath
     * Compute the shortest path (in term of traversed sectors,
     * not necessarily in terms of distance) between two sectors
     * using Dijkstra algorithm adapted
     * from http://en.wikipedia.org/wiki/Dijkstra%27s_algorithm.
     * The path can only use unlocked connectors.
     * Parameters:
     * id1 - id of the origin sector
     * id2 - id of the destinaton sector
     * Returns:
     * the list of traversed sectors ids, starting with id1 and ending with id2. If no path is found,
     * returns an array containing only id1.
     */
    public computePath(id1: TopologyObjectId, id2: TopologyObjectId): TopologyObjectId[] {
        let dist: number[] = [];
        let prev: (number|undefined)[] = [];
        let queue: Yendor.BinaryHeap<Sector> = new Yendor.BinaryHeap((o: Sector) => { return dist[o.id]; });
        dist[id1] = 0;
        prev[id1] = undefined;
        queue.push(<Sector> this.objects[id1]);

        let sector: Sector|undefined = queue.pop();
        while (sector) {
            // get sector with lowest distance
            if (sector.id === id2) {
                break;
            }
            for (let connectorId of sector.connectors) {
                let connector: Connector = <Connector> this.objects[connectorId];
                if (connector.lock === undefined) {
                    let sector2Id: TopologyObjectId = connector.sector1Id === sector.id
                        ? connector.sector2Id : connector.sector1Id;
                    let altDist: number = dist[sector.id] + 1;
                    if (dist[sector2Id] === undefined || dist[sector2Id] > altDist) {
                        let sector2: Sector = <Sector> this.objects[sector2Id];
                        dist[sector2Id] = altDist;
                        prev[sector2Id] = sector.id;
                        if (!queue.contains(sector2)) {
                            queue.push(sector2);
                        }
                    }
                }
            }
            sector = queue.pop();
        }

        let path: TopologyObjectId[] = [];
        let curSectorId: TopologyObjectId|undefined = id2;
        while (curSectorId !== undefined && prev[curSectorId] !== undefined) {
            path.splice(0, 0, curSectorId);
            curSectorId = prev[curSectorId];
        }
        path.splice(0, 0, id1);
        return path;
    }

    /**
     * Function: findFarthestSector
     * Find the farthest sector from given sector (in term of traversed sectors, not necessarily in terms of distance).
     * Parameters:
     * id - id of the origin sector
     * onlyDeadEnds - if true, only consider sectors that are dead ends (that only have one connector).
     * Returns:
     * The id of the farthest sector from origin, or NONE if none found
     */
    public findFarthestSector(id: TopologyObjectId, onlyDeadEnds: boolean = false): TopologyObjectId {
        let maxDist: number = 1;
        let farthestSectorId: TopologyObjectId = NONE;
        for (let sector of this._sectors) {
            if (sector.id !== id && (sector.isDeadEnd() || !onlyDeadEnds)) {
                let pathLength: number = this.computePath(id, sector.id).length;
                if (pathLength > maxDist) {
                    maxDist = pathLength;
                    farthestSectorId = sector.id;
                }
            }
        }
        return farthestSectorId;
    }

    public findFarthestDeadEnd(id: TopologyObjectId): TopologyObjectId {
        return this.findFarthestSector(id, true);
    }

    private getSectorFromId(id: TopologyObjectId): Sector {
        let o: TopologyObject = this.objects[id];
        if (!(o instanceof Sector)) {
            throw "TopologyMap : object " + id + " is not a sector";
        }
        return <Sector> o;
    }

    private getSectorFromPosition(pos: Core.Position): Sector {
        return this.getSectorFromId(this.objectMap[pos.x][pos.y]);
    }

    private getConnectorFromId(id: TopologyObjectId): Connector {
        let o: TopologyObject = this.objects[id];
        if (!(o instanceof Connector)) {
            throw "TopologyMap : object " + id + " is not a connector";
        }
        return <Connector> o;
    }

    private getConnectorFromPos(pos: Core.Position): Connector {
        return this.getConnectorFromId(this.objectMap[pos.x][pos.y]);
    }
}

export class TopologyAnalyzer {
    private topologyMap: TopologyMap;
    private sectorSeeds: Core.Position[] = [];

    /**
     * Function: findDungeonExits
     * Move the dungeon entry/exit so that :
     * - if there are dead ends, the exit is in a dead end
     * - maximize the distance between entry and exit
     * entry - position of the dungeon entry, updated after this call
     * exit - position of the dungeon exit, updated after this call
     * noDeadEndExit - whether exit should be searched in dead ends only or in any sector
     */
    public findDungeonExits(entry: Core.Position, exit: Core.Position, noDeadEndExit: boolean = false): void {
        let longestPathLength: number = 0;
        for (let exitSector of this.topologyMap.sectors) {
            if (noDeadEndExit || exitSector.isDeadEnd()) {
                let farthestSectorId = this.topologyMap.findFarthestSector(exitSector.id);
                if (farthestSectorId === NONE) {
                    continue;
                }
                let pathLength: number = this.topologyMap.computePath(exitSector.id, farthestSectorId).length;
                if (pathLength > longestPathLength) {
                    longestPathLength = pathLength;
                    let entrySector: Sector = this.topologyMap.getSector(farthestSectorId);
                    entry.x = entrySector.seed.x;
                    entry.y = entrySector.seed.y;
                    exit.x = exitSector.seed.x;
                    exit.y = exitSector.seed.y;
                }
            }
        }
        if (longestPathLength === 0 && !noDeadEndExit) {
            // there are no dead ends. Look for a standard sector exit
            return this.findDungeonExits(entry, exit, true);
        }
    }

    /**
     * Function: buildPuzzle
     * Build a door/key puzzle going from entry sector to exit sector.
     * This function sets the sector.key and connector.lock values so that the dungeon is always winnable.
     * Parameters:
     * entry - entry sector id
     * exit - exit sector id
     */
    public buildPuzzle(entry: TopologyObjectId, exit: TopologyObjectId, keyNumber: number = 0) {
        // compute reverse path
        let path: TopologyObjectId[] = this.topologyMap.computePath(exit, entry);
        if (path.length === 1) {
            // no path
            return;
        }
        let pathIndex: number = 0;
        let currentSector: Sector = this.topologyMap.getSector(path[pathIndex]);
        let lastConnector: Connector|undefined = undefined;
        pathIndex++;
        // find the first gut connector along the reverse path
        do {
            let nextSector: Sector = this.topologyMap.getSector(path[pathIndex]);
            pathIndex++;
            for (let connectorId of currentSector.connectors) {
                let connector: Connector = this.topologyMap.getConnector(connectorId);
                if (connector.sector1Id === nextSector.id || connector.sector2Id === nextSector.id) {
                    lastConnector = connector;
                    currentSector = nextSector;
                    break;
                }
            }
        } while (pathIndex < path.length && (lastConnector === undefined ||!lastConnector.gut));
        if (lastConnector && lastConnector.gut) {
            // found a gut connector. lock its door
            lastConnector.lock = keyNumber;
            // and find a sector to put the key
            let keySectorId = this.topologyMap.findFarthestSector(entry);
            if (keySectorId !== NONE) {
                this.topologyMap.getSector(keySectorId).key = keyNumber;
                this.topologyMap.puzzle.push({ connectorId: lastConnector.id, keySectorId: keySectorId });
                if (entry !== keySectorId) {
                    // recursion. build puzzle for the remaining path
                    this.buildPuzzle(entry, keySectorId, keyNumber + 1);
                }
            } else {
                lastConnector.lock = undefined;
            }
        }
    }

    public buildTopologyMap(map: Map, seed: Core.Position): TopologyMap {
        this.topologyMap = new TopologyMap(map.w, map.h);
        this.sectorSeeds.push(seed);
        while (this.sectorSeeds.length !== 0) {
            let pos: Core.Position|undefined = this.sectorSeeds.shift();
            // in case of doors not connecting two sectors, the other side of the door is already visited
            if (pos && this.topologyMap.getObjectId(pos) === NONE) {
                this.floodFill(map, pos.x, pos.y);
            }
        }
        this.findGuts();
        // here, connectors with an undefined sector2id represents useless doors
        // (doors connecting two parts of a same sector)
        // we keep them to add diversity to the dungeons
        return this.topologyMap;
    }

    private floodFill(map: Map, x: number, y: number) {
        let cellsToVisit: Core.Position[] = [];
        let seed: Core.Position = new Core.Position(x, y);
        let sector: Sector = this.topologyMap.createSector(seed);
        this.topologyMap.setObjectId(seed, sector.id);
        sector.cellCount++;
        cellsToVisit.push(seed);
        while (cellsToVisit.length !== 0) {
            let pos: Core.Position|undefined = cellsToVisit.shift();
            if (! pos ) {
                break;
            }
            let adjacentCells: Core.Position[] = pos.getAdjacentCells(map.w, map.h);
            for (let curpos of adjacentCells) {
                if (map.isWall(curpos.x, curpos.y) || this.topologyMap.getObjectId(curpos) === sector.id) {
                    continue;
                }
                if (this.topologyMap.getObjectId(curpos) === NONE) {
                    if (map.canWalk(curpos.x, curpos.y)) {
                        // this cell belongs to the same sector
                        this.topologyMap.setObjectId(curpos, sector.id);
                        sector.cellCount++;
                        cellsToVisit.push(curpos);
                    } else if ((curpos.x === pos.x || curpos.y === pos.y) && this.hasDoor(map, curpos)) {
                        // a new connector
                        this.topologyMap.setObjectId(curpos, this.newConnector(pos, curpos, sector.id));
                    }
                } else if (this.hasDoor(map, curpos)) {
                    // connect to an existing connector ?
                    let connector: Connector = this.topologyMap.getConnector(curpos);
                    if (connector.sector1Id !== sector.id && connector.sector2Id === undefined) {
                        connector.sector2Id = sector.id;
                        this.topologyMap.getSector(connector.sector1Id).addConnector(connector.id);
                        this.topologyMap.getSector(connector.sector2Id).addConnector(connector.id);
                    }
                }
            }
        }
    }

    private hasDoor(_map: Map, pos: Core.Position): boolean {
        return Actors.Actor.list.filter((actor: Actors.Actor) => actor.pos.equals(pos) && actor.isA("door[s]")).length > 0;
    }

    private newConnector(from: Core.Position, pos: Core.Position, sector1Id: TopologyObjectId): TopologyObjectId {
        let connector: Connector = this.topologyMap.createConnector(pos, sector1Id);
        // add a new sector seed on the other side of the door
        // note that this cell might be in the same sector as from
        // this could be used to remove useless doors
        let sectorSeed: Core.Position|undefined;
        if (from.x === pos.x - 1) {
            sectorSeed = new Core.Position(pos.x + 1, pos.y);
        } else if (from.x === pos.x + 1) {
            sectorSeed = new Core.Position(pos.x - 1, pos.y);
        } else if (from.y === pos.y - 1) {
            sectorSeed = new Core.Position(pos.x, pos.y + 1);
        } else if (from.y === pos.y + 1) {
            sectorSeed = new Core.Position(pos.x, pos.y - 1);
        }
        if ( sectorSeed) {
            this.sectorSeeds.push(sectorSeed);
        }
        return connector.id;
    }

    /**
     * Function: findGuts
     * Detect connectors that are mandatory passage from one sector to another
     */
    private findGuts() {
        for (let connector of this.topologyMap.connectors) {
            if (!connector.isDummy()) {
                connector.gut = this.computeGut(connector);
            }
        }
    }

    /**
     * Function: computeGut
     * Check whether this connector is a mandatory passage (i.e there's no alternative route).
     */
    private computeGut(connector: Connector): boolean {
        let toExplore: TopologyObjectId[] = [];
        let explored: TopologyObjectId[] = [];
        toExplore.push(connector.sector1Id);
        while (toExplore.length > 0) {
            let sectorId: TopologyObjectId|undefined = toExplore.shift();
            if (sectorId === undefined || sectorId === connector.sector2Id) {
                // found an alternative path
                return false;
            }
            explored.push(sectorId);
            let sector: Sector = this.topologyMap.getSector(sectorId);
            for (let connectorId of sector.connectors) {
                let connector2: Connector = this.topologyMap.getConnector(connectorId);
                if (connector2.id !== connector.id) {
                    if (connector2.sector1Id === sector.id && !connector2.isDummy()
                        && explored.indexOf(connector2.sector2Id) === -1) {
                        toExplore.push(connector2.sector2Id);
                    } else if (connector2.sector2Id === sector.id && explored.indexOf(connector2.sector1Id) === -1) {
                        toExplore.push(connector2.sector1Id);
                    }
                }
            }
        }
        return true;
    }
}
