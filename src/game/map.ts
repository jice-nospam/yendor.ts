module Game {
    "use strict";

	/*
		Class: Tile
		Properties of a map cell. The 'isTransparent' property is stored in the Yendor.Fov class.
	*/
    export class Tile {
        explored: boolean = false;
        isWall: boolean = true;
        isWalkable: boolean = false;
        scentAmount: number = 0;
    }

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
	/*
		Class: Connector
		Represent a map cell connecting two sectors (generally a door)
	*/
    export class Connector extends TopologyObject {
        pos: Core.Position;
        sector1Id: TopologyObjectId;
        sector2Id: TopologyObjectId;
		/*
			Property: gut
			Whether there's no alternative route connecting this connectors' adjacent sectors
		*/
        gut: boolean = false;
		/*
			Property: lock
			If not undefined, this connector is locked. This is the key number
		*/
        lock: number;

		/*
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

	/*
		Class: Sector
		Represent a group of connected map cells. There exists a path between any two cells of this sector.
	*/
    export class Sector extends TopologyObject {
		/*
			Property: seed
			Any cell of the sector. This is used to start the floodfilling algorithm.
		*/
        seed: Core.Position;
        cellCount: number = 0;
        private deadEnd: boolean = true;
        connectors: TopologyObjectId[] = [];
		/*
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
		/*
			Property: connectorId
			the connector that has the locked door
		*/
        connectorId: TopologyObjectId;
		/*
			Property: keySectorId
			the sector that contains the key
		*/
        keySectorId: TopologyObjectId;
    }

	/*
		Class: TopologyMap
		Represents the map as a list of sectors separated by connectors.
		This is used to generate door/key puzzles.
	*/
    export class TopologyMap {
        private width: number;
        private height: number;
		/*
			Property: objectMap
			Associate a topology object to each walkable map cell (either a sector or a connector)
		*/
        private objectMap: TopologyObjectId[][] = [];
		/*
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
            this.width = width;
            this.height = height;
            for (var x = 0; x < width; ++x) {
                this.objectMap[x] = [];
                for (var y = 0; y < height; ++y) {
                    this.objectMap[x][y] = NONE;
                }
            }
        }

        createSector(seed: Core.Position): Sector {
            var sector: Sector = new Sector(this.objects.length, seed);
            this.objects.push(sector);
            this._sectors.push(sector);
            return sector;
        }

        createConnector(pos: Core.Position, sector1Id: TopologyObjectId): Connector {
            var connector: Connector = new Connector(this.objects.length, pos, sector1Id);
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
            var o: TopologyObject = this.objects[id];
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
            var o: TopologyObject = this.objects[id];
            if (!(o instanceof Connector)) {
                throw "TopologyMap : object " + id + " is not a connector";
            }
            return <Connector>o;
        }

        private getConnectorFromPos(pos: Core.Position): Connector {
            return this.getConnectorFromId(this.objectMap[pos.x][pos.y]);
        }

        getRandomPositionInSector(id: TopologyObjectId, rng: Yendor.Random): Core.Position {
            var pos: Core.Position = new Core.Position(-1, 0);
            var sector: Sector = this.getSectorFromId(id);
            var cellNum: number = rng.getNumber(1, sector.cellCount);
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

		/*
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
            var dist: number[] = [];
            var prev: number[] = [];
            var queue: Yendor.BinaryHeap<Sector> = new Yendor.BinaryHeap((o: Sector) => { return dist[o.id]; });
            dist[id1] = 0;
            prev[id1] = undefined;
            queue.push(<Sector>this.objects[id1]);

            while (!queue.isEmpty()) {
                // get sector with lowest distance
                var sector: Sector = queue.pop();
                if (sector.id === id2) {
                    break;
                }
                for (var i: number = 0, len: number = sector.connectors.length; i < len; ++i) {
                    var connectorId: TopologyObjectId = sector.connectors[i];
                    var connector: Connector = <Connector>this.objects[connectorId];
                    if (connector.lock === undefined) {
                        var sector2Id: TopologyObjectId = connector.sector1Id === sector.id ? connector.sector2Id : connector.sector1Id;
                        var altDist: number = dist[sector.id] + 1;
                        if (dist[sector2Id] === undefined || dist[sector2Id] > altDist) {
                            var sector2: Sector = <Sector>this.objects[sector2Id];
                            dist[sector2Id] = altDist;
                            prev[sector2Id] = sector.id;
                            if (!queue.contains(sector2)) {
                                queue.push(sector2);
                            }
                        }
                    }
                }
            }

            var path: TopologyObjectId[] = [];
            var curSectorId: TopologyObjectId = id2;
            while (prev[curSectorId] !== undefined) {
                path.splice(0, 0, curSectorId);
                curSectorId = prev[curSectorId];
            }
            path.splice(0, 0, id1);
            return path;
        }

		/*
			Function: findFarthestSector
			Find the farthest sector from given sector (in term of traversed sectors, not necessarily in terms of distance).

			Parameters:
			id - id of the origin sector

			Returns:
			The id of the farthest sector from origin, or NONE if none found
		*/
        findFarthestSector(id: TopologyObjectId, onlyDeadEnds: boolean = false): TopologyObjectId {
            var maxDist: number = 1;
            var farthestSectorId: TopologyObjectId = NONE;
            for (var i: number = 0, len: number = this._sectors.length; i < len; ++i) {
                var sector: Sector = this._sectors[i];
                if (sector.id !== id && (sector.isDeadEnd() || !onlyDeadEnds)) {
                    var pathLength: number = this.computePath(id, sector.id).length;
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
            for (var i: number = 0, len: number = this.objects.length; i < len; ++i) {
                var obj: TopologyObject = this.objects[i];
                console.log(obj.getDescription());
            }
        }
    }

    export class TopologyAnalyzer {
        private topologyMap: TopologyMap;
        private sectorSeeds: Core.Position[] = [];

        private floodFill(map: Map, x: number, y: number) {
            var cellsToVisit: Core.Position[] = [];
            var seed: Core.Position = new Core.Position(x, y);
            var sector: Sector = this.topologyMap.createSector(seed);
            this.topologyMap.setObjectId(seed, sector.id);
            sector.cellCount++;
            cellsToVisit.push(seed);
            while (cellsToVisit.length !== 0) {
                var pos: Core.Position = cellsToVisit.shift();
                var adjacentCells: Core.Position[] = pos.getAdjacentCells(map.width, map.height);
                for (var i: number = 0, len: number = adjacentCells.length; i < len; ++i) {
                    var curpos: Core.Position = adjacentCells[i];
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
                        var connector: Connector = this.topologyMap.getConnector(curpos);
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
            var items: Actor[] = Engine.instance.actorManager.findActorsOnCell(pos, Engine.instance.actorManager.getItemIds());
            if (items.length === 0) {
                return false;
            }
            for (var i: number = 0, len: number = items.length; i < len; ++i) {
                if (items[i].door) {
                    return true;
                }
            }
            return false;
        }

        private newConnector(from: Core.Position, pos: Core.Position, sector1Id: TopologyObjectId): TopologyObjectId {
            var connector: Connector = this.topologyMap.createConnector(pos, sector1Id);
            // add a new sector seed on the other side of the door
            // note that this cell might be in the same sector as from
            // this could be used to remove useless doors
            var sectorSeed: Core.Position;
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

		/*
			Function: findGuts
			Detect connectors that are mandatory passage from one sector to another
		*/
        private findGuts() {
            for (var i: number = 0, len: number = this.topologyMap.connectors.length; i < len; ++i) {
                var connector: Connector = this.topologyMap.connectors[i];
                if (!connector.isDummy()) {
                    connector.gut = this.computeGut(connector);
                }
            }
        }

		/*
			Function: computeGut
			Check whether this connector is a mandatory passage (i.e there's no alternative route).
		*/
        private computeGut(connector: Connector): boolean {
            var toExplore: TopologyObjectId[] = [];
            var explored: TopologyObjectId[] = [];
            toExplore.push(connector.sector1Id);
            while (toExplore.length > 0) {
                var sectorId: TopologyObjectId = toExplore.shift();
                if (sectorId === connector.sector2Id) {
                    // found an alternative path
                    return false;
                }
                explored.push(sectorId);
                var sector: Sector = this.topologyMap.getSector(sectorId);
                for (var i: number = 0, len: number = sector.connectors.length; i < len; ++i) {
                    var connector2: Connector = this.topologyMap.getConnector(sector.connectors[i]);
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

		/*
			Function: findDungeonExits
			Move the dungeon entry/exit so that :
			* if there are dead ends, the exit is in a dead end
			* maximize the distance between entry and exit
			entry - position of the dungeon entry, updated after this call
			exit - position of the dungeon exit, updated after this call
			noDeadEndExit - whether exit should be searched in dead ends only or in any sector
		*/
        findDungeonExits(entry: Core.Position, exit: Core.Position, noDeadEndExit: boolean = false) {
            var longestPathLength: number = 0;
            for (var i: number = 0, len: number = this.topologyMap.sectors.length; i < len; ++i) {
                var exitSector: Sector = this.topologyMap.sectors[i];
                if (noDeadEndExit || exitSector.isDeadEnd()) {
                    var farthestSectorId = this.topologyMap.findFarthestSector(exitSector.id);
                    if (farthestSectorId === NONE) {
                        continue;
                    }
                    var pathLength: number = this.topologyMap.computePath(exitSector.id, farthestSectorId).length;
                    if (pathLength > longestPathLength) {
                        longestPathLength = pathLength;
                        var entrySector: Sector = this.topologyMap.getSector(farthestSectorId);
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

		/*
			Function: buildPuzzle
			Build a door/key puzzle going from entry sector to exit sector.
			This function sets the sector.key and connector.lock values so that the dungeon is always winnable.
			Parameters:
			entry - entry sector id
			exit - exit sector id
		*/
        buildPuzzle(entry: TopologyObjectId, exit: TopologyObjectId, keyNumber: number = 0) {
            // compute reverse path
            var path: TopologyObjectId[] = this.topologyMap.computePath(exit, entry);
            if (path.length === 1) {
                // no path
                return;
            }
            var pathIndex: number = 0;
            var currentSector: Sector = this.topologyMap.getSector(path[pathIndex]);
            var lastConnector: Connector = undefined;
            pathIndex++;
            // find the first gut connector along the reverse path
            do {
                var nextSector: Sector = this.topologyMap.getSector(path[pathIndex]);
                pathIndex++;
                for (var i: number = 0, len: number = currentSector.connectors.length; i < len; ++i) {
                    var connector: Connector = this.topologyMap.getConnector(currentSector.connectors[i]);
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
                var keySectorId = this.topologyMap.findFarthestSector(entry);
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
            this.topologyMap = new TopologyMap(map.width, map.height);
            this.sectorSeeds.push(seed);
            while (this.sectorSeeds.length !== 0) {
                var pos: Core.Position = this.sectorSeeds.shift();
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

    export class AbstractDungeonBuilder {
        private dungeonLevel: number;
        private _topologyMap: TopologyMap;
        protected rng: Yendor.Random;

        get topologyMap() { return this._topologyMap; }

        constructor(dungeonLevel: number) {
            this.dungeonLevel = dungeonLevel;
            this.rng = new Yendor.ComplementaryMultiplyWithCarryRandom();
        }

        protected dig(map: Map, x1: number, y1: number, x2: number, y2: number) {
            // sort coordinates
            if (x2 < x1) {
                var tmp: number = x2;
                x2 = x1;
                x1 = tmp;
            }
            if (y2 < y1) {
                var tmp2: number = y2;
                y2 = y1;
                y1 = tmp2;
            }
            // never dig on map border
            if (x1 === 0) {
                x1 = 1;
            }
            if (y1 === 0) {
                y1 = 1;
            }
            if (x2 === map.width - 1) {
                x2--;
            }
            if (y2 === map.height - 1) {
                y2--;
            }
            // dig
            for (var tilex: number = x1; tilex <= x2; tilex++) {
                for (var tiley: number = y1; tiley <= y2; tiley++) {
                    if (map.isWall(tilex, tiley)) {
                        map.setFloor(tilex, tiley);
                    }
                }
            }
        }

        protected createRoom(map: Map, first: boolean, x1: number, y1: number, x2: number, y2: number) {
            this.dig(map, x1, y1, x2, y2);
            if (first) {
                // put the player and stairs up in the first room
                var player: Actor = Engine.instance.actorManager.getPlayer();
                var stairsUp: Actor = Engine.instance.actorManager.getStairsUp();
                player.x = Math.floor((x1 + x2) / 2);
                player.y = Math.floor((y1 + y2) / 2);
                stairsUp.x = player.x;
                stairsUp.y = player.y;
            } else {
                this.createMonsters(x1, y1, x2, y2, map);
                this.createItems(x1, y1, x2, y2, map);
                // stairs down will be in the last room
                var stairsDown: Actor = Engine.instance.actorManager.getStairsDown();
                stairsDown.x = Math.floor((x1 + x2) / 2);
                stairsDown.y = Math.floor((y1 + y2) / 2);
            }
        }

        protected createDoor(pos: Core.Position) {
            var probabilities: { [index: string]: number; } = {};
            probabilities[ActorType.WOODEN_DOOR] = 80;
            probabilities[ActorType.IRON_PORTCULLIS] = 20;
            var doorType: ActorType = <ActorType>this.rng.getRandomChance(probabilities);
            Engine.instance.actorManager.addItem(ActorFactory.create(doorType, pos.x, pos.y));
        }

        protected getDoor(pos: Core.Position): Actor {
            var doors: Actor[] = Engine.instance.actorManager.filter(function(actor: Actor): boolean {
                return actor.x === pos.x && actor.y === pos.y && actor.door !== undefined;
            });
            return doors.length === 0 ? undefined : doors[0];
        }

        protected findVDoorPosition(map: Map, x: number, y1: number, y2: number) {
            var y = y1 < y2 ? y1 : y2;
            var endy = y1 < y2 ? y2 : y1;
            do {
                if (this.isAVDoorPosition(map, x, y)) {
                    return new Core.Position(x, y);
                }
                y++;
            } while (y !== endy + 1);
            return undefined;
        }

        protected findHDoorPosition(map: Map, x1: number, x2: number, y: number) {
            var x = x1 < x2 ? x1 : x2;
            var endx = x1 < x2 ? x2 : x1;
            do {
                if (this.isAHDoorPosition(map, x, y)) {
                    return new Core.Position(x, y);
                }
                x++;
            } while (x !== endx + 1);
            return undefined;
        }

        private isEmptyCell(map: Map, x: number, y: number): boolean {
            if (!map.canWalk(x, y)) {
                return false;
            }
            var items: Actor[] = Engine.instance.actorManager.findActorsOnCell(new Core.Position(x, y), Engine.instance.actorManager.getItemIds());
            if (items.length === 0) {
                return true;
            }
            return false;
        }

        private isAHDoorPosition(map: Map, x: number, y: number): boolean {
            return map.isWall(x, y - 1) && map.isWall(x, y + 1) && this.isEmptyCell(map, x, y)
                && this.isEmptyCell(map, x + 1, y) && this.isEmptyCell(map, x - 1, y);
        }

        private isAVDoorPosition(map: Map, x: number, y: number): boolean {
            return map.isWall(x - 1, y) && map.isWall(x + 1, y) && this.isEmptyCell(map, x, y)
                && this.isEmptyCell(map, x, y + 1) && this.isEmptyCell(map, x, y - 1);
        }

        protected isADoorPosition(map: Map, x: number, y: number) {
            return this.isAHDoorPosition(map, x, y) || this.isAVDoorPosition(map, x, y);
        }

        protected findFloorTile(x: number, y: number, w: number, h: number, map: Map): Core.Position {
            var pos: Core.Position = new Core.Position(Math.floor(x + w / 2), Math.floor(y + h / 2));
            while (map.isWall(pos.x, pos.y)) {
                pos.x++;
                if (pos.x === x + w) {
                    pos.x = x;
                    pos.y++;
                    if (pos.y === y + h) {
                        pos.y = y;
                    }
                }
            }
            return pos;
        }

		/*
			Function: getValueForDungeon
			Get a value adapted to current dungeon level.
			Parameters:
			steps: array of (dungeon level, value) pairs 
		*/
        private getValueForDungeon(steps: number[][]): number {
            var stepCount = steps.length;
            for (var step = stepCount - 1; step >= 0; --step) {
                if (this.dungeonLevel >= steps[step][0]) {
                    return steps[step][1];
                }
            }
            return 0;
        }

        private createMonster(x: number, y: number) {
            var probabilities: { [index: string]: number; } = {};
            probabilities[ActorType.GOBLIN] = 60;
            probabilities[ActorType.ORC] = 30;
            // no trolls before level 3. then probability 10/(60+30+10)=0.1 until level 5, 
            // 20/(60+30+20)=0.18 until level 7 and 30/(60+30+30)=0.23 beyond
            probabilities[ActorType.TROLL] = this.getValueForDungeon([[3, 10], [5, 20], [7, 30]]);
            var monster: ActorType = <ActorType>this.rng.getRandomChance(probabilities);
            return ActorFactory.create(monster, x, y);
        }

        private createItem(x: number, y: number) {
            var probabilities: { [index: string]: number; } = {};
            probabilities[ActorType.HEALTH_POTION] = this.getValueForDungeon([[0, 40], [5, 30]]);
            probabilities[ActorType.REGENERATION_POTION] = this.getValueForDungeon([[5, 5]]);
            probabilities[ActorType.LIGHTNING_BOLT_SCROLL] = this.getValueForDungeon([[3, 10]]);
            probabilities[ActorType.FIREBALL_SCROLL] = 10;
            probabilities[ActorType.CONFUSION_SCROLL] = 10;
            probabilities[ActorType.BONE_ARROW] = 5;
            probabilities[ActorType.IRON_ARROW] = 5;
            probabilities[ActorType.BOLT] = 5;
            probabilities[ActorType.SHORT_BOW] = this.getValueForDungeon([[1, 1]]);
            probabilities[ActorType.LONG_BOW] = this.getValueForDungeon([[5, 1]]);
            probabilities[ActorType.CROSSBOW] = this.getValueForDungeon([[3, 1]]);
            probabilities[ActorType.SHORT_SWORD] = this.getValueForDungeon([[4, 1], [12, 0]]);
            probabilities[ActorType.FROST_WAND] = this.getValueForDungeon([[4, 1]]);
            probabilities[ActorType.TELEPORT_STAFF] = this.getValueForDungeon([[7, 1]]);
            probabilities[ActorType.WOODEN_SHIELD] = this.getValueForDungeon([[2, 1], [12, 0]]);
            probabilities[ActorType.LONG_SWORD] = this.getValueForDungeon([[6, 1]]);
            probabilities[ActorType.IRON_SHIELD] = this.getValueForDungeon([[7, 1]]);
            probabilities[ActorType.GREAT_SWORD] = this.getValueForDungeon([[8, 1]]);
            var item: ActorType = <ActorType>this.rng.getRandomChance(probabilities);
            return ActorFactory.create(item, x, y);
        }

        private createMonsters(x1: number, y1: number, x2: number, y2: number, map: Map) {
            var monsterCount = this.rng.getNumber(0, Constants.MAX_MONSTERS_PER_ROOM);
            if (Yendor.urlParams[Constants.URL_PARAM_NO_MONSTER]) {
                monsterCount = 0;
            }
            while (monsterCount > 0) {
                var x = this.rng.getNumber(x1, x2);
                var y = this.rng.getNumber(y1, y2);
                if (map.canWalk(x, y)) {
                    Engine.instance.actorManager.addCreature(this.createMonster(x, y));
                }
                monsterCount--;
            }
        }

        private createItems(x1: number, y1: number, x2: number, y2: number, map: Map) {
            var itemCount = this.rng.getNumber(0, Constants.MAX_ITEMS_PER_ROOM);
            while (itemCount > 0) {
                var x = this.rng.getNumber(x1, x2);
                var y = this.rng.getNumber(y1, y2);
                if (map.canWalk(x, y)) {
                    Engine.instance.actorManager.addItem(this.createItem(x, y));
                }
                itemCount--;
            }
        }

        protected digMap(map: Map) {
            // to be implemented by descendants
        }

        build(map: Map) {
            this.digMap(map);
            var analyzer: TopologyAnalyzer = new TopologyAnalyzer();
            // find suitable dungeon entry and exit
            var player: Actor = Engine.instance.actorManager.getPlayer();
            var stairsUp: Actor = Engine.instance.actorManager.getStairsUp();
            var stairsDown: Actor = Engine.instance.actorManager.getStairsDown();
            this._topologyMap = analyzer.buildTopologyMap(map, stairsDown);
            analyzer.findDungeonExits(player, stairsDown);
            analyzer.buildPuzzle(this._topologyMap.getObjectId(player), this._topologyMap.getObjectId(stairsDown));
            stairsUp.x = player.x;
            stairsUp.y = player.y;
            if (Yendor.urlParams[Constants.URL_PARAM_DEBUG]) {
                console.log("Entry : " + this._topologyMap.getObjectId(player)
                    + "(" + player.x + "-" + player.y + ")");
                console.log("Exit : " + this._topologyMap.getObjectId(stairsDown)
                    + "(" + stairsDown.x + "-" + stairsDown.y + ")");
            }
            this.applyPuzzle();
        }

		/*
			Function: applyPuzzle
			actually implement the puzzle by locking doors and putting keys in the dungeon
		*/
        private applyPuzzle() {
            for (var i: number = 0, len: number = this._topologyMap.puzzle.length; i < len; ++i) {
                var prob: number = this.rng.getNumber(0.0, 1.0);
                if ( prob > Constants.PUZZLE_STEP_PROBABILITY ) {
                    // skip this lock
                    continue;
                }
                var puzzleStep: PuzzleStep = this._topologyMap.puzzle[i];
                var connector: Connector = this._topologyMap.getConnector(puzzleStep.connectorId);
                var door: Actor = this.getDoor(connector.pos);
                if (!door) {
                    throw "Error : connector " + connector.id + " with no door";
                }
                // found a door to be locked. look for a position for the key
                var pos: Core.Position = this._topologyMap.getRandomPositionInSector(puzzleStep.keySectorId, this.rng);
                var key: Actor = ActorFactory.create(ActorType.KEY, pos.x, pos.y);
                Engine.instance.actorManager.addItem(key);
                ActorFactory.setLock(door, key);
            }
        }
    }

    export class BspDungeonBuilder extends AbstractDungeonBuilder {
        private firstRoom: boolean = true;
        private potentialDoorPos: Core.Position[] = [];
        constructor(dungeonLevel: number) {
            super(dungeonLevel);
        }

        private createRandomRoom(node: Yendor.BSPNode, map: Map) {
            var x, y, w, h: number;
            var horiz: boolean = node.parent.horiz;
            if (horiz) {
                w = this.rng.getNumber(Constants.ROOM_MIN_SIZE, node.w - 1);
                h = this.rng.getNumber(Constants.ROOM_MIN_SIZE, node.h - 2);
                if (node === node.parent.leftChild) {
                    x = this.rng.getNumber(node.x + 1, node.x + node.w - w);
                } else {
                    x = this.rng.getNumber(node.x, node.x + node.w - w);
                }
                y = this.rng.getNumber(node.y + 1, node.y + node.h - h);
            } else {
                w = this.rng.getNumber(Constants.ROOM_MIN_SIZE, node.w - 2);
                h = this.rng.getNumber(Constants.ROOM_MIN_SIZE, node.h - 1);
                if (node === node.parent.leftChild) {
                    y = this.rng.getNumber(node.y + 1, node.y + node.h - h);
                } else {
                    y = this.rng.getNumber(node.y, node.y + node.h - h);
                }
                x = this.rng.getNumber(node.x + 1, node.x + node.w - w);
            }
            this.createRoom(map, this.firstRoom, x, y, x + w - 1, y + h - 1);
            this.firstRoom = false;
        }

        private connectChildren(node: Yendor.BSPNode, map: Map) {
            var left: Yendor.BSPNode = node.leftChild;
            var right: Yendor.BSPNode = node.rightChild;
            var leftPos: Core.Position = this.findFloorTile(left.x, left.y, left.w, left.h, map);
            var rightPos: Core.Position = this.findFloorTile(right.x, right.y, right.w, right.h, map);
            this.dig(map, leftPos.x, leftPos.y, leftPos.x, rightPos.y);
            this.dig(map, leftPos.x, rightPos.y, rightPos.x, rightPos.y);
            // try to find a potential door position
            var doorPos: Core.Position = this.findVDoorPosition(map, leftPos.x, leftPos.y, rightPos.y);
            if (!doorPos) {
                doorPos = this.findHDoorPosition(map, leftPos.x, rightPos.x, rightPos.y);
            }
            if (doorPos) {
                // we can't place the door right now as wall can still be digged
                // the door might end in the middle of a room.
                this.potentialDoorPos.push(doorPos);
            }
        }

        private createDoors(map: Map) {
            for (var i: number = 0, len: number = this.potentialDoorPos.length; i < len; ++i) {
                var pos: Core.Position = this.potentialDoorPos[i];
                if (this.isADoorPosition(map, pos.x, pos.y)) {
                    this.createDoor(pos);
                }
            }
        }

        private visitNode(node: Yendor.BSPNode, userData: any): Yendor.BSPTraversalAction {
            var map: Map = <Map>userData;
            if (node.isLeaf()) {
                this.createRandomRoom(node, map);
            } else {
                this.connectChildren(node, map);
            }
            return Yendor.BSPTraversalAction.CONTINUE;
        }

        protected digMap(map: Map) {
            var bsp: Yendor.BSPNode = new Yendor.BSPNode(0, 0, map.width, map.height);
            bsp.splitRecursive(undefined, 8, Constants.ROOM_MIN_SIZE, 1.5);
            bsp.traverseInvertedLevelOrder(this.visitNode.bind(this), map);
            this.createDoors(map);
        }
    }

    export class Map implements Persistent {
        className: string;
        private tiles: Tile[][];
        private map: Yendor.Fov;
        private _currentScentValue: number = Constants.SCENT_THRESHOLD;
        private _width: number;
        private _height: number;
        // whether we must recompute fov
        private _dirty: boolean = true;

        constructor() {
            this.className = "Map";
        }

        init(_width: number, _height: number) {
            this._width = _width;
            this._height = _height;
            this.tiles = [];
            this.map = new Yendor.Fov(_width, _height);
            for (var x = 0; x < this._width; x++) {
                this.tiles[x] = [];
                for (var y = 0; y < this._height; y++) {
                    this.tiles[x][y] = new Tile();
                }
            }
        }

        get width() { return this._width; }
        get height() { return this._height; }
        get currentScentValue() { return this._currentScentValue; }
        setDirty() { this._dirty = true; }

        isWall(x: number, y: number): boolean {
            if (this.tiles[x] && this.tiles[x][y]) {
                return this.tiles[x][y].isWall;
            }
            return true;
        }

        canWalk(x: number, y: number): boolean {
            if (this.isWall(x, y)) {
                return false;
            }
            var pos: Core.Position = new Core.Position(x, y);
            var actorManager: ActorManager = Engine.instance.actorManager;
            var actorsOnCell: Actor[] = actorManager.findActorsOnCell(pos, actorManager.getItemIds());
            actorsOnCell = actorsOnCell.concat(actorManager.findActorsOnCell(pos, actorManager.getCreatureIds()));
            for (var i: number = 0; i < actorsOnCell.length; i++) {
                var actor: Actor = actorsOnCell[i];
                if (actor.blocks) {
                    return false;
                }
            }
            return true;
        }

        contains(x: number, y: number): boolean {
            return x >= 0 && y >= 0 && x < this.width && y < this.height;
        }

        isExplored(x: number, y: number): boolean {
            return this.tiles[x][y].explored;
        }

        isInFov(x: number, y: number): boolean {
            if (this.map.isInFov(x, y)) {
                this.tiles[x][y].explored = true;
                return true;
            }
            return false;
        }

        shouldRenderActor(actor: Actor): boolean {
            var player: Actor = Engine.instance.actorManager.getPlayer();
            var detectLifeCond: DetectLifeCondition = <DetectLifeCondition>player.ai.getCondition(ConditionType.DETECT_LIFE);
            var detectRange = detectLifeCond ? detectLifeCond.range : 0;
            return this.isInFov(actor.x, actor.y)
                || (!actor.fovOnly && this.isExplored(actor.x, actor.y))
                || (detectRange > 0 && actor.ai && actor.destructible && !actor.destructible.isDead()
                    && Core.Position.distance(player, actor) < detectRange);
        }

        getScent(x: number, y: number): number {
            return this.tiles[x][y].scentAmount;
        }

        computeFov(x: number, y: number, radius: number) {
            if (this._dirty) {
                this.map.computeFov(x, y, radius);
            }
            this._dirty = false;
        }

        setFloor(x: number, y: number) {
            this.map.setTransparent(x, y, true);
            this.tiles[x][y].isWall = false;
            this.tiles[x][y].isWalkable = true;
            this._dirty = true;
        }
        setWall(x: number, y: number) {
            this.map.setTransparent(x, y, false);
            this.tiles[x][y].isWall = true;
            this.tiles[x][y].isWalkable = false;
            this._dirty = true;
        }
        setWalkable(x: number, y: number, value: boolean) {
            this.tiles[x][y].isWalkable = value;
            this._dirty = true;
        }
        setTransparent(x: number, y: number, value: boolean) {
            this.map.setTransparent(x, y, value);
            this._dirty = true;
        }

        reveal() {
            for (var x = 0; x < this._width; x++) {
                for (var y = 0; y < this._height; y++) {
                    this.tiles[x][y].explored = true;
                }
            }
        }

        render(root: Yendor.Console) {
            for (var x = 0; x < this._width; x++) {
                for (var y = 0; y < this._height; y++) {
                    if (this.isInFov(x, y)) {
                        root.back[x][y] = this.isWall(x, y) ? Constants.LIGHT_WALL : Constants.LIGHT_GROUND;
                    } else if (this.isExplored(x, y)) {
                        root.back[x][y] = this.isWall(x, y) ? Constants.DARK_WALL : Constants.DARK_GROUND;
                    } else {
                        root.back[x][y] = 0x000000;
                    }
                }
            }
        }

        // Persistent interface
        load(jsonData: any): boolean {
            this._width = jsonData._width;
            this._height = jsonData._height;
            this.map = new Yendor.Fov(this._width, this._height);
            this.tiles = [];
            for (var x = 0; x < this._width; x++) {
                this.tiles[x] = [];
                for (var y = 0; y < this._height; y++) {
                    this.tiles[x][y] = new Tile();
                    this.tiles[x][y].explored = jsonData.tiles[x][y].explored;
                    this.tiles[x][y].scentAmount = jsonData.tiles[x][y].scentAmount;
                    this.tiles[x][y].isWall = jsonData.tiles[x][y].isWall;
                    this.tiles[x][y].isWalkable = jsonData.tiles[x][y].isWalkable;
                    this.map.setTransparent(x, y, jsonData.map._transparent[x][y]);
                }
            }
            return true;
        }

        updateScentField(xPlayer: number, yPlayer: number) {
            this._currentScentValue++;
            for (var x: number = 0; x < this._width; x++) {
                for (var y: number = 0; y < this._height; y++) {
                    if (this.isInFov(x, y)) {
                        var oldScent: number = this.getScent(x, y);
                        var dx: number = x - xPlayer;
                        var dy: number = y - yPlayer;
                        var distance: number = Math.floor(Math.sqrt(dx * dx + dy * dy));
                        var newScent: number = this._currentScentValue - distance;
                        if (newScent > oldScent) {
                            this.tiles[x][y].scentAmount = newScent;
                        }
                    }
                }
            }
        }
    }
}
