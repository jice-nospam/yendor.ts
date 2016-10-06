/**
 * ==============================================================================
 * Group: map rendering
 * ==============================================================================
 */
import * as Core from "../core/main";
import * as Umbra from "../umbra/main";
import * as Actors from "../actors/main";
import {Map} from "./map";
import {ActorRenderModeEnum, CellLightLevelEnum} from "./map_render";
import {DARK_GROUND, DARK_WALL, LIGHT_GROUND, LIGHT_WALL} from "./constants";

export interface IMapShader {
    initForNewMap(): void;
    getActorCharCode(actor: Actors.Actor, renderMode: ActorRenderModeEnum): number;
    getActorColor(actor: Actors.Actor, renderMode: ActorRenderModeEnum): Core.Color;
    getBackgroundColor(map: Map, x: number, y: number): Core.Color;
    prepareFrame(): void;
    canIdentifyActor(actor: Actors.Actor): boolean;
    getCellLightLevel(x: number, y: number): CellLightLevelEnum;
}

export class BasicMapShader implements IMapShader {
    public initForNewMap() {

    }

    public canIdentifyActor(_actor: Actors.Actor): boolean {
        return true;
    }

    public getActorCharCode(actor: Actors.Actor, _renderMode: ActorRenderModeEnum): number {
        return actor.charCode;
    }

    public getActorColor(actor: Actors.Actor, _renderMode: ActorRenderModeEnum): Core.Color {
        return actor.col;
    }

    public getCellLightLevel(_x: number, _y: number): CellLightLevelEnum {
        return CellLightLevelEnum.LIGHT;
    }

    public getBackgroundColor(map: Map, x: number, y: number): Core.Color {
        if (map.isInFov(x, y)) {
            return map.isWall(x, y) ? LIGHT_WALL : LIGHT_GROUND;
        } else if (map.isExplored(x, y)) {
            return map.isWall(x, y) ? DARK_WALL : DARK_GROUND;
        } else {
            return 0x000000;
        }
    }

    public prepareFrame() {
    }
}

export class LightDungeonShader implements Umbra.IEventListener, IMapShader {
    public enableEvents: boolean = true;
    /** lights to render, indexed by LightRenderMode */
    protected lights: {[index: number]: Actors.Actor[]};
    protected lightMap: Core.Color[][];
    protected inFov: boolean[][];
    protected nolightShader: IMapShader;
    constructor(nolightShader: IMapShader) {
        Umbra.EventManager.registerEventListener(this, Actors.EVENT_LIGHT_ONOFF);
        this.initForNewMap();
        this.nolightShader = nolightShader;
    }
    // TODO unregister when destroying object

    public initForNewMap() {
        this.lights = {};
        this.lights[Actors.LightRenderModeEnum.ADDITIVE] = [];
        this.lights[Actors.LightRenderModeEnum.MAX] = [];
        // check if the player has an active light
        let player: Actors.Actor = Actors.Actor.specialActors[Actors.SpecialActorsEnum.PLAYER];
        if ( player && player.container ) {
            for (let i: number = 0, count: number = player.container.size(); i < count; ++i) {
                let item: Actors.Actor|undefined = player.container.get(i);
                if (item && item.light && (!item.activable || item.activable.isActive())) {
                    this.onLightOnoff(item);
                }
            }
            if ( player.light ) {
                this.onLightOnoff(player);
            }
        }
    }

    public getCellLightLevel(x: number, y: number): CellLightLevelEnum {
        if (! this.lightMap ) {
            return CellLightLevelEnum.DARKNESS;
        }
        let lightCol: Core.Color = this.lightMap[x][y];
        if (!lightCol) {
            return CellLightLevelEnum.DARKNESS;
        }
        let intensity: number = Core.ColorUtils.computeIntensity(lightCol);
        if ( intensity > Actors.PENUMBRA_THRESHOLD ) {
            return CellLightLevelEnum.LIGHT;
        } else if ( intensity > 0 ) {
            return CellLightLevelEnum.PENUMBRA;
        }
        return CellLightLevelEnum.DARKNESS;
    }

    public canIdentifyActor(actor: Actors.Actor): boolean {
        if (!actor.fovOnly) {
            return true;
        }
        let lightCol: Core.Color = this.lightMap[actor.pos.x][actor.pos.y];
        if (!lightCol) {
            return false;
        }
        return Core.ColorUtils.computeIntensity(lightCol) > Actors.PENUMBRA_THRESHOLD;
    }

    public getActorCharCode(actor: Actors.Actor, renderMode: ActorRenderModeEnum): number {
        if (!actor.fovOnly || actor === Actors.Actor.specialActors[Actors.SpecialActorsEnum.PLAYER]
            || renderMode === ActorRenderModeEnum.DETECTED) {
            return this.nolightShader.getActorCharCode(actor, renderMode);
        }

        let lightCol: Core.Color = this.lightMap[actor.pos.x][actor.pos.y];
        if (!lightCol) {
            return Actors.PENUMBRA_ASCIICODE;
        }
        return Core.ColorUtils.computeIntensity(lightCol) <= Actors.PENUMBRA_THRESHOLD ?
            Actors.PENUMBRA_ASCIICODE
            : this.nolightShader.getActorCharCode(actor, renderMode);
    }

    public getActorColor(actor: Actors.Actor, renderMode: ActorRenderModeEnum): Core.Color {
        if ((!actor.fovOnly && Map.current.isExplored(actor.pos.x, actor.pos.y))
            || renderMode === ActorRenderModeEnum.DETECTED) {
            return this.nolightShader.getActorColor(actor, renderMode);
        }
        let lightCol: Core.Color = this.lightMap[actor.pos.x][actor.pos.y];
        if (!lightCol) {
            return 0;
        }
        return Core.ColorUtils.colorMultiply(this.nolightShader.getActorColor(actor, renderMode), lightCol);
    }

    public getBackgroundColor(map: Map, x: number, y: number): Core.Color {
        let lightCol: Core.Color = this.lightMap[x][y];
        if (map.isWall(x, y) && map.isExplored(x, y)) {
            if ( map.isInFov(x, y) && lightCol
                && Core.ColorUtils.computeIntensity(lightCol) > Actors.PENUMBRA_THRESHOLD ) {
                return Core.ColorUtils.colorMultiply(this.nolightShader.getBackgroundColor(map, x, y), lightCol);
            } else {
                return DARK_WALL;
            }
        }
        if (!lightCol || !map.isInFov(x, y)) {
            return 0;
        }
        return Core.ColorUtils.colorMultiply(this.nolightShader.getBackgroundColor(map, x, y), lightCol);
    }

    public onLightOnoff(actor: Actors.Actor) {
        // maintain a list of active lights
        if (! actor.light ) {
            return;
        }
        if (! actor.activable || actor.activable.isActive() ) {
            if (this.lights[actor.light.options.renderMode].indexOf(actor) === -1) {
                this.lights[actor.light.options.renderMode].push(actor);
            }
        } else {
            let idx: number = this.lights[actor.light.options.renderMode].indexOf(actor);
            if (idx !== -1) {
                this.lights[actor.light.options.renderMode].splice(idx, 1);
            }
        }
    }

    public prepareFrame() {
        if (!this.lightMap) {
            this.lightMap = Core.buildMatrix<Core.Color>(Map.current.w);
            this.inFov = Core.buildMatrix<boolean>(Map.current.w);
        }
        this.clearLightmap();
        this.computeLightMaps(Actors.LightRenderModeEnum.ADDITIVE);
        this.computeLightMaps(Actors.LightRenderModeEnum.MAX);
    }

    private computeLightMaps(mode: Actors.LightRenderModeEnum) {
        for (let actor of this.lights[mode]) {
            let intensityCoef: number = actor.light.computeIntensityVariation(Umbra.application.elapsedTime);
            this.computeLightMap(actor, intensityCoef);
        }
    }

    private clearLightmap() {
        let w: number = Map.current.w;
        let h: number = Map.current.h;
        for (let x: number = 0; x < w; ++x) {
            for (let y: number = 0; y < h; ++y) {
                this.lightMap[x][y] = 0;
            }
        }
    }

    private computeLightMap(actor: Actors.Actor, intensityCoef: number) {
        let range: Core.Rect = new Core.Rect();
        let pos: Core.Position = actor.light.position;
        if (pos === undefined) {
            pos = actor.pos;
        }
        range.x = pos.x - actor.light.options.range;
        range.y = pos.y - actor.light.options.range;
        range.w = actor.light.options.range * 2 + 1;
        range.h = actor.light.options.range * 2 + 1;
        range.clamp(0, 0, Map.current.w, Map.current.h);
        let squaredRange: number = actor.light.options.range;
        squaredRange = squaredRange * squaredRange;
        // we use intensity variation coef to also slightly move the light position
        let posVariationCoef = actor.light.options.intensityVariationRange ?
            ((1 - intensityCoef) / actor.light.options.intensityVariationRange - 0.5) * 0.25 : 0;
        Map.current.fov.computeFov(this.inFov, pos.x, pos.y, actor.light.options.range);
        let lightOperation: (c1: Core.Color, c2: Core.Color) => Core.Color;
        switch (actor.light.options.renderMode) {
            case Actors.LightRenderModeEnum.MAX: lightOperation = Core.ColorUtils.max; break;
            default:
            case Actors.LightRenderModeEnum.ADDITIVE: lightOperation = Core.ColorUtils.add; break;
        }
        for (let x: number = range.x, xmax: number = range.x + range.w; x < xmax; ++x) {
            let dx2 = pos.x - x + posVariationCoef;
            dx2 = dx2 * dx2;
            for (let y: number = range.y, ymax: number = range.y + range.h; y < ymax; ++y) {
                let dy2 = pos.y - y - posVariationCoef;
                dy2 = dy2 * dy2;
                if (dx2 + dy2 <= squaredRange && this.inFov[x][y]) {
                    let intensity: number = actor.light.computeIntensity(dx2 + dy2) * intensityCoef;
                    this.lightMap[x][y] = lightOperation(this.lightMap[x][y],
                        Core.ColorUtils.multiply(actor.light.options.color, intensity));
                }
            }
        }
    }
}
