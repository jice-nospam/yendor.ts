/// <reference path="persistence.ts" />
module Game {
	"use strict";

	export class Tile {
		explored: boolean = false;
		isWall: boolean = true;
		isWalkable: boolean = false;
		scentAmount: number = 0;
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

		protected createDoor(pos: Yendor.Position) {
			var probabilities: { [index: string]: number; } = {};
			probabilities[ActorType.WOODEN_DOOR] = 100;
			Engine.instance.actorManager.addItem(ActorFactory.create(ActorType.WOODEN_DOOR, pos.x, pos.y));
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

		private isAHDoorPosition(map: Map, x: number, y: number): boolean {
			return map.isWall(x, y - 1) && map.isWall(x, y + 1) && map.canWalk(x, y);
		}

		private isAVDoorPosition(map: Map, x: number, y: number): boolean {
			return map.isWall(x - 1, y) && map.isWall(x + 1, y) && map.canWalk(x, y);
		}

		protected isADoorPosition(map: Map, x: number, y: number) {
			return this.isAHDoorPosition(map, x, y) || this.isAVDoorPosition(map, x, y);
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

		private findFloorTile(node: Yendor.BSPNode, map: Map): Yendor.Position {
			var pos: Yendor.Position = new Yendor.Position(Math.floor(node.x + node.w / 2), Math.floor(node.y + node.h / 2));
			while ( map.isWall(pos.x, pos.y) ) {
				pos.x ++;
				if ( pos.x === node.x + node.w ) {
					pos.x = node.x;
					pos.y ++;
					if ( pos.y === node.y + node.h ) {
						pos.y = 0;
					}
				}
			}
			return pos;
		}

		private createRandomRoom(node: Yendor.BSPNode, map: Map) {
			var x, y, w, h: number;
			var rng: Yendor.Random = new Yendor.ComplementaryMultiplyWithCarryRandom();
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
			var leftPos: Yendor.Position = this.findFloorTile(left, map);
			var rightPos: Yendor.Position = this.findFloorTile(right, map);
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

		private createDoors(map: Map) {
			for (var i: number = 0, len: number = this.potentialDoorPos.length; i < len; ++i) {
				var pos: Yendor.Position = this.potentialDoorPos[i];
				if ( this.isADoorPosition(map, pos.x, pos.y)) {
					this.createDoor(pos);
				}
			}
		}

		private visitNode(node: Yendor.BSPNode, userData: any): Yendor.BSPTraversalAction {
			var map: Map = <Map>userData;
			if ( node.isLeaf() ) {
				this.createRandomRoom(node, map);
			} else {
				this.connectChildren(node, map);
			}
			return Yendor.BSPTraversalAction.CONTINUE;
		}

		build(map : Map) {
			var bsp: Yendor.BSPNode = new Yendor.BSPNode( 0, 0, map.width, map.height );
			bsp.splitRecursive(undefined, 8, Constants.ROOM_MIN_SIZE, 1.5 );
			bsp.traverseInvertedLevelOrder( this.visitNode.bind(this), map );
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
			var actorsOnCell: Actor[] = actorManager.findActorsOnCell(pos, actorManager.getItems());
			actorsOnCell = actorsOnCell.concat(actorManager.findActorsOnCell(pos, actorManager.getCreatures()));
			for ( var i: number = 0; i < actorsOnCell.length; i++) {
				var actor: Actor = actorsOnCell[i];
				if ( actor.isBlocking() ) {
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
				|| (!actor.isFovOnly() && this.isExplored( actor.x, actor.y))
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
