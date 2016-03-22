module Game {
    "use strict";
	/********************************************************************************
	 * Group: map building
	 ********************************************************************************/
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
            if (x2 === map.w - 1) {
                x2--;
            }
            if (y2 === map.h - 1) {
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
            probabilities[ActorType.HEALTH_POTION] = this.getValueForDungeon([[0, 20], [5, 15]]);
            probabilities[ActorType.REGENERATION_POTION] = this.getValueForDungeon([[0, 20], [5, 15]]);
            probabilities[ActorType.SCROLL_OF_LIGHTNING_BOLT] = this.getValueForDungeon([[3, 10]]);
            probabilities[ActorType.SCROLL_OF_FIREBALL] = 7;
            probabilities[ActorType.SCROLL_OF_CONFUSION] = 7;
            probabilities[ActorType.BONE_ARROW] = 5;
            probabilities[ActorType.IRON_ARROW] = 5;
            probabilities[ActorType.BOLT] = 5;
            probabilities[ActorType.SHORT_BOW] = 1;
            probabilities[ActorType.LONG_BOW] = this.getValueForDungeon([[5, 1]]);
            probabilities[ActorType.CROSSBOW] = 1;
            probabilities[ActorType.SHORT_SWORD] = this.getValueForDungeon([[4, 1], [12, 0]]);
            probabilities[ActorType.WAND_OF_FROST] = 1;
            probabilities[ActorType.STAFF_OF_TELEPORTATION] = 1;
            probabilities[ActorType.STAFF_OF_LIFE_DETECTION] = 1;
            probabilities[ActorType.STAFF_OF_MAPPING] = 1;
            probabilities[ActorType.WOODEN_SHIELD] = this.getValueForDungeon([[2, 1], [12, 0]]);
            probabilities[ActorType.LONGSWORD] = this.getValueForDungeon([[6, 1]]);
            probabilities[ActorType.IRON_SHIELD] = this.getValueForDungeon([[7, 1]]);
            probabilities[ActorType.GREATSWORD] = this.getValueForDungeon([[8, 1]]);
            probabilities[ActorType.CANDLE] = 5;
            probabilities[ActorType.TORCH] = 3;
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
            // move player inventory
            player.moveTo(player.x, player.y);
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
            var bsp: Yendor.BSPNode = new Yendor.BSPNode(0, 0, map.w, map.h);
            bsp.splitRecursive(undefined, 8, Constants.ROOM_MIN_SIZE, 1.5);
            bsp.traverseInvertedLevelOrder(this.visitNode.bind(this), map);
            this.createDoors(map);
        }
    }
}
