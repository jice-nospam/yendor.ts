module Game {
    "use strict";
	/********************************************************************************
	 * Group: map
	 ********************************************************************************/
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

    export class Map extends Umbra.Node implements Persistent {
        className: string;
        private tiles: Tile[][];
        private map: Yendor.Fov;
        private _currentScentValue: number = Constants.SCENT_THRESHOLD;
        // whether we must recompute fov
        private _dirty: boolean = true;

        constructor() {
            super();
            this.className = "Map";
        }

        init(width: number, height: number) {
            this.resize(width, height);
            this.tiles = [];
            this.map = new Yendor.Fov(width, height);
            for (var x = 0; x < width; x++) {
                this.tiles[x] = [];
                for (var y = 0; y < height; y++) {
                    this.tiles[x][y] = new Tile();
                }
            }
        }

        get width() { return this.boundingBox.w; }
        get height() { return this.boundingBox.h; }
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
            return this.boundingBox.contains(x, y);
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
            for (var x = 0; x < this.boundingBox.w; x++) {
                for (var y = 0; y < this.boundingBox.h; y++) {
                    this.tiles[x][y].explored = true;
                }
            }
        }

        onInit() {
            // compute the field of view before first render
            this.onUpdate(0);
        }

        onRender(root: Yendor.Console) {
            for (var x = 0; x < this.boundingBox.w; x++) {
                for (var y = 0; y < this.boundingBox.h; y++) {
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
        
        onUpdate(time: number) {
            var player = Engine.instance.actorManager.getPlayer();
            this.computeFov(player.x, player.y, Constants.FOV_RADIUS);
        }

        // Persistent interface
        load(jsonData: any): boolean {
            this.resize(jsonData.boundingBox.w, jsonData.boundingBox.h);
            this.map = new Yendor.Fov(this.boundingBox.w, this.boundingBox.h);
            this.tiles = [];
            for (var x = 0; x < this.boundingBox.w; x++) {
                this.tiles[x] = [];
                for (var y = 0; y < this.boundingBox.h; y++) {
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
            if ( ! this.boundingBox ) {
                return;
            }
            this._currentScentValue++;
            for (var x: number = 0; x < this.boundingBox.w; x++) {
                for (var y: number = 0; y < this.boundingBox.h; y++) {
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
