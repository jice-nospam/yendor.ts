import * as Core from "../core/main";
import * as Yendor from "../yendor/main";
import * as Actors from "../actors/main";
import {TopologyMap, TopologyAnalyzer, PuzzleStep, Connector} from "./map_topology";
import {Map} from "./map";
import {PUZZLE_STEP_PROBABILITY} from "./constants";

/********************************************************************************
 * Group: map building
 ********************************************************************************/
export type ActorProbabilityMap = { [index: string]: number | number[][] };
export interface DungeonConfig {
    itemProbabilities: ActorProbabilityMap;
    creatureProbabilities: ActorProbabilityMap;
    doorProbabilities: ActorProbabilityMap;
    wallLightProbabilities: ActorProbabilityMap;
    keyProbabilities: ActorProbabilityMap;
    noMonster: boolean;
    noItem: boolean;
    minTorches: number;
    maxTorches: number;
}
/**
     Class: AbstractDungeonBuilder
    Various dungeon building utilities
    */
export class AbstractDungeonBuilder {
    private dungeonLevel: number;
    private _topologyMap: TopologyMap;
    protected rng: Yendor.Random;
    protected config: DungeonConfig;
    private itemProbabilities: {[index: string]: number};
    private creatureProbabilities: {[index: string]: number};
    private doorProbabilities: {[index: string]: number};
    private wallLightProbabilities: {[index: string]: number};
    private keyProbabilities: {[index: string]: number};

    get topologyMap() { return this._topologyMap; }

    constructor(dungeonLevel: number, config: DungeonConfig) {
        this.dungeonLevel = dungeonLevel;
        this.config = config;
        this.itemProbabilities = this.computeLevelProbabilities(config.itemProbabilities);
        this.creatureProbabilities = this.computeLevelProbabilities(config.creatureProbabilities);
        this.doorProbabilities = this.computeLevelProbabilities(config.doorProbabilities);
        this.wallLightProbabilities = this.computeLevelProbabilities(config.wallLightProbabilities);
        this.keyProbabilities = this.computeLevelProbabilities(config.keyProbabilities);
        this.rng = new Yendor.CMWCRandom();
    }

    protected computeLevelProbabilities(probabilities: ActorProbabilityMap): {[index: string]: number} {
        let ret: {[index: string]: number} = {};
        for (let index in probabilities) {
            if (typeof(probabilities[index]) === "number") {
                ret[index] = <number>probabilities[index];
            } else {
                ret[index] = this.getValueForDungeon(<number[][]>probabilities[index]);
            }
        }
        return ret;
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

    protected createRoom(map: Map, first: boolean, x1: number, y1: number, x2: number, y2: number, maxMonsters: number, maxItems: number) {
        this.dig(map, x1, y1, x2, y2);
        if (first) {
            // put the player and stairs up in the first room
            let player: Actors.Actor = Actors.Actor.specialActors[Actors.SpecialActors.PLAYER];
            let stairsUp: Actors.Actor = Actors.Actor.specialActors[Actors.SpecialActors.STAIR_UP];
            player.pos.x = Math.floor((x1 + x2) / 2);
            player.pos.y = Math.floor((y1 + y2) / 2);
            stairsUp.pos.x = player.pos.x;
            stairsUp.pos.y = player.pos.y;
        } else {
            this.createMonsters(x1, y1, x2, y2, map, maxMonsters);
            this.createItems(x1, y1, x2, y2, map, maxItems);
            // stairs down will be in the last room
            let stairsDown: Actors.Actor = Actors.Actor.specialActors[Actors.SpecialActors.STAIR_DOWN];
            stairsDown.pos.x = Math.floor((x1 + x2) / 2);
            stairsDown.pos.y = Math.floor((y1 + y2) / 2);
        }
    }

    protected createDoor(pos: Core.Position) {
        let doorType: string = <string>this.rng.getRandomChance(this.doorProbabilities);
        let door: Actors.Actor = Actors.ActorFactory.create(doorType);
        door.register();
        door.moveTo(pos.x, pos.y);
    }

    protected getDoor(pos: Core.Position): Actors.Actor {
        let doors: Actors.Actor[] = Actors.Actor.list.filter((actor: Actors.Actor) => actor.pos.equals(pos) && actor.isA("door"));
        return doors.length === 0 ? undefined : doors[0];
    }

    protected findVDoorPosition(map: Map, x: number, y1: number, y2: number): Core.Position {
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

    protected findHDoorPosition(map: Map, x1: number, x2: number, y: number): Core.Position {
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
        return Actors.Actor.list.filter((actor: Actors.Actor) => actor.pos.x === x && actor.pos.y === y && actor.isA("item")).length === 0;
    }

    private isAHDoorPosition(map: Map, x: number, y: number): boolean {
        return map.isWall(x, y - 1) && map.isWall(x, y + 1) && this.isEmptyCell(map, x, y)
            && this.isEmptyCell(map, x + 1, y) && this.isEmptyCell(map, x - 1, y);
    }

    private isAVDoorPosition(map: Map, x: number, y: number): boolean {
        return map.isWall(x - 1, y) && map.isWall(x + 1, y) && this.isEmptyCell(map, x, y)
            && this.isEmptyCell(map, x, y + 1) && this.isEmptyCell(map, x, y - 1);
    }

    protected isADoorPosition(map: Map, x: number, y: number): boolean {
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

    private createActor(probabilityMap: {[index: string]: number}): Actors.Actor {
        let actorType: string = <string>this.rng.getRandomChance(probabilityMap);
        // TODO AI tile and inventory pickers for intelligent creatures
        return Actors.ActorFactory.create(actorType, undefined, undefined);
    }

    private createMonster(x: number, y: number) {
        let monster: Actors.Actor = this.createActor(this.creatureProbabilities);
        monster.moveTo(x, y);
        return monster;
    }

    private createItem(): Actors.Actor {
        return this.createActor(this.itemProbabilities);
    }

    private createMonsters(x1: number, y1: number, x2: number, y2: number, map: Map, maxCount: number) {
        let monsterCount = this.config.noMonster ? 0 : this.rng.getNumber(0, maxCount);
        while (monsterCount > 0) {
            let x = this.rng.getNumber(x1, x2);
            let y = this.rng.getNumber(y1, y2);
            if (map.canWalk(x, y)) {
                this.createMonster(x, y).register();
            }
            monsterCount--;
        }
    }

    private createWallTorches(map: Map, minCount: number, maxCount: number) {
        let count: number =  this.rng.getNumber(minCount, maxCount);
        while ( count > 0 ) {
            let wallTorch: Actors.Actor = this.createActor(this.wallLightProbabilities);
            // the position is not important. it will be fixed after dungeon building. see <fixWallItems()>
            let x = this.rng.getNumber(0, map.w - 1);
            let y = this.rng.getNumber(0, map.h - 1);
            wallTorch.moveTo(x, y);
            wallTorch.register();
            count --;
        }
    }


    /**
        Function: fixWallItems
        Wall items are placed in the room building phase. Once the dungeon is complete, some wall may have been digged.
        Wall item can end on a floor tile. Move those back to a wall cell.
        */
    private fixWallItems(map: Map) {
        Actors.Actor.list.map((actor: Actors.Actor) => {
            if (actor.wallActor && !map.isWallWithAdjacentFloor(actor.pos.x, actor.pos.y)) {
                let foundWall: boolean = false;
                let x: number = actor.pos.x;
                let y: number = actor.pos.y;
                while (! foundWall) {
                    if ( x === map.w - 1 ) {
                        x = 0;
                        if ( y === map.h - 1 ) {
                            y = 0;
                        } else {
                            y = y + 1;
                        }
                    } else {
                        x = x + 1;
                    }
                    if (x === actor.pos.x && y === actor.pos.y ) {
                        // scanned the whole map without finding a cell
                        return;
                    }
                    let floorPos = map.isWallWithAdjacentFloor(x, y);
                    if ( floorPos !== undefined ) {
                        let actorsOnCell: Actors.Actor[] = Actors.Actor.list.filter((actor: Actors.Actor) => actor.pos.x === x && actor.pos.y === y);
                        if ( actorsOnCell.length === 0 ) {
                            foundWall = true;
                            actor.moveTo(x, y);
                            if ( actor.light ) {
                                actor.light.position = floorPos;
                            }
                        }
                    }
                }
            }
            return;
        });
    }

    private createItems(x1: number, y1: number, x2: number, y2: number, map: Map, maxCount: number) {
        let itemCount = this.config.noItem ? 0 : this.rng.getNumber(0, maxCount);
        while (itemCount > 0) {
            let item: Actors.Actor = this.createItem();
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
                item.register();
                item.moveTo(x, y);
            } else {
                let x = this.rng.getNumber(x1, x2);
                let y = this.rng.getNumber(y1, y2);
                if (map.canWalk(x, y)) {
                    item.register();
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
        let player: Actors.Actor = Actors.Actor.specialActors[Actors.SpecialActors.PLAYER];
        let stairsUp: Actors.Actor = Actors.Actor.specialActors[Actors.SpecialActors.STAIR_UP];
        let stairsDown: Actors.Actor = Actors.Actor.specialActors[Actors.SpecialActors.STAIR_DOWN];
        this._topologyMap = analyzer.buildTopologyMap(map, stairsDown.pos);
        analyzer.findDungeonExits(player.pos, stairsDown.pos);
        // move player inventory
        player.moveTo(player.pos.x, player.pos.y);
        analyzer.buildPuzzle(this._topologyMap.getObjectId(player.pos), this._topologyMap.getObjectId(stairsDown.pos));
        stairsUp.pos.x = player.pos.x;
        stairsUp.pos.y = player.pos.y;
        this.applyPuzzle();
        this.createWallTorches(map, this.config.minTorches, this.config.maxTorches);
        this.fixWallItems(map);
    }

    /**
        Function: applyPuzzle
        actually implement the puzzle by locking doors and putting keys in the dungeon
    */
    private applyPuzzle() {
        for (let i: number = 0, len: number = this._topologyMap.puzzle.length; i < len; ++i) {
            let prob: number = this.rng.getNumber(0.0, 1.0);
            if (prob > PUZZLE_STEP_PROBABILITY) {
                // skip this lock
                continue;
            }
            let puzzleStep: PuzzleStep = this._topologyMap.puzzle[i];
            let connector: Connector = this._topologyMap.getConnector(puzzleStep.connectorId);
            let door: Actors.Actor = this.getDoor(connector.pos);
            if (!door) {
                throw "Error : connector " + connector.id + " with no door";
            }
            // found a door to be locked. look for a position for the key
            let pos: Core.Position = this._topologyMap.getRandomPositionInSector(puzzleStep.keySectorId, this.rng);
            let key: Actors.Actor = this.createActor(this.keyProbabilities);
            key.moveTo(pos.x, pos.y);
            key.register();
            Actors.ActorFactory.setLock(door, key);
        }
    }
}
