module Game {
    "use strict";
	/********************************************************************************
	 * Group: map building
	 ********************************************************************************/
    /**
       Class: AbstractDungeonBuilder
       Various dungeon building utilities
     */
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
                let tmp: number = x2;
                x2 = x1;
                x1 = tmp;
            }
            if (y2 < y1) {
                let tmp2: number = y2;
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
            for (let tilex: number = x1; tilex <= x2; tilex++) {
                for (let tiley: number = y1; tiley <= y2; tiley++) {
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
                let player: Actor = Engine.instance.actorManager.getPlayer();
                let stairsUp: Actor = Engine.instance.actorManager.getStairsUp();
                player.pos.x = Math.floor((x1 + x2) / 2);
                player.pos.y = Math.floor((y1 + y2) / 2);
                stairsUp.pos.x = player.pos.x;
                stairsUp.pos.y = player.pos.y;
            } else {
                this.createMonsters(x1, y1, x2, y2, map);
                this.createItems(x1, y1, x2, y2, map);
                // stairs down will be in the last room
                let stairsDown: Actor = Engine.instance.actorManager.getStairsDown();
                stairsDown.pos.x = Math.floor((x1 + x2) / 2);
                stairsDown.pos.y = Math.floor((y1 + y2) / 2);
            }
        }

        protected createDoor(pos: Core.Position) {
            let probabilities: { [index: string]: number; } = {};
            probabilities[ActorType.WOODEN_DOOR] = 80;
            probabilities[ActorType.IRON_PORTCULLIS] = 20;
            let doorType: ActorType = <ActorType>this.rng.getRandomChance(probabilities);
            let door: Actor = ActorFactory.create(doorType);
            Engine.instance.actorManager.addActor(door);
            door.moveTo(pos.x, pos.y);
        }

        protected getDoor(pos: Core.Position): Actor {
            let doors: Actor[] = Engine.instance.actorManager.filter(function(actor: Actor): boolean {
                return actor.pos.equals(pos) && actor.isA("door");
            });
            return doors.length === 0 ? undefined : doors[0];
        }

        protected findVDoorPosition(map: Map, x: number, y1: number, y2: number) {
            let y = y1 < y2 ? y1 : y2;
            let endy = y1 < y2 ? y2 : y1;
            do {
                if (this.isAVDoorPosition(map, x, y)) {
                    return new Core.Position(x, y);
                }
                y++;
            } while (y !== endy + 1);
            return undefined;
        }

        protected findHDoorPosition(map: Map, x1: number, x2: number, y: number) {
            let x = x1 < x2 ? x1 : x2;
            let endx = x1 < x2 ? x2 : x1;
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
            let itemsCount: number = Engine.instance.actorManager.filterAndCount(function(actor: Actor): boolean {
                return actor.pos.x === x && actor.pos.y === y && actor.isA("item");
            });
            return itemsCount === 0;
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
            let pos: Core.Position = new Core.Position(Math.floor(x + w / 2), Math.floor(y + h / 2));
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

		/**
			Function: getValueForDungeon
			Get a value adapted to current dungeon level.
			Parameters:
			steps: array of (dungeon level, value) pairs 
		*/
        private getValueForDungeon(steps: number[][]): number {
            let stepCount = steps.length;
            for (let step = stepCount - 1; step >= 0; --step) {
                if (this.dungeonLevel >= steps[step][0]) {
                    return steps[step][1];
                }
            }
            return 0;
        }

        private createMonster(x: number, y: number) {
            let probabilities: { [index: string]: number; } = {};
            probabilities[ActorType.GOBLIN] = 60;
            probabilities[ActorType.ORC] = 30;
            // no trolls before level 3. then probability 10/(60+30+10)=0.1 until level 5, 
            // 20/(60+30+20)=0.18 until level 7 and 30/(60+30+30)=0.23 beyond
            probabilities[ActorType.TROLL] = this.getValueForDungeon([[3, 10], [5, 20], [7, 30]]);
            let monsterType: ActorType = <ActorType>this.rng.getRandomChance(probabilities);
            let monster: Actor = ActorFactory.create(monsterType);
            monster.moveTo(x, y);
            return monster;
        }

        private createItem() {
            let probabilities: { [index: string]: number; } = {};
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
            probabilities[ActorType.CANDLE] = 10;
            probabilities[ActorType.OIL_FLASK] = 5;
            probabilities[ActorType.TORCH] = 5;
            probabilities[ActorType.LANTERN] = 1;
            probabilities[ActorType.SUNROD] = 1;
            let itemType: ActorType = <ActorType>this.rng.getRandomChance(probabilities);
            return ActorFactory.create(itemType);
        }

        private createMonsters(x1: number, y1: number, x2: number, y2: number, map: Map) {
            let monsterCount = Yendor.urlParams[Constants.URL_PARAM_NO_MONSTER] ? 0 : this.rng.getNumber(0, Constants.MAX_MONSTERS_PER_ROOM);
            while (monsterCount > 0) {
                let x = this.rng.getNumber(x1, x2);
                let y = this.rng.getNumber(y1, y2);
                if (map.canWalk(x, y)) {
                    Engine.instance.actorManager.addActor(this.createMonster(x, y));
                }
                monsterCount--;
            }
        }
        
        private createWallTorches(map: Map) {
            let count: number =  this.rng.getNumber(Constants.DUNGEON_MIN_TORCHES, Constants.DUNGEON_MAX_TORCHES);
            while ( count > 0 ) {
                let wallTorch : Actor = ActorFactory.create(ActorType.WALL_TORCH);
                // the position is not important. it will be fixed after dungeon building. see <fixWallItems()>
                let x = this.rng.getNumber(0, map.w);
                let y = this.rng.getNumber(0, map.h);
                wallTorch.moveTo(x,y);
                Engine.instance.actorManager.addActor(wallTorch);
                count --;
            }
        }
        
       
        /**
            Function: fixWallItems
            Wall items are placed in the room building phase. Once the dungeon is complete, some wall may have been digged.
            Wall item can end on a floor tile. Move those back to a wall cell.
         */
        private fixWallItems(map: Map) {
            Engine.instance.actorManager.map(function(actor: Actor): boolean {
                if (actor.wallActor && !map.isWallWithAdjacentFloor(actor.pos.x, actor.pos.y)) {
                    let foundWall: boolean = false;
                    let x: number = actor.pos.x;
                    let y: number = actor.pos.y;
                    while (! foundWall) {
                        if ( x === map.w - 1 ) {
                            if ( y === map.h - 1 ) {
                                x = 0;
                                y = 0;
                            } else {
                                y = y + 1;
                            }
                        } else {
                            x = x + 1;
                        }
                        if ( map.isWallWithAdjacentFloor(x, y) ) {
                            let actorsOnCell: Actor[] = Engine.instance.actorManager.filter(function(actor:Actor): boolean {
                                return actor.pos.x === x && actor.pos.y === y;
                            });
                            if ( actorsOnCell.length === 0 ) {
                                foundWall = true;
                                actor.moveTo(x,y);
                            }
                        }
                    }
                }
                return false;
            });
        }

        private createItems(x1: number, y1: number, x2: number, y2: number, map: Map) {
            let itemCount = Yendor.urlParams[Constants.URL_PARAM_NO_ITEM] ? 0 : this.rng.getNumber(0, Constants.MAX_ITEMS_PER_ROOM);
            while (itemCount > 0) {
                let item: Actor = this.createItem();
                if (item.wallActor) {
                    let x = this.rng.getNumber(x1, x2);
                    let y = this.rng.getNumber(y1, y2);
                    let side = this.rng.getNumber(0, 3);
                    switch (side) {
                        case 0: y = y1; break;
                        case 1: y = y2; break;
                        case 2: x = x1; break;
                        case 3: x = x2; break;
                    }
                    // no need to check that x,y is a wall cell. see <fixWallItems()>
                    Engine.instance.actorManager.addActor(item);
                    item.moveTo(x, y);
                } else {
                    let x = this.rng.getNumber(x1, x2);
                    let y = this.rng.getNumber(y1, y2);
                    if (map.canWalk(x, y)) {
                        Engine.instance.actorManager.addActor(item);
                        item.moveTo(x, y);
                    }
                }
                itemCount--;
            }
        }

        protected digMap(map: Map) {
            // to be implemented by descendants
        }

        build(map: Map) {
            this.digMap(map);
            let analyzer: TopologyAnalyzer = new TopologyAnalyzer();
            // find suitable dungeon entry and exit
            let player: Actor = Engine.instance.actorManager.getPlayer();
            let stairsUp: Actor = Engine.instance.actorManager.getStairsUp();
            let stairsDown: Actor = Engine.instance.actorManager.getStairsDown();
            this._topologyMap = analyzer.buildTopologyMap(map, stairsDown.pos);
            analyzer.findDungeonExits(player.pos, stairsDown.pos);
            // move player inventory
            player.moveTo(player.pos.x, player.pos.y);
            analyzer.buildPuzzle(this._topologyMap.getObjectId(player.pos), this._topologyMap.getObjectId(stairsDown.pos));
            stairsUp.pos.x = player.pos.x;
            stairsUp.pos.y = player.pos.y;
            if (Yendor.urlParams[Constants.URL_PARAM_DEBUG]) {
                console.log("Entry : " + this._topologyMap.getObjectId(player.pos)
                    + "(" + player.pos.x + "-" + player.pos.y + ")");
                console.log("Exit : " + this._topologyMap.getObjectId(stairsDown.pos)
                    + "(" + stairsDown.pos.x + "-" + stairsDown.pos.y + ")");
            }
            this.applyPuzzle();
            this.createWallTorches(map);
            this.fixWallItems(map);
        }

		/**
			Function: applyPuzzle
			actually implement the puzzle by locking doors and putting keys in the dungeon
		*/
        private applyPuzzle() {
            for (let i: number = 0, len: number = this._topologyMap.puzzle.length; i < len; ++i) {
                let prob: number = this.rng.getNumber(0.0, 1.0);
                if (prob > Constants.PUZZLE_STEP_PROBABILITY) {
                    // skip this lock
                    continue;
                }
                let puzzleStep: PuzzleStep = this._topologyMap.puzzle[i];
                let connector: Connector = this._topologyMap.getConnector(puzzleStep.connectorId);
                let door: Actor = this.getDoor(connector.pos);
                if (!door) {
                    throw "Error : connector " + connector.id + " with no door";
                }
                // found a door to be locked. look for a position for the key
                let pos: Core.Position = this._topologyMap.getRandomPositionInSector(puzzleStep.keySectorId, this.rng);
                let key: Actor = ActorFactory.create(ActorType.KEY);
                key.moveTo(pos.x, pos.y);
                Engine.instance.actorManager.addActor(key);
                ActorFactory.setLock(door, key);
            }
        }
    }
}
