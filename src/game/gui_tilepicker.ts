/**
	Section: GUI
*/
module Game {
    "use strict";

	/********************************************************************************
	 * Group: tilePicker
	 ********************************************************************************/

    export interface TilePickerEventData {
        origin?: Core.Position;
        // maximum distance from origin
        range?: number;
        // display some blast radius indicator around selected position
        radius?: number;
    }
	/**
		Class: TilePicker
		A background Gui that sleeps until it receives a PICK_TILE event containing a TilePickerListener.
		It then listens to mouse events until the player left-clicks a tile.
		Then it sends a TILE_SELECTED event containing the tile position.
	*/
    export class TilePicker extends Gizmo.Widget implements Umbra.EventListener {
        private tilePos: Core.Position = new Core.Position();
        private tileIsValid: boolean = false;
        private data: TilePickerEventData;
        enableEvents: boolean = true;
        constructor() {
            super();
            this.hide();
            this.setModal();
            this.showOnEventType(EventType[EventType.PICK_TILE], function(data: TilePickerEventData) {
                this.data = data;
                this.tileIsValid = true;
                let player: Actor = Engine.instance.actorManager.getPlayer();
                this.tilePos.x = player.x;
                this.tilePos.y = player.y;
            }.bind(this));
        }

        onRender(console: Yendor.Console) {
            if (console.contains(this.tilePos)) {
                console.text[this.tilePos.x][this.tilePos.y] = this.tileIsValid ? "+".charCodeAt(0) : "x".charCodeAt(0);
                console.fore[this.tilePos.x][this.tilePos.y] = this.tileIsValid ? Constants.TILEPICKER_OK_COLOR : Constants.TILEPICKER_KO_COLOR;
            }
            let hasRange: boolean = (this.data && this.data.range && this.data.origin) ? true : false;
            let hasRadius: boolean = (this.data && this.data.radius) ? true : false;
            if (hasRange || hasRadius) {
                // render the range and/or radius
                let pos: Core.Position = new Core.Position();
                for (pos.x = 0; pos.x < Engine.instance.map.w; ++pos.x) {
                    for (pos.y = 0; pos.y < Engine.instance.map.h; ++pos.y) {
                        let atRange: boolean = hasRange ? Core.Position.distance(this.data.origin, pos) <= this.data.range : true;
                        let inRadius: boolean = this.tileIsValid && hasRadius ? Core.Position.distance(this.tilePos, pos) <= this.data.radius : false;
                        let coef = inRadius ? 1.2 : atRange ? 1 : 0.8;
                        if (coef !== 1) {
                            console.back[pos.x][pos.y] = Core.ColorUtils.multiply(console.back[pos.x][pos.y], coef);
                            console.fore[pos.x][pos.y] = Core.ColorUtils.multiply(console.fore[pos.x][pos.y], coef);
                        }
                    }
                }
            }
        }

        onUpdate(time: number): void {
            this.handleMouseMove();
            this.handleMouseClick();
            this.checkKeyboardInput();
        }

        checkKeyboardInput() {
            if (getLastPlayerAction() === PlayerAction.CANCEL) {
                this.hide();
                Umbra.Input.resetInput();
                return;
            }
            let action: PlayerAction = getLastPlayerAction();
            let move: Core.Position = convertActionToPosition(action);
            if (move.y === -1 && this.tilePos.y > 0) {
                this.tilePos.y--;
                Umbra.Input.resetInput();
            } else if (move.y === 1 && this.tilePos.y < Engine.instance.map.h - 1) {
                this.tilePos.y++;
                Umbra.Input.resetInput();
            }
            if (move.x === -1 && this.tilePos.x > 0) {
                this.tilePos.x--;
                Umbra.Input.resetInput();
            } else if (move.x === 1 && this.tilePos.x < Engine.instance.map.w - 1) {
                this.tilePos.x++;
                Umbra.Input.resetInput();
            }
            switch (action) {
                case PlayerAction.CANCEL:
                    this.hide();
                    Umbra.Input.resetInput();
                    break;
                case PlayerAction.VALIDATE:
                    if (this.tileIsValid) {
                        this.doSelectTile(this.tilePos);
                        this.hide();
                        Umbra.Input.resetInput();
                    }
                    break;
            }
            this.tileIsValid = this.checkTileValidity();
        }

        handleMouseClick() {
            if (Umbra.Input.wasMouseButtonReleased(Umbra.MouseButton.LEFT)) {
                if (this.tileIsValid) {
                    this.doSelectTile(this.tilePos);
                    this.hide();
                }
            } else if (Umbra.Input.wasMouseButtonReleased(Umbra.MouseButton.RIGHT)) {
                this.hide();
            }
        }

        handleMouseMove() {
            if (Umbra.Input.wasMouseMoved()) {
                let mouseCellPos: Core.Position = Umbra.Input.getMouseCellPosition();
                this.tilePos.x = mouseCellPos.x;
                this.tilePos.y = mouseCellPos.y;
                this.tileIsValid = this.checkTileValidity();
            }
        }

        private checkTileValidity(): boolean {
            if (!Engine.instance.map.isInFov(this.tilePos.x, this.tilePos.y)) {
                return false;
            }
            if (this.data && this.data.origin && this.data.range
                && Core.Position.distance(this.data.origin, this.tilePos) > this.data.range) {
                return false;
            }
            return true;
        }

        private doSelectTile(pos: Core.Position) {
            Umbra.EventManager.publishEvent(EventType[EventType.TILE_SELECTED], pos);
        }
    }
}
