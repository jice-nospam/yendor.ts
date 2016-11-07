/**
 * ==============================================================================
 * Group: map rendering
 * ==============================================================================
 */
import * as Core from "../core/main";
import * as Yendor from "../yendor/main";
import * as Umbra from "../umbra/main";
import * as Actors from "../actors/main";
import { IMapShader } from "./map_shading";
import { Map } from "./map";

/**
 * enum: ActorRenderModeEnum
 * NONE - actor should not be rendered
 * NORMAL - actor rendered using normal shading path
 * DETECTED - actor detected through magic. special render mode (does not take lighting into account)
 */
export const enum ActorRenderModeEnum {
    NONE = 1,
    NORMAL,
    DETECTED,
}

/**
 * enum: CellLightLevelEnum
 * DARKNESS - cannot see the cell
 * PENUMBRA - sees actors but cannot identify them
 * LIGHT - sees and identify actors
 */
export const enum CellLightLevelEnum {
    DARKNESS = 1,
    PENUMBRA,
    LIGHT
}

export enum MapRenderModeEnum {
    NORMAL = 1,
    /** debug mode : display map transparency value */
    TRANSPARENCY,
    /** debug mode : display map lightmap */
    LIGHTMAP,
    /** debug mode : display the player field of view */
    FOV,
    /** debug mode : see all the  map  */
    ALL_SEEING_EYE,
}

/**
 * class : MapRendererNode
 * An Umbra node that renders a map.
 */
export abstract class MapRendererNode extends Umbra.Node {
    protected shader: IMapShader;
    protected actorPriorityMap: number[][];
    protected basePriority: number = 0;
    protected __renderMode: MapRenderModeEnum = MapRenderModeEnum.NORMAL;

    constructor(shader: IMapShader) {
        super();
        this.shader = shader;
    }

    public getRenderMode(): MapRenderModeEnum {
        return this.__renderMode;
    }

    public setRenderMode(mode: MapRenderModeEnum) {
        this.__renderMode = mode;
    }

    public initForNewMap() {
        this.shader.initForNewMap();
    }
    public abstract getActorRenderMode(actor: Actors.Actor, detectRange: number): ActorRenderModeEnum;
    public abstract canIdentifyActor(actor: Actors.Actor): boolean;
    public abstract getCellLightLevel(x: number, y: number): CellLightLevelEnum;
    protected abstract renderActor(con: Yendor.Console, actor: Actors.Actor, detectRange: number): void;
}

/**
 * class: DungeonRendererNode
 * Standard dungeon renderer with floor/wall map and simple one-character actors.
 */
export class DungeonRendererNode extends MapRendererNode {
    /**
     * Function: onRender
     * The actual frame rendering. Render objects in this order:
     * - the map
     * - the corpses
     * - the living actors
     * - the GUI
     */
    public onRender(con: Yendor.Console) {
        // compute the field of view if needed
        let player = Actors.Actor.specialActors[Actors.SpecialActorsEnum.PLAYER];
        if (!Map.current || !player) {
            return;
        }
        switch (this.__renderMode) {
            case MapRenderModeEnum.NORMAL:
                this.renderNormal(con);
                break;
            case MapRenderModeEnum.TRANSPARENCY:
                this.renderTransparency(con);
                break;
            case MapRenderModeEnum.LIGHTMAP:
                this.renderLightmap(con);
                break;
            case MapRenderModeEnum.FOV:
                this.renderFov(con);
                break;
            case MapRenderModeEnum.ALL_SEEING_EYE:
                this.renderAllSeeingEye(con);
                break;
            default: break;
        }
    }

    public getActorRenderMode(actor: Actors.Actor, detectRange: number): ActorRenderModeEnum {
        if (!actor.fovOnly && Map.current.isExplored(actor.pos.x, actor.pos.y)) {
            return ActorRenderModeEnum.NORMAL;
        }
        let player: Actors.Actor = Actors.Actor.specialActors[Actors.SpecialActorsEnum.PLAYER];
        if (detectRange > 0 && actor.ai && actor.destructible && !actor.destructible.isDead()
            && Core.Position.distance(player.pos, actor.pos) < detectRange) {
            return ActorRenderModeEnum.DETECTED;
        }
        if (Map.current.isInFov(actor.pos.x, actor.pos.y)) {
            return ActorRenderModeEnum.NORMAL;
        }
        return ActorRenderModeEnum.NONE;
    }

    public canIdentifyActor(actor: Actors.Actor): boolean {
        return this.__renderMode === MapRenderModeEnum.ALL_SEEING_EYE ? true : this.shader.canIdentifyActor(actor);
    }

    public getCellLightLevel(x: number, y: number): CellLightLevelEnum {
        return this.__renderMode === MapRenderModeEnum.ALL_SEEING_EYE ?
            CellLightLevelEnum.LIGHT : this.shader.getCellLightLevel(x, y);
    }

    protected renderActor(con: Yendor.Console, actor: Actors.Actor, detectRange: number) {
        let renderMode: ActorRenderModeEnum = this.getActorRenderMode(actor, detectRange);
        if (renderMode !== ActorRenderModeEnum.NONE) {
            let pos: Core.Position = actor.pos;
            con.text[pos.x][pos.y] = this.__renderMode === MapRenderModeEnum.ALL_SEEING_EYE ?
                actor.charCode : this.shader.getActorCharCode(actor, renderMode);
            con.fore[pos.x][pos.y] = this.__renderMode === MapRenderModeEnum.ALL_SEEING_EYE ?
                actor.col :
                this.shader.getActorColor(actor, renderMode);
        }
    }

    private renderActors(con: Yendor.Console) {
        let player: Actors.Actor = Actors.Actor.specialActors[Actors.SpecialActorsEnum.PLAYER];
        let detectLifeCond: Actors.DetectLifeCondition =
            <Actors.DetectLifeCondition>player.ai.getCondition(Actors.ConditionTypeEnum.DETECT_LIFE);
        let detectRange = detectLifeCond ? detectLifeCond.range : 0;
        for (let actor of Actors.Actor.list) {
            if (actor.pickable && actor.pickable.containerId) {
                continue;
            }
            let actorPriority = this.basePriority;
            if (actor.isA("key[s]")) {
                actorPriority += 2;
            } else if (actor.isA("item[s]")) {
                actorPriority++;
            } else if (actor.isA("creature[s]") && !actor.destructible.isDead()) {
                actorPriority += 3;
            }
            let mapPriority: number = this.actorPriorityMap[actor.pos.x][actor.pos.y];
            if (mapPriority === undefined || mapPriority < actorPriority) {
                this.renderActor(con, actor, detectRange);
                this.actorPriorityMap[actor.pos.x][actor.pos.y] = actorPriority;
            }
        }
        this.basePriority += 3;
    }

    private renderMap(con: Yendor.Console) {
        let map: Map = Map.current;
        if (!this.actorPriorityMap) {
            this.actorPriorityMap = Core.buildMatrix<number>(map.w);
        }
        for (let x = 0; x < map.w; x++) {
            for (let y = 0; y < map.h; y++) {
                con.back[x][y] = this.shader.getBackgroundColor(map, x, y);
            }
        }
    }

    private renderAllSeeingEye(con: Yendor.Console) {
        let player = Actors.Actor.specialActors[Actors.SpecialActorsEnum.PLAYER];
        con.clearText();
        Map.current.resetFov(true);
        this.shader.prepareFrame();
        this.renderMap(con);
        this.renderActors(con);
        Map.current.setDirty();
        Map.current.computeFov(player.pos.x, player.pos.y, Actors.FOV_RADIUS);
    }

    private renderNormal(con: Yendor.Console) {
        let player = Actors.Actor.specialActors[Actors.SpecialActorsEnum.PLAYER];
        con.clearText();
        Map.current.computeFov(player.pos.x, player.pos.y, Actors.FOV_RADIUS);
        this.shader.prepareFrame();
        this.renderMap(con);
        this.renderActors(con);
    }

    private renderTransparency(con: Yendor.Console) {
        con.clearText();
        con.clearBack(0);
        con.clearFore(0);
        let map: Map = Map.current;
        for (let x = 0; x < map.w; x++) {
            for (let y = 0; y < map.h; y++) {
                con.back[x][y] = map.fov.isTransparent(x, y) ? "#BBBBBB" : "#888888";
            }
        }
    }

    private renderLightmap(con: Yendor.Console) {
        let player = Actors.Actor.specialActors[Actors.SpecialActorsEnum.PLAYER];
        con.clearText();
        Map.current.resetFov(true);
        this.shader.prepareFrame();
        this.renderMap(con);
        this.renderActors(con);
        Map.current.setDirty();
        Map.current.computeFov(player.pos.x, player.pos.y, Actors.FOV_RADIUS);
    }

    private renderFov(con: Yendor.Console) {
        con.clearText();
        con.clearBack(0);
        con.clearFore(0);
        let map: Map = Map.current;
        for (let x = 0; x < map.w; x++) {
            for (let y = 0; y < map.h; y++) {
                con.back[x][y] = map.isInFov(x, y) ? "#BBBBBB" : "#888888";
            }
        }
    }
}
