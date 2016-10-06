/**
 * Section: GUI
 */
import * as Core from "../fwk/core/main";
import * as Yendor from "../fwk/yendor/main";
import * as Umbra from "../fwk/umbra/main";
import * as Gui from "../fwk/gui/main";
import * as Actors from "../fwk/actors/main";
import * as Map from "../fwk/map/main";
import * as Constants from "./base";

/**
 * =============================================================================
 * Group: tilePicker
 * =============================================================================
 */

/**
 * Class: TilePicker
 * A background Gui that sleeps until pickATile is called.
 * It then listens to mouse events until the player left-clicks a tile.
 * Then it resolves the promise with the tile position.
 */
export class TilePicker extends Gui.Widget implements Umbra.IEventListener, Actors.ITilePicker {
    public enableEvents: boolean = true;

    private tilePos: Core.Position = new Core.Position();
    private tileIsValid: boolean = false;
    private resolve: (value?: Core.Position) => void;
    private origin: Core.Position|undefined;
    private range: number|undefined;
    private radius: number|undefined;

    constructor() {
        super();
        this.hide();
        this.setModal();
    }

    public pickATile( message: string,
                      origin?: Core.Position,
                      range?: number,
                      radius?: number
    ): Promise<Core.Position> {
        return new Promise<Core.Position>((resolve) => {
            this.resolve = resolve;
            this.origin = origin;
            this.range = range;
            this.radius = radius;
            this.tileIsValid = true;
            let player: Actors.Actor = Actors.Actor.specialActors[Actors.SpecialActorsEnum.PLAYER];
            this.tilePos.x = player.pos.x;
            this.tilePos.y = player.pos.y;
            this.show();
            Umbra.logger.warn(message);
        });
    }

    public onRender( console: Yendor.Console
    ) {
        if (console.contains(this.tilePos)) {
            console.text[this.tilePos.x][this.tilePos.y] = this.tileIsValid ?
                "+".charCodeAt(0) : "x".charCodeAt(0);
            console.fore[this.tilePos.x][this.tilePos.y] = this.tileIsValid ?
                Constants.TILEPICKER_OK_COLOR : Constants.TILEPICKER_KO_COLOR;
        }
        let hasRange: boolean = (this.range && this.origin) ? true : false;
        let hasRadius: boolean = (this.radius) ? true : false;
        if (hasRange || hasRadius) {
            // render the range and/or radius
            let pos: Core.Position = new Core.Position();
            for (pos.x = 0; pos.x < Map.Map.current.w; ++pos.x) {
                for (pos.y = 0; pos.y < Map.Map.current.h; ++pos.y) {
                    let atRange: boolean = this.origin && hasRange ?
                        Core.Position.distance(this.origin, pos) <= this.range : true;
                    let inRadius: boolean = this.tileIsValid && hasRadius ?
                        Core.Position.distance(this.tilePos, pos) <= this.radius : false;
                    let coef = inRadius ? 1.2 : atRange ? 1 : 0.8;
                    if (coef !== 1) {
                        console.back[pos.x][pos.y] = Core.ColorUtils.multiply(console.back[pos.x][pos.y], coef);
                        console.fore[pos.x][pos.y] = Core.ColorUtils.multiply(console.fore[pos.x][pos.y], coef);
                    }
                }
            }
        }
    }

    public onUpdate( _time: number ): void {
        this.handleMouseMove();
        this.handleMouseClick();
        this.checkKeyboardInput();
    }

    public checkKeyboardInput() {
        if (Actors.getLastPlayerAction() === Actors.PlayerActionEnum.CANCEL) {
            this.hide();
            Umbra.resetInput();
            return;
        }
        let action: Actors.PlayerActionEnum|undefined = Actors.getLastPlayerAction();
        if ( action !== undefined) {
            let move: Core.Position = Actors.convertActionToPosition(action);
            if (move.y === -1 && this.tilePos.y > 0) {
                this.tilePos.y--;
                Umbra.resetInput();
            } else if (move.y === 1 && this.tilePos.y < Map.Map.current.h - 1) {
                this.tilePos.y++;
                Umbra.resetInput();
            }
            if (move.x === -1 && this.tilePos.x > 0) {
                this.tilePos.x--;
                Umbra.resetInput();
            } else if (move.x === 1 && this.tilePos.x < Map.Map.current.w - 1) {
                this.tilePos.x++;
                Umbra.resetInput();
            }
            switch (action) {
                case Actors.PlayerActionEnum.CANCEL:
                    this.hide();
                    Umbra.resetInput();
                    break;
                case Actors.PlayerActionEnum.VALIDATE:
                    if (this.tileIsValid) {
                        this.hide();
                        Umbra.resetInput();
                        this.resolve(this.tilePos);
                    }
                break;
                default: break;
            }
        }
        this.tileIsValid = this.checkTileValidity();
    }

    public handleMouseClick() {
        if (Umbra.wasMouseButtonReleased(Umbra.MouseButtonEnum.LEFT)) {
            if (this.tileIsValid) {
                this.hide();
                this.resolve(this.tilePos);
            }
        } else if (Umbra.wasMouseButtonReleased(Umbra.MouseButtonEnum.RIGHT)) {
            this.hide();
        }
    }

    public handleMouseMove() {
        if (Umbra.wasMouseMoved()) {
            let mouseCellPos: Core.Position = Umbra.getMouseCellPosition();
            this.tilePos.x = mouseCellPos.x;
            this.tilePos.y = mouseCellPos.y;
            this.tileIsValid = this.checkTileValidity();
        }
    }

    private checkTileValidity(): boolean {
        if (!Map.Map.current.isInFov(this.tilePos.x, this.tilePos.y)) {
            return false;
        }
        if (this.origin && this.range
            && Core.Position.distance(this.origin, this.tilePos) > this.range) {
            return false;
        }
        return true;
    }
}
