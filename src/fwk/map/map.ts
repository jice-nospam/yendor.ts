import * as Core from "../core/main";
import * as Yendor from "../yendor/main";
import * as Actors from "../actors/main";
import {CellLightLevelEnum} from "./map_render";
import {MapRendererNode} from "./map_render";

/**
 * ==============================================================================
 * Group: map
 * ==============================================================================
 */
/**
 * Class: Tile
 * Properties of a map cell. The 'isTransparent' property is stored in the Yendor.Fov class.
 */
export class Tile {
    public explored: boolean = false;
    public isWall: boolean = true;
    public isWalkable: boolean = false;
    public scentAmount: number = 0;
}

export class Map extends Core.Rect implements Yendor.IPersistent {
    public static current: Map;
    private tiles: Tile[][];
    private __inFov: boolean[][];
    private _fov: Yendor.Fov;
    private _currentScentValue: number = Actors.SCENT_THRESHOLD;
    // whether we must recompute fov
    private _dirty: boolean = true;
    private __renderer: MapRendererNode;

    get renderer() { return this.__renderer; }

    constructor(renderer: MapRendererNode) {
        super();
        this.__renderer = renderer;
    }

    public init(width: number, height: number) {
        this.resize(width, height);
        this.tiles = [];
        this.__inFov = [];
        this._fov = new Yendor.Fov(width, height);
        for (let x = 0; x < width; x++) {
            this.tiles[x] = [];
            this.__inFov[x] = [];
            for (let y = 0; y < height; y++) {
                this.tiles[x][y] = new Tile();
            }
        }
        this._dirty = true;
        Map.current = this;
        this.__renderer.onInit();
    }

    get currentScentValue() { return this._currentScentValue; }
    get fov() { return this._fov; }
    public setDirty() { this._dirty = true; }

    public isWall(x: number, y: number): boolean {
        if (this.tiles[x] && this.tiles[x][y]) {
            return this.tiles[x][y].isWall;
        }
        return true;
    }

    public findRandomWamlkableCell(): [number, number] {
        let rng = Yendor.CMWCRandom.default;
        let x: number = rng.getNumber(0, this.w - 1);
        let y: number = rng.getNumber(0, this.h - 1);
        while (!this.canWalk(x, y)) {
            x++;
            if (x === this.w) {
                x = 0;
                y++;
                if (y === this.h) {
                    y = 0;
                }
            }
        }
        return [x, y];
    }

    /**
     * Function: isWallWithAdjacentFloor
     * Returns:
     * - undefined if position is not a wall with adjacent floor
     * - else adjacent floor position
     */
    public isWallWithAdjacentFloor(x: number, y: number): Core.Position|undefined {
        if (! this.isWall(x, y)) {
            return undefined;
        }
        let cells: Core.Position[] = new Core.Position(x, y).getAdjacentCells(this.w, this.h, false);
        for (let pos of cells) {
            if (!this.isWall(pos.x, pos.y)) {
                return pos;
            }
        }
        return undefined;
    }

    public canWalk(x: number, y: number): boolean {
        if (this.isWall(x, y)) {
            return false;
        }
        return Actors.Actor.list.filter((actor: Actors.Actor) => actor.pos.x === x
            && actor.pos.y === y && actor.blocks).length === 0;
    }

    public isExplored(x: number, y: number): boolean {
        return this.tiles[x][y].explored;
    }

    /**
     * Function: isInFov
     * This function always return false until <computeFov> has been called.
     * Parameters:
     * x - x coordinate in the map
     * y - y coordinate in the map
     * Returns:
     * true if the cell at coordinate x,y is in the last computed field of view
     */
    public isInFov(x: number, y: number): boolean {
        return (this.__inFov[x] && this.__inFov[x][y]);
    }

    public getScent(x: number, y: number): number {
        return this.tiles[x][y].scentAmount;
    }

    public resetFov(inFov: boolean) {
        for (let x = 0; x < this.w; x++) {
            for (let y = 0; y < this.h; y++) {
                this.__inFov[x][y] = inFov;
            }
        }
    }

    public computeFov(fovx: number, fovy: number, radius: number) {
        if (this._dirty) {
            this._fov.computeFov(this.__inFov, fovx, fovy, radius);
            for (let x = 0; x < this.w; x++) {
                for (let y = 0; y < this.h; y++) {
                    if (this.__inFov[x] && this.__inFov[x][y] && !this.tiles[x][y].explored) {
                        if (this.__renderer.getCellLightLevel(x, y) !== CellLightLevelEnum.DARKNESS) {
                            this.tiles[x][y].explored = true;
                        }
                    }
                }
            }
        }
        this._dirty = false;
    }

    public setFloor(x: number, y: number) {
        this._fov.setTransparent(x, y, true);
        this.tiles[x][y].isWall = false;
        this.tiles[x][y].isWalkable = true;
        this._dirty = true;
    }
    public setWall(x: number, y: number) {
        this._fov.setTransparent(x, y, false);
        this.tiles[x][y].isWall = true;
        this.tiles[x][y].isWalkable = false;
        this._dirty = true;
    }
    public setWalkable(x: number, y: number, value: boolean) {
        this.tiles[x][y].isWalkable = value;
        this._dirty = true;
    }
    public setTransparent(x: number, y: number, value: boolean) {
        this._fov.setTransparent(x, y, value);
        this._dirty = true;
    }

    public reveal() {
        for (let x = 0; x < this.w; x++) {
            for (let y = 0; y < this.h; y++) {
                this.tiles[x][y].explored = true;
            }
        }
    }

    // Persistent interface
    public load(jsonData: any) {
        this.init(jsonData.w, jsonData.h);
        this._fov = new Yendor.Fov(this.w, this.h);
        for (let x = 0; x < this.w; x++) {
            for (let y = 0; y < this.h; y++) {
                this.tiles[x][y].explored = jsonData.tiles[x][y].explored;
                this.tiles[x][y].scentAmount = jsonData.tiles[x][y].scentAmount;
                this.tiles[x][y].isWall = jsonData.tiles[x][y].isWall;
                this.tiles[x][y].isWalkable = jsonData.tiles[x][y].isWalkable;
                this._fov.setTransparent(x, y, jsonData._fov._transparent[x][y]);
            }
        }
    }

    public updateScentField(xPlayer: number, yPlayer: number) {
        this._currentScentValue++;
        for (let x: number = 0; x < this.w; x++) {
            for (let y: number = 0; y < this.h; y++) {
                if (this.isInFov(x, y)) {
                    let oldScent: number = this.getScent(x, y);
                    let dx: number = x - xPlayer;
                    let dy: number = y - yPlayer;
                    let distance: number = Math.floor(Math.sqrt(dx * dx + dy * dy));
                    let newScent: number = this._currentScentValue - distance;
                    if (newScent > oldScent) {
                        this.tiles[x][y].scentAmount = newScent;
                    }
                }
            }
        }
    }
}
