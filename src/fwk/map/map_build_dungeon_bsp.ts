	/********************************************************************************
	 * Group: map building
	 ********************************************************************************/
import * as Core from "../core/main";
import * as Yendor from "../yendor/main";
import {AbstractDungeonBuilder, DungeonConfig} from "./map_build_dungeon";
import {Map} from "./map";

export interface BspDungeonConfig extends DungeonConfig {
    roomMinSize: number;
    maxMonstersPerRoom: number;
    maxItemsPerRoom: number;
}

/**
    Class: BspDungeonBuilder
    A dungeon builder using a BSP tree to split the map.
    see https://roguecentral.org/doryen/articles/bsp-dungeon-generation/
    */
export class BspDungeonBuilder extends AbstractDungeonBuilder {
    private firstRoom: boolean = true;
    private potentialDoorPos: Core.Position[] = [];
    constructor(dungeonLevel: number, config: BspDungeonConfig) {
        super(dungeonLevel, config);
    }

    /**
        function: createRandomRoom
        Dig a rectangular room in a node of the BSP tree
        */
    private createRandomRoom(node: Yendor.BSPNode, map: Map, maxMonsters: number, maxItems: number) {
        let x: number, y: number, w: number, h: number;
        let horiz: boolean = node.parent.horiz;
        let roomMinSize: number = (<BspDungeonConfig>this.config).roomMinSize;
        if (horiz) {
            w = this.rng.getNumber(roomMinSize, node.w - 1);
            h = this.rng.getNumber(roomMinSize, node.h - 2);
            if (node === node.parent.leftChild) {
                x = this.rng.getNumber(node.x + 1, node.x + node.w - w);
            } else {
                x = this.rng.getNumber(node.x, node.x + node.w - w);
            }
            y = this.rng.getNumber(node.y + 1, node.y + node.h - h);
        } else {
            w = this.rng.getNumber(roomMinSize, node.w - 2);
            h = this.rng.getNumber(roomMinSize, node.h - 1);
            if (node === node.parent.leftChild) {
                y = this.rng.getNumber(node.y + 1, node.y + node.h - h);
            } else {
                y = this.rng.getNumber(node.y, node.y + node.h - h);
            }
            x = this.rng.getNumber(node.x + 1, node.x + node.w - w);
        }
        this.createRoom(map, this.firstRoom, x, y, x + w - 1, y + h - 1, maxMonsters, maxItems);
        this.firstRoom = false;
    }

    /**
        function: connectChildren
        Connect two rooms with a corridor. Detect potential door positions
        */
    private connectChildren(node: Yendor.BSPNode, map: Map) {
        let left: Yendor.BSPNode = node.leftChild;
        let right: Yendor.BSPNode = node.rightChild;
        let leftPos: Core.Position = this.findFloorTile(left.x, left.y, left.w, left.h, map);
        let rightPos: Core.Position = this.findFloorTile(right.x, right.y, right.w, right.h, map);
        this.dig(map, leftPos.x, leftPos.y, leftPos.x, rightPos.y);
        this.dig(map, leftPos.x, rightPos.y, rightPos.x, rightPos.y);
        // try to find a potential door position
        let doorPos: Core.Position = this.findVDoorPosition(map, leftPos.x, leftPos.y, rightPos.y);
        if (!doorPos) {
            doorPos = this.findHDoorPosition(map, leftPos.x, rightPos.x, rightPos.y);
        }
        if (doorPos) {
            // we can't place the door right now as wall can still be digged
            // the door might end in the middle of a room.
            this.potentialDoorPos.push(doorPos);
        }
    }

    /**
        function: createDoors
        Place door where it make sense (at potential positions that are still valid after the end of the digging)
        */
    private createDoors(map: Map) {
        for (let i: number = 0, len: number = this.potentialDoorPos.length; i < len; ++i) {
            let pos: Core.Position = this.potentialDoorPos[i];
            if (this.isADoorPosition(map, pos.x, pos.y)) {
                this.createDoor(pos);
            }
        }
    }

    /**
        function: visitNode
        BSP tree node visiting function. Create rooms for leafs and corridors for other nodes.
        */
    private visitNode(node: Yendor.BSPNode, userData: any): Yendor.BSPTraversalAction {
        let map: Map = <Map>userData;
        if (node.isLeaf()) {
            this.createRandomRoom(node, map, (<BspDungeonConfig>this.config).maxMonstersPerRoom, (<BspDungeonConfig>this.config).maxItemsPerRoom);
        } else {
            this.connectChildren(node, map);
        }
        return Yendor.BSPTraversalAction.CONTINUE;
    }

    /**
        function: digMap
        Dig rooms and corridors in the map using a BSP tree traversal.
        */
    protected digMap(map: Map) {
        let bsp: Yendor.BSPNode = new Yendor.BSPNode(0, 0, map.w, map.h);
        bsp.splitRecursive(undefined, 8,  (<BspDungeonConfig>this.config).roomMinSize, 1.5);
        bsp.traverseInvertedLevelOrder(this.visitNode.bind(this), map);
        this.createDoors(map);
    }
}
