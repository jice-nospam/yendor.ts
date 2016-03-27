module Game {
    "use strict";
	/********************************************************************************
	 * Group: map topology
	 ********************************************************************************/

    type TopologyObjectId = number;
    const NONE: TopologyObjectId = -1;

    abstract class TopologyObject implements Core.Comparable {
        protected _id: TopologyObjectId;
        get id() { return this._id; }
        constructor(id: TopologyObjectId) {
            this._id = id;
        }
        abstract getDescription(): string;
        equals(c: TopologyObject): boolean {
            return this._id === c.id;
        }
    }
	/**
		Class: Connector
		Represent a map cell connecting two sectors (generally a door)
	*/
    export class Connector extends TopologyObject {
        pos: Core.Position;
        sector1Id: TopologyObjectId;
        sector2Id: TopologyObjectId;
		/**
			Property: gut
			Whether there's no alternative route connecting this connectors' adjacent sectors
		*/
        gut: boolean = false;
		/**
			Property: lock
			If not undefined, this connector is locked. This is the key number
		*/
        lock: number;

		/**
			Function: isDummy
			Whether this connector connects two parts of the same sector
		*/
        isDummy(): boolean { return this.sector2Id === undefined; }

        constructor(id: TopologyObjectId, pos: Core.Position, sector1Id: TopologyObjectId) {
            super(id);
            this.pos = pos;
            this.sector1Id = sector1Id;
        }
        getDescription(): string {
            return (this.gut ? "gut " : "") + "connector " + this.id + " : "
                + this.pos.x + "-" + this.pos.y + " between " + this.sector1Id + " and " + this.sector2Id;
        }
    }

	/**
		Class: Sector
		Represent a group of connected map cells. There exists a path between any two cells of this sector.
	*/
    export class Sector extends TopologyObject {
		/**
			Property: seed
			Any cell of the sector. This is used to start the floodfilling algorithm.
		*/
        seed: Core.Position;
        cellCount: number = 0;
        private deadEnd: boolean = true;
        connectors: TopologyObjectId[] = [];
		/**
			Property: key
			If not undefined, this sector contains the key to a lock
		*/
        key: number;

        isDeadEnd(): boolean { return this.deadEnd; }

        constructor(id: TopologyObjectId, seed: Core.Position) {
            super(id);
            this.seed = seed;
        }
        getDescription(): string {
            return (this.deadEnd ? "dead end " : "") + "sector " + this.id + " : "
                + this.seed.x + "-" + this.seed.y + " (" + this.cellCount + " cells)";
        }
        addConnector(id: TopologyObjectId) {
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

    export interface PuzzleStep {
		/**
			Property: connectorId
			the connector that has the locked door
		*/
        connectorId: TopologyObjectId;
		/**
			Property: keySectorId
			the sector that contains the key
		*/
        keySectorId: TopologyObjectId;
    }

	/**
		Class: TopologyMap
		Represents the map as a list of sectors separated by connectors.
		This is used to generate door/key puzzles.
	*/
    export class TopologyMap implements Persistent {
        private width: number;
        private height: number;
        className: string;
		/**
			Property: objectMap
			Associate a topology object to each walkable map cell (either a sector or a connector)
		*/
        private objectMap: TopologyObjectId[][] = [];
		/**
			Property: objects
			All existing sectors and connectors
		*/
        private objects: TopologyObject[] = [];
        private _sectors: Sector[] = [];
        private _connectors: Connector[] = [];
        private _puzzle: PuzzleStep[] = [];

        get puzzle() { return this._puzzle; }

        get sectors() { return this._sectors; }
        get connectors() { return this._connectors; }

        constructor(width: number, height: number) {
            this.className = "TopologyMap";
            this.width = width;
            this.height = height;
            for (let x = 0; x < width; ++x) {
                this.objectMap[x] = [];
                for (let y = 0; y < height; ++y) {
                    this.objectMap[x][y] = NONE;
                }
            }
        }

        createSector(seed: Core.Position): Sector {
            let sector: Sector = new Sector(this.objects.length, seed);
            this.objects.push(sector);
            this._sectors.push(sector);
            return sector;
        }

        createConnector(pos: Core.Position, sector1Id: TopologyObjectId): Connector {
            let connector: Connector = new Connector(this.objects.length, pos, sector1Id);
            this.objects.push(connector);
            this._connectors.push(connector);
            return connector;
        }

        getObjectId(pos: Core.Position): TopologyObjectId {
            return this.objectMap[pos.x][pos.y];
        }

        setObjectId(pos: Core.Position, id: TopologyObjectId) {
            this.objectMap[pos.x][pos.y] = id;
        }

        getSector(pos: Core.Position): Sector;
        getSector(id: TopologyObjectId): Sector;
        getSector(param: any): Sector {
            if (param instanceof Core.Position) {
                return this.getSectorFromPosition(param);
            } else {
                return this.getSectorFromId(param);
            }
        }

        private getSectorFromId(id: TopologyObjectId): Sector {
            let o: TopologyObject = this.objects[id];
            if (!(o instanceof Sector)) {
                throw "TopologyMap : object " + id + " is not a sector";
            }
            return <Sector>o;
        }

        private getSectorFromPosition(pos: Core.Position): Sector {
            return this.getSectorFromId(this.objectMap[pos.x][pos.y]);
        }

        getConnector(pos: Core.Position): Connector;
        getConnector(id: TopologyObjectId): Connector;
        getConnector(param: any): Connector {
            if (param instanceof Core.Position) {
                return this.getConnectorFromPos(param);
            } else {
                return this.getConnectorFromId(param);
            }
        }

        private getConnectorFromId(id: TopologyObjectId): Connector {
            let o: TopologyObject = this.objects[id];
            if (!(o instanceof Connector)) {
                throw "TopologyMap : object " + id + " is not a connector";
            }
            return <Connector>o;
        }

        private getConnectorFromPos(pos: Core.Position): Connector {
            return this.getConnectorFromId(this.objectMap[pos.x][pos.y]);
        }

        getRandomPositionInSector(id: TopologyObjectId, rng: Yendor.Random): Core.Position {
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
			Function: computePath
			Compute the shortest path between two sectors using Dijkstra algorithm adapted from http://en.wikipedia.org/wiki/Dijkstra%27s_algorithm.

			Parameters:
			id1 - id of the origin sector
			id2 - id of the destinaton sector

			Returns:
			the list of traversed sectors ids, starting with id1 and ending with id2. If no path is found, 
			returns an array containing only id1.
		*/
        computePath(id1: TopologyObjectId, id2: TopologyObjectId): TopologyObjectId[] {
            let dist: number[] = [];
            let prev: number[] = [];
            let queue: Yendor.BinaryHeap<Sector> = new Yendor.BinaryHeap((o: Sector) => { return dist[o.id]; });
            dist[id1] = 0;
            prev[id1] = undefined;
            queue.push(<Sector>this.objects[id1]);

            while (!queue.isEmpty()) {
                // get sector with lowest distance
                let sector: Sector = queue.pop();
                if (sector.id === id2) {
                    break;
                }
                for (let i: number = 0, len: number = sector.connectors.length; i < len; ++i) {
                    let connectorId: TopologyObjectId = sector.connectors[i];
                    let connector: Connector = <Connector>this.objects[connectorId];
                    if (connector.lock === undefined) {
                        let sector2Id: TopologyObjectId = connector.sector1Id === sector.id ? connector.sector2Id : connector.sector1Id;
                        let altDist: number = dist[sector.id] + 1;
                        if (dist[sector2Id] === undefined || dist[sector2Id] > altDist) {
                            let sector2: Sector = <Sector>this.objects[sector2Id];
                            dist[sector2Id] = altDist;
                            prev[sector2Id] = sector.id;
                            if (!queue.contains(sector2)) {
                                queue.push(sector2);
                            }
                        }
                    }
                }
            }

            let path: TopologyObjectId[] = [];
            let curSectorId: TopologyObjectId = id2;
            while (prev[curSectorId] !== undefined) {
                path.splice(0, 0, curSectorId);
                curSectorId = prev[curSectorId];
            }
            path.splice(0, 0, id1);
            return path;
        }

		/**
			Function: findFarthestSector
			Find the farthest sector from given sector (in term of traversed sectors, not necessarily in terms of distance).

			Parameters:
			id - id of the origin sector

			Returns:
			The id of the farthest sector from origin, or NONE if none found
		*/
        findFarthestSector(id: TopologyObjectId, onlyDeadEnds: boolean = false): TopologyObjectId {
            let maxDist: number = 1;
            let farthestSectorId: TopologyObjectId = NONE;
            for (let i: number = 0, len: number = this._sectors.length; i < len; ++i) {
                let sector: Sector = this._sectors[i];
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

        findFarthestDeadEnd(id: TopologyObjectId): TopologyObjectId {
            return this.findFarthestSector(id, true);
        }

        log() {
            for (let i: number = 0, len: number = this.objects.length; i < len; ++i) {
                let obj: TopologyObject = this.objects[i];
                console.log(obj.getDescription());
            }
        }
    }

    export class TopologyAnalyzer {
        private topologyMap: TopologyMap;
        private sectorSeeds: Core.Position[] = [];

        private floodFill(map: Map, x: number, y: number) {
            let cellsToVisit: Core.Position[] = [];
            let seed: Core.Position = new Core.Position(x, y);
            let sector: Sector = this.topologyMap.createSector(seed);
            this.topologyMap.setObjectId(seed, sector.id);
            sector.cellCount++;
            cellsToVisit.push(seed);
            while (cellsToVisit.length !== 0) {
                let pos: Core.Position = cellsToVisit.shift();
                let adjacentCells: Core.Position[] = pos.getAdjacentCells(map.w, map.h);
                for (let i: number = 0, len: number = adjacentCells.length; i < len; ++i) {
                    let curpos: Core.Position = adjacentCells[i];
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

        private hasDoor(map: Map, pos: Core.Position): boolean {
            let items: Actor[] = Engine.instance.actorManager.findActorsOnCell(pos, Engine.instance.actorManager.getItemIds());
            if (items.length === 0) {
                return false;
            }
            for (let i: number = 0, len: number = items.length; i < len; ++i) {
                if (items[i].door) {
                    return true;
                }
            }
            return false;
        }

        private newConnector(from: Core.Position, pos: Core.Position, sector1Id: TopologyObjectId): TopologyObjectId {
            let connector: Connector = this.topologyMap.createConnector(pos, sector1Id);
            // add a new sector seed on the other side of the door
            // note that this cell might be in the same sector as from
            // this could be used to remove useless doors
            let sectorSeed: Core.Position;
            if (from.x === pos.x - 1) {
                sectorSeed = new Core.Position(pos.x + 1, pos.y);
            } else if (from.x === pos.x + 1) {
                sectorSeed = new Core.Position(pos.x - 1, pos.y);
            } else if (from.y === pos.y - 1) {
                sectorSeed = new Core.Position(pos.x, pos.y + 1);
            } else if (from.y === pos.y + 1) {
                sectorSeed = new Core.Position(pos.x, pos.y - 1);
            }
            this.sectorSeeds.push(sectorSeed);
            return connector.id;
        }

		/**
			Function: findGuts
			Detect connectors that are mandatory passage from one sector to another
		*/
        private findGuts() {
            for (let i: number = 0, len: number = this.topologyMap.connectors.length; i < len; ++i) {
                let connector: Connector = this.topologyMap.connectors[i];
                if (!connector.isDummy()) {
                    connector.gut = this.computeGut(connector);
                }
            }
        }

		/**
			Function: computeGut
			Check whether this connector is a mandatory passage (i.e there's no alternative route).
		*/
        private computeGut(connector: Connector): boolean {
            let toExplore: TopologyObjectId[] = [];
            let explored: TopologyObjectId[] = [];
            toExplore.push(connector.sector1Id);
            while (toExplore.length > 0) {
                let sectorId: TopologyObjectId = toExplore.shift();
                if (sectorId === connector.sector2Id) {
                    // found an alternative path
                    return false;
                }
                explored.push(sectorId);
                let sector: Sector = this.topologyMap.getSector(sectorId);
                for (let i: number = 0, len: number = sector.connectors.length; i < len; ++i) {
                    let connector2: Connector = this.topologyMap.getConnector(sector.connectors[i]);
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

		/**
			Function: findDungeonExits
			Move the dungeon entry/exit so that :
			* if there are dead ends, the exit is in a dead end
			* maximize the distance between entry and exit
			entry - position of the dungeon entry, updated after this call
			exit - position of the dungeon exit, updated after this call
			noDeadEndExit - whether exit should be searched in dead ends only or in any sector
		*/
        findDungeonExits(entry: Core.Position, exit: Core.Position, noDeadEndExit: boolean = false) {
            let longestPathLength: number = 0;
            for (let i: number = 0, len: number = this.topologyMap.sectors.length; i < len; ++i) {
                let exitSector: Sector = this.topologyMap.sectors[i];
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
			Function: buildPuzzle
			Build a door/key puzzle going from entry sector to exit sector.
			This function sets the sector.key and connector.lock values so that the dungeon is always winnable.
			Parameters:
			entry - entry sector id
			exit - exit sector id
		*/
        buildPuzzle(entry: TopologyObjectId, exit: TopologyObjectId, keyNumber: number = 0) {
            // compute reverse path
            let path: TopologyObjectId[] = this.topologyMap.computePath(exit, entry);
            if (path.length === 1) {
                // no path
                return;
            }
            let pathIndex: number = 0;
            let currentSector: Sector = this.topologyMap.getSector(path[pathIndex]);
            let lastConnector: Connector = undefined;
            pathIndex++;
            // find the first gut connector along the reverse path
            do {
                let nextSector: Sector = this.topologyMap.getSector(path[pathIndex]);
                pathIndex++;
                for (let i: number = 0, len: number = currentSector.connectors.length; i < len; ++i) {
                    let connector: Connector = this.topologyMap.getConnector(currentSector.connectors[i]);
                    if (connector.sector1Id === nextSector.id || connector.sector2Id === nextSector.id) {
                        lastConnector = connector;
                        currentSector = nextSector;
                        break;
                    }
                }
            } while (pathIndex < path.length && !lastConnector.gut);
            if (lastConnector.gut) {
                // found a gut connector. lock its door
                lastConnector.lock = keyNumber;
                // and find a sector to put the key
                let keySectorId = this.topologyMap.findFarthestSector(entry);
                if (keySectorId !== NONE) {
                    this.topologyMap.getSector(keySectorId).key = keyNumber;
                    if (Yendor.urlParams[Constants.URL_PARAM_DEBUG]) {
                        console.log("Lock connector " + lastConnector.id + " key is in sector " + keySectorId);
                    }
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

        buildTopologyMap(map: Map, seed: Core.Position): TopologyMap {
            this.topologyMap = new TopologyMap(map.w, map.h);
            this.sectorSeeds.push(seed);
            while (this.sectorSeeds.length !== 0) {
                let pos: Core.Position = this.sectorSeeds.shift();
                // in case of doors not connecting two sectors, the other side of the door is already visited
                if (this.topologyMap.getObjectId(pos) === NONE) {
                    this.floodFill(map, pos.x, pos.y);
                }
            }
            this.findGuts();
            // here, connectors with an undefined sector2id represents useless doors
            // (doors connecting two parts of a same sector)
            // we keep them for the fun
            if (Yendor.urlParams[Constants.URL_PARAM_DEBUG]) {
                this.topologyMap.log();
            }
            return this.topologyMap;
        }
    }
}
