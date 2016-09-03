import * as Core from "../core/main";
import * as Yendor from "../yendor/main";
import * as Gui from "../gui/main";
import * as Umbra from "../umbra/main";
import * as Actors from "../actors/main";
import {MapRendererNode, DungeonRendererNode} from "./map_render";
import {LightDungeonShader, BasicMapShader} from "./map_shading";
import {Map} from "./map";

export abstract class MapScene extends Umbra.Scene implements Umbra.EventListener {
    enableEvents: boolean = true;

    protected persister: Core.Persister;

    protected _map: Map;
    protected _rng: Yendor.Random;
    protected renderer: MapRendererNode;
    protected playerTilePicker: Actors.TilePicker;
    protected playerInventoryPicker: Actors.InventoryItemPicker;

    constructor(renderer: MapRendererNode, persister: Core.Persister) {
        super();
        this.renderer = renderer;
        this.persister = persister;
    }

    // singleton getters
    get map() { return this._map; }
    get rng() { return this._rng; }

    onInit(): void {
        Umbra.EventManager.registerEventListener(this, Gui.EventType[Gui.EventType.MODAL_SHOW]);
        Umbra.EventManager.registerEventListener(this, Gui.EventType[Gui.EventType.MODAL_HIDE]);

        this._rng = new Yendor.CMWCRandom();
        this._map = new Map(this.renderer);
        // adding nodes as children ensure they are updated/rendered by Umbra
        this.addChild(this.renderer);

        // Umbra player input configuration
        Umbra.registerAxes([
            // cardinal movements
            { name: Actors.PlayerAction[Actors.PlayerAction.MOVE_WEST], positiveButton: Umbra.KeyCode.DOM_VK_LEFT, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.MOVE_WEST], positiveButton: Umbra.KeyCode.DOM_VK_NUMPAD4, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.MOVE_WEST], positiveButton: Umbra.KeyCode.DOM_VK_H, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.MOVE_EAST], positiveButton: Umbra.KeyCode.DOM_VK_RIGHT, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.MOVE_EAST], positiveButton: Umbra.KeyCode.DOM_VK_NUMPAD6, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.MOVE_EAST], positiveButton: Umbra.KeyCode.DOM_VK_L, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.MOVE_NORTH], positiveButton: Umbra.KeyCode.DOM_VK_UP, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.MOVE_NORTH], positiveButton: Umbra.KeyCode.DOM_VK_NUMPAD8, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.MOVE_NORTH], positiveButton: Umbra.KeyCode.DOM_VK_K, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.MOVE_SOUTH], positiveButton: Umbra.KeyCode.DOM_VK_DOWN, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.MOVE_SOUTH], positiveButton: Umbra.KeyCode.DOM_VK_NUMPAD2, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.MOVE_SOUTH], positiveButton: Umbra.KeyCode.DOM_VK_J, type: Umbra.AxisType.KEY_OR_BUTTON },
            // diagonal movements
            { name: Actors.PlayerAction[Actors.PlayerAction.MOVE_NW], positiveButton: Umbra.KeyCode.DOM_VK_NUMPAD7, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.MOVE_NW], positiveButton: Umbra.KeyCode.DOM_VK_Y, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.MOVE_SW], positiveButton: Umbra.KeyCode.DOM_VK_NUMPAD1, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.MOVE_SW], positiveButton: Umbra.KeyCode.DOM_VK_B, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.MOVE_NE], positiveButton: Umbra.KeyCode.DOM_VK_NUMPAD9, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.MOVE_NE], positiveButton: Umbra.KeyCode.DOM_VK_U, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.MOVE_SE], positiveButton: Umbra.KeyCode.DOM_VK_NUMPAD3, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.MOVE_SE], positiveButton: Umbra.KeyCode.DOM_VK_N, type: Umbra.AxisType.KEY_OR_BUTTON },
            // other movements
            { name: Actors.PlayerAction[Actors.PlayerAction.WAIT], positiveButton: Umbra.KeyCode.DOM_VK_NUMPAD5, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.WAIT], positiveButton: Umbra.KeyCode.DOM_VK_SPACE, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.GRAB], positiveButton: Umbra.KeyCode.DOM_VK_G, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.USE_ITEM], positiveButton: Umbra.KeyCode.DOM_VK_I, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.DROP_ITEM], positiveButton: Umbra.KeyCode.DOM_VK_D, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.THROW_ITEM], positiveButton: Umbra.KeyCode.DOM_VK_T, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.VALIDATE], positiveButton: Umbra.KeyCode.DOM_VK_ENTER, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.VALIDATE], positiveButton: Umbra.KeyCode.DOM_VK_RETURN, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.CANCEL], positiveButton: Umbra.KeyCode.DOM_VK_ESCAPE, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.FIRE], positiveButton: Umbra.KeyCode.DOM_VK_F, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.ZAP], positiveButton: Umbra.KeyCode.DOM_VK_Z, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.ACTIVATE], positiveButton: Umbra.KeyCode.DOM_VK_E, type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.MOVE_DOWN], positiveButton: ">", type: Umbra.AxisType.KEY_OR_BUTTON },
            { name: Actors.PlayerAction[Actors.PlayerAction.MOVE_UP], positiveButton: "<", type: Umbra.AxisType.KEY_OR_BUTTON },
        ]);
    }

    onModalShow(w: Gui.Widget) {
        Actors.Actor.scheduler.pause();
    }

    onModalHide(w: Gui.Widget) {
        Actors.Actor.scheduler.resume();
    }
    /**
        Function: onUpdate
        Triggers actors' A.I. during a new game turn.
    */
    onUpdate(time: number) {
        if (Gui.Widget.getActiveModal() === undefined && Actors.getLastPlayerAction() !== undefined) {
            Actors.Actor.scheduler.resume();
        }
        if (Actors.Actor.scheduler.isPaused()) {
            return;
        }
        let player: Actors.Actor = Actors.Actor.specialActors[Actors.SpecialActors.PLAYER];
        if ( player ) {
            let oldPlayerX: number = player.pos.x;
            let oldPlayerY: number = player.pos.y;
            Actors.Actor.scheduler.run();
            if (player.pos.x !== oldPlayerX || player.pos.y !== oldPlayerY) {
                // the player moved. Recompute the field of view
                this.map.computeFov(player.pos.x, player.pos.y, Actors.FOV_RADIUS);
            }
        }
    }
}
