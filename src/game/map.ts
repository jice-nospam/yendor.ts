/// <reference path="persistence.ts" />
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


	class TopologyObject {
		id: number;
		constructor(id: number) {
			this.id = id;
		}
		getDescription(): string {
			return "?";
		}
	}
	/*
		Class: Connector
		Represent a map cell connecting two sectors (generally a door)
	*/
	export class Connector extends TopologyObject {
		pos: Yendor.Position;
		sector1Id: number;
		sector2Id: number;
		constructor(id: number, pos: Yendor.Position, sector1Id: number) {
			super(id);
			this.pos = pos;
			this.sector1Id = sector1Id;
		}
		getDescription(): string {
			return "connector " + this.id + " : " + this.pos.x + "-" + this.pos.y + " between " + this.sector1Id + " and " + this.sector2Id;
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
		seed: Yendor.Position;
		nbCells: number = 0;
		constructor(id: number, seed: Yendor.Position) {
			super(id);
			this.seed = seed;
		}
		getDescription(): string {
			return "sector " + this.id + " : " + this.seed.x + "-" + this.seed.y + " (" + this.nbCells + " cells)";
		}
	}

	/*
		Class: TopologyMap
		Represents the map as a list of sectors separated by connectors.
		This is used to generate door/key puzzles.
	*/
	export class TopologyMap {
		/*
			Property: sectorMap
			Associate a topology object to each walkable map cell (either a sector or a connector)
		*/
		sectorMap: number[][];
		/*
			Property: objects
			All existing sectors and connectors
		*/
		objects: TopologyObject[];

		constructor(width: number, height: number) {
			this.objects = [];
			this.sectorMap = [];
			for (var x = 0; x < width; ++x) {
				this.sectorMap[x] = [];
				for (var y = 0; y < width; ++y) {
					this.sectorMap[x][y] = -1;
				}
			}
		}
	}

	export class TopologyAnalyzer {
		private topologyMap: TopologyMap;
		private objectId: number = 0;
		private sectorSeeds: Yendor.Position[] = [];

		private floodFill(map: Map, x: number, y: number, id: number) {
			var cellsToVisit: Yendor.Position[] = [];
			var seed: Yendor.Position = new Yendor.Position(x, y);
			var sector: Sector = new Sector(id, seed);
			this.topologyMap.objects.push(sector);
			this.topologyMap.sectorMap[seed.x][seed.y] = id;
			sector.nbCells ++;
			cellsToVisit.push(seed);
			if ( Yendor.urlParams[Constants.URL_PARAM_DEBUG] ) {
				console.log("detecting sector " + id + " from " + seed.x + "-" + seed.y + "...");
			}
			while ( cellsToVisit.length !== 0 ) {
				var pos: Yendor.Position = cellsToVisit.shift();
				var adjacentCells: Yendor.Position[] = pos.getAdjacentCells(map.width, map.height);
				for (var i: number = 0, len: number = adjacentCells.length; i < len; ++i ) {
					var curpos: Yendor.Position = adjacentCells[i];
					if (map.isWall(curpos.x, curpos.y) || this.topologyMap.sectorMap[curpos.x][curpos.y] === id) {
						continue;
					}
					if ( this.topologyMap.sectorMap[curpos.x][curpos.y] === -1) {
						if ( map.canWalk(curpos.x, curpos.y) ) {
							// this cell belongs to the same sector
							this.topologyMap.sectorMap[curpos.x][curpos.y] = id;
							sector.nbCells ++;
							cellsToVisit.push(curpos);
						} else if ((curpos.x === pos.x || curpos.y === pos.y) && this.hasDoor(map, curpos)) {
							// a new connector
							this.topologyMap.sectorMap[curpos.x][curpos.y] = this.newConnector(pos, curpos, id);
						}
					} else if (this.hasDoor(map, curpos)) {
						// connect to an existing connector ?
						var connector: Connector = this.getConnector(curpos);
						if ( connector.sector1Id !== id && connector.sector2Id === undefined ) {
							connector.sector2Id = id;
							if ( Yendor.urlParams[Constants.URL_PARAM_DEBUG] ) {
								console.log("Connector " + connector.id + " connecting sectors " + connector.sector1Id + " and " + connector.sector2Id
									+ " at " + connector.pos.x + "-" + connector.pos.y);
							}
						}
					}
				}
			}
			if ( Yendor.urlParams[Constants.URL_PARAM_DEBUG] ) {
				console.log("done. " + sector.nbCells + " cells.");
			}
		}

		private hasDoor(map: Map, pos: Yendor.Position): boolean {
			var items: Actor[] = Engine.instance.actorManager.findActorsOnCell(pos, Engine.instance.actorManager.getItemIds());
			if (items.length === 0) {
				return false;
			}
			for (var i: number = 0, len: number = items.length; i < len; ++i) {
				if ( items[i].door ) {
					return true;
				}
			}
			return false;
		}

		private newConnector(from: Yendor.Position, pos: Yendor.Position, sector1Id: number): number {
			this.objectId++;
			var connector: Connector = new Connector(this.objectId, pos, sector1Id);
			this.topologyMap.objects.push(connector);
			// add a new sector seed on the other side of the door
			// note that this cell might be in the same sector as from
			// this could be used to remove useless doors
			var sectorSeed: Yendor.Position;
			if ( from.x === pos.x - 1 ) {
				sectorSeed = new Yendor.Position(pos.x + 1, pos.y);
			} else if ( from.x === pos.x + 1 ) {
				sectorSeed = new Yendor.Position(pos.x - 1, pos.y);
			} else if ( from.y === pos.y - 1 ) {
				sectorSeed = new Yendor.Position(pos.x , pos.y + 1);
			} else if ( from.y === pos.y + 1 ) {
				sectorSeed = new Yendor.Position(pos.x, pos.y - 1);
			}
			this.sectorSeeds.push(sectorSeed);
			if ( Yendor.urlParams[Constants.URL_PARAM_DEBUG] ) {
				console.log("Connector " + this.objectId + " detected at " + pos.x + "-" + pos.y);
			}
			return this.objectId;
		}

		private getConnector(pos: Yendor.Position): Connector {
			for (var i: number = 0, len: number = this.topologyMap.objects.length; i < len; ++i) {
				var obj: TopologyObject = this.topologyMap.objects[i];
				if ( obj instanceof Connector ) {
					if ((<Connector>obj).pos.equals(pos)) {
						return <Connector>obj;
					}
				}
			}
			return undefined;
		}

		buildTopologyMap(map: Map, seed: Yendor.Position) {
			this.topologyMap = new TopologyMap(map.width, map.height);
			this.sectorSeeds.push(seed);
			while ( this.sectorSeeds.length !== 0 ) {
				var pos: Yendor.Position = this.sectorSeeds.shift();
				// in case of doors not connecting two sectors, the other side of the door is already visited
				if ( this.topologyMap.sectorMap[pos.x][pos.y] === -1) {
					this.floodFill(map, pos.x, pos.y, this.objectId);
					this.objectId++;
				} else if ( Yendor.urlParams[Constants.URL_PARAM_DEBUG] ) {
					console.log("Skipping dummy sector at " + pos.x + "-" + pos.y);
				}
			}
			// here, connectors with an undefined sector2id represents useless doors
			// we keep them for the fun
			if ( Yendor.urlParams[Constants.URL_PARAM_DEBUG] ) {
				for (var i: number = 0, len: number = this.topologyMap.objects.length; i < len; ++i) {
					var obj: TopologyObject = this.topologyMap.objects[i];
					console.log(obj.getDescription());
				}
			}
		}

	}

	export class AbstractDungeonBuilder {
		private dungeonLevel: number;

		constructor(dungeonLevel: number) {
			this.dungeonLevel = dungeonLevel;
		}

		protected dig( map: Map, x1: number, y1: number, x2: number, y2: number ) {
			// sort coordinates
			if ( x2 < x1 ) {
				var tmp: number = x2;
				x2 = x1;
				x1 = tmp;
			}
			if ( y2 < y1 ) {
				var tmp2: number = y2;
				y2 = y1;
				y1 = tmp2;
			}
			// never dig on map border
			if ( x1 === 0 ) {
				x1 = 1;
			}
			if ( y1 === 0 ) {
				y1 = 1;
			}
			if ( x2 === map.width - 1) {
				x2--;
			}
			if ( y2 === map.height - 1) {
				y2--;
			}
			// dig
			for (var tilex: number = x1; tilex <= x2; tilex++) {
				for (var tiley: number = y1; tiley <= y2; tiley++) {
					if ( map.isWall(tilex, tiley)) {
						map.setFloor(tilex, tiley);
					}
				}
			}
		}

		protected createRoom( map: Map, first: boolean, x1: number, y1: number, x2: number, y2: number ) {
			this.dig( map, x1, y1, x2, y2 );
			if ( first ) {
				// put the player and stairs up in the first room
				var player: Actor = Engine.instance.actorManager.getPlayer();
				var stairsUp: Actor = Engine.instance.actorManager.getStairsUp();
				player.x = Math.floor((x1 + x2) / 2);
				player.y = Math.floor((y1 + y2) / 2);
				stairsUp.x = player.x;
				stairsUp.y = player.y;
			} else {
				var rng: Yendor.Random = new Yendor.ComplementaryMultiplyWithCarryRandom();
				this.createMonsters(x1, y1, x2, y2, rng, map);
				this.createItems(x1, y1, x2, y2, rng, map);
				// stairs down will be in the last room
				var stairsDown: Actor = Engine.instance.actorManager.getStairsDown();
				stairsDown.x = Math.floor((x1 + x2) / 2);
				stairsDown.y = Math.floor((y1 + y2) / 2);
			}
		}

		protected createDoor(pos: Yendor.Position, rng: Yendor.Random) {
			var probabilities: { [index: string]: number; } = {};
			probabilities[ActorType.WOODEN_DOOR] = 80;
			probabilities[ActorType.IRON_PORTCULLIS] = 20;
			var doorType: ActorType = <ActorType>rng.getRandomChance(probabilities);
			Engine.instance.actorManager.addItem(ActorFactory.create(doorType, pos.x, pos.y));
		}

		protected findVDoorPosition(map: Map, x: number, y1: number, y2: number) {
			var y = y1 < y2 ? y1 : y2;
			var endy = y1 < y2 ? y2 : y1;
			do {
				if ( this.isAVDoorPosition(map, x, y) ) {
					return new Yendor.Position(x, y);
				}
				y ++;
			} while ( y !== endy + 1);
			return undefined;
		}

		protected findHDoorPosition(map: Map, x1: number, x2: number, y: number) {
			var x = x1 < x2 ? x1 : x2;
			var endx = x1 < x2 ? x2 : x1;
			do {
				if ( this.isAHDoorPosition(map, x, y) ) {
					return new Yendor.Position(x, y);
				}
				x ++;
			} while ( x !== endx + 1 );
			return undefined;
		}

		private isEmptyCell(map: Map, x: number, y: number): boolean {
			if (!map.canWalk(x, y)) {
				return false;
			}
			var items: Actor[] = Engine.instance.actorManager.findActorsOnCell(new Yendor.Position(x, y), Engine.instance.actorManager.getItemIds());
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

		protected findFloorTile(x: number, y: number, w: number, h: number, map: Map): Yendor.Position {
			var pos: Yendor.Position = new Yendor.Position(Math.floor(x + w / 2), Math.floor(y + h / 2));
			while ( map.isWall(pos.x, pos.y) ) {
				pos.x ++;
				if ( pos.x === x + w ) {
					pos.x = x;
					pos.y ++;
					if ( pos.y === y + h ) {
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
			var nbSteps = steps.length;
			for (var step = nbSteps - 1; step >= 0; --step) {
				if ( this.dungeonLevel >= steps[step][0] ) {
					return steps[step][1];
				}
			}
			return 0;
		}

		private createMonster(x: number, y: number, rng: Yendor.Random) {
			var probabilities: { [index: string]: number; } = {};
			probabilities[ActorType.GOBLIN] = 60;
			probabilities[ActorType.ORC] = 30;
			// no trolls before level 3. then probability 10/(60+30+10)=0.1 until level 5, 
			// 20/(60+30+20)=0.18 until level 7 and 30/(60+30+30)=0.23 beyond
			probabilities[ActorType.TROLL] = this.getValueForDungeon([[3, 10], [5, 20], [7, 30]]);
			var monster: ActorType = <ActorType>rng.getRandomChance(probabilities);
			return ActorFactory.create(monster, x, y);
		}

		private createItem(x: number, y: number, rng: Yendor.Random) {
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
			var item: ActorType = <ActorType>rng.getRandomChance(probabilities);
			return ActorFactory.create(item, x, y);
		}

		private createMonsters(x1: number, y1: number, x2: number, y2: number, rng: Yendor.Random, map: Map) {
			var monsterCount = rng.getNumber(0, Constants.MAX_MONSTERS_PER_ROOM);
			while ( monsterCount > 0 ) {
				var x = rng.getNumber(x1, x2);
				var y = rng.getNumber(y1, y2);
				if ( map.canWalk(x, y)) {
					Engine.instance.actorManager.addCreature(this.createMonster(x, y, rng));
				}
				monsterCount --;
			}
		}

		private createItems(x1: number, y1: number, x2: number, y2: number, rng: Yendor.Random, map: Map) {
			var itemCount = rng.getNumber(0, Constants.MAX_ITEMS_PER_ROOM);
			while ( itemCount > 0 ) {
				var x = rng.getNumber(x1, x2);
				var y = rng.getNumber(y1, y2);
				if ( map.canWalk(x, y)) {
					Engine.instance.actorManager.addItem(this.createItem(x, y, rng));
				}
				itemCount --;
			}
		}
	}

	export class BspDungeonBuilder extends AbstractDungeonBuilder {
		private firstRoom: boolean = true;
		private potentialDoorPos: Yendor.Position[] = [];
		constructor(dungeonLevel: number) {
			super(dungeonLevel);
		}

		private createRandomRoom(node: Yendor.BSPNode, map: Map, rng: Yendor.Random) {
			var x, y, w, h: number;
			var horiz: boolean = node.parent.horiz;
			if ( horiz ) {
				w = rng.getNumber(Constants.ROOM_MIN_SIZE, node.w - 1);
				h = rng.getNumber(Constants.ROOM_MIN_SIZE, node.h - 2);
				if (node === node.parent.leftChild) {
					x = rng.getNumber(node.x + 1, node.x + node.w - w);
				} else {
					x = rng.getNumber(node.x, node.x + node.w - w);
				}
				y = rng.getNumber(node.y + 1, node.y + node.h - h);
			} else {
				w = rng.getNumber(Constants.ROOM_MIN_SIZE, node.w - 2);
				h = rng.getNumber(Constants.ROOM_MIN_SIZE, node.h - 1);
				if (node === node.parent.leftChild) {
					y = rng.getNumber(node.y + 1, node.y + node.h - h);
				} else {
					y = rng.getNumber(node.y, node.y + node.h - h);
				}
				x = rng.getNumber(node.x + 1, node.x + node.w - w);
			}
			this.createRoom( map, this.firstRoom, x, y, x + w - 1, y + h - 1 );
			this.firstRoom = false;
		}

		private connectChildren(node: Yendor.BSPNode, map: Map) {
			var left: Yendor.BSPNode = node.leftChild;
			var right: Yendor.BSPNode = node.rightChild;
			var leftPos: Yendor.Position = this.findFloorTile(left.x, left.y, left.w, left.h, map);
			var rightPos: Yendor.Position = this.findFloorTile(right.x, right.y, right.w, right.h, map);
			this.dig(map, leftPos.x, leftPos.y, leftPos.x, rightPos.y);
			this.dig(map, leftPos.x, rightPos.y, rightPos.x, rightPos.y);
			// try to find a potential door position
			var doorPos: Yendor.Position = this.findVDoorPosition(map, leftPos.x, leftPos.y, rightPos.y);
			if ( !doorPos ) {
				doorPos = this.findHDoorPosition(map, leftPos.x, rightPos.x, rightPos.y);
			}
			if ( doorPos ) {
				// we can't place the door right now as wall can still be digged
				// the door might end in the middle of a room.
				this.potentialDoorPos.push(doorPos);
			}
		}

		private createDoors(map: Map, rng: Yendor.Random) {
			for (var i: number = 0, len: number = this.potentialDoorPos.length; i < len; ++i) {
				var pos: Yendor.Position = this.potentialDoorPos[i];
				if ( this.isADoorPosition(map, pos.x, pos.y)) {
					this.createDoor(pos, rng);
				}
			}
		}

		private visitNode(node: Yendor.BSPNode, userData: any): Yendor.BSPTraversalAction {
			var map: Map = <Map>userData[0];
			var rng: Yendor.Random = <Yendor.Random>userData[1];
			if ( node.isLeaf() ) {
				this.createRandomRoom(node, map, rng);
			} else {
				this.connectChildren(node, map);
			}
			return Yendor.BSPTraversalAction.CONTINUE;
		}

		build(map : Map) {
			var rng: Yendor.Random = new Yendor.ComplementaryMultiplyWithCarryRandom();
			var bsp: Yendor.BSPNode = new Yendor.BSPNode( 0, 0, map.width, map.height );
			bsp.splitRecursive(undefined, 8, Constants.ROOM_MIN_SIZE, 1.5 );
			bsp.traverseInvertedLevelOrder( this.visitNode.bind(this), [map, rng] );
			this.createDoors(map, rng);
			var analyzer: TopologyAnalyzer = new TopologyAnalyzer();
			analyzer.buildTopologyMap(map, Engine.instance.actorManager.getStairsDown());
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
			if ( this.tiles[x] && this.tiles[x][y] ) {
				return this.tiles[x][y].isWall;
			}
			return true;
		}

		canWalk(x: number, y: number): boolean {
			if ( this.isWall(x, y) ) {
				return false;
			}
			var pos: Yendor.Position = new Yendor.Position(x, y);
			var actorManager: ActorManager = Engine.instance.actorManager;
			var actorsOnCell: Actor[] = actorManager.findActorsOnCell(pos, actorManager.getItemIds());
			actorsOnCell = actorsOnCell.concat(actorManager.findActorsOnCell(pos, actorManager.getCreatureIds()));
			for ( var i: number = 0; i < actorsOnCell.length; i++) {
				var actor: Actor = actorsOnCell[i];
				if ( actor.blocks ) {
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
			if ( this.map.isInFov(x, y) ) {
				this.tiles[x][y].explored = true;
				return true;
			}
			return false;
		}

		shouldRenderActor(actor: Actor): boolean {
			var player: Actor = Engine.instance.actorManager.getPlayer();
			var detectLifeCond: DetectLifeCondition = <DetectLifeCondition>player.ai.getCondition(ConditionType.DETECT_LIFE);
			var detectRange = detectLifeCond ? detectLifeCond.range : 0;
			return this.isInFov( actor.x, actor.y)
				|| (!actor.fovOnly && this.isExplored( actor.x, actor.y))
				|| (detectRange > 0 && actor.ai && actor.destructible && !actor.destructible.isDead()
					&& Yendor.Position.distance(player, actor) < detectRange);
		}

		getScent(x: number, y: number): number {
			return this.tiles[x][y].scentAmount;
		}

		computeFov(x: number, y: number, radius: number) {
			if ( this._dirty ) {
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
					if ( this.isInFov(x, y) ) {
						root.back[x][y] = this.isWall(x, y) ? Constants.LIGHT_WALL : Constants.LIGHT_GROUND;
					} else if ( this.isExplored(x, y) ) {
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
			this._currentScentValue ++;
			for (var x: number = 0; x < this._width; x++) {
		        for (var y: number = 0; y < this._height; y++) {
		            if (this.isInFov(x, y)) {
		                var oldScent: number = this.getScent(x, y);
		                var dx: number = x - xPlayer;
		                var dy: number = y - yPlayer;
		                var distance: number = Math.floor(Math.sqrt(dx * dx + dy * dy));
		                var newScent: number = this._currentScentValue - distance;
		                if ( newScent > oldScent ) {
		                    this.tiles[x][y].scentAmount = newScent;
		                }
		            }
		        }
		    }
		}
	}
}
