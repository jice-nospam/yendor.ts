module Game {
    "use strict";
	/********************************************************************************
	 * Group: map shading
	 ********************************************************************************/

    export interface MapShader {
        getActorCharCode(actor: Actor, renderMode: ActorRenderMode): number;
        getActorColor(actor: Actor, renderMode: ActorRenderMode): Core.Color;
        getBackgroundColor(map: Map, x: number, y: number): Core.Color;
        prepareFrame();
        canIdentifyActor(actor: Actor): boolean;
        getCellLightLevel(x: number, y: number): CellLightLevel;
    }

    export class BasicMapShader implements MapShader {
        canIdentifyActor(actor: Actor): boolean {
            return true;
        }

        getActorCharCode(actor: Actor, renderMode: ActorRenderMode): number {
            return actor.charCode;
        }

        getActorColor(actor: Actor, renderMode: ActorRenderMode): Core.Color {
            return actor.col;
        }
        
        getCellLightLevel(x: number, y: number): CellLightLevel {
            return CellLightLevel.LIGHT;
        }

        getBackgroundColor(map: Map, x: number, y: number): Core.Color {
            if (map.isInFov(x, y)) {
                return map.isWall(x, y) ? Constants.LIGHT_WALL : Constants.LIGHT_GROUND;
            } else if (map.isExplored(x, y)) {
                return map.isWall(x, y) ? Constants.DARK_WALL : Constants.DARK_GROUND;
            } else {
                return 0x000000;
            }
        }

        prepareFrame() {
        }
    }

    export class LightDungeonShader extends BasicMapShader implements Umbra.EventListener {
        enableEvents: boolean = true;
        protected lights: Actor[] = [];
        /** 
            Field: dirty
            Whether the light map must be recomputed
        */
        protected lightMap: Core.Color[][];
        protected inFov: boolean[][];
        constructor() {
            super();
            Umbra.EventManager.registerEventListener(this, EventType[EventType.LIGHT_ONOFF]);
            Umbra.EventManager.registerEventListener(this, EventType[EventType.NEW_GAME]);
        }

        getCellLightLevel(x: number, y: number): CellLightLevel {
            if (! this.lightMap ) {
                return CellLightLevel.DARKNESS;
            }
            let lightCol: Core.Color = this.lightMap[x][y];
            if (!lightCol) {
                return CellLightLevel.DARKNESS;
            }
            let intensity: number = Core.ColorUtils.computeIntensity(lightCol);
            if ( intensity > Constants.PENUMBRA_THRESHOLD ) {
                return CellLightLevel.LIGHT;
            } else if ( intensity > 0 ) {
                return CellLightLevel.PENUMBRA;
            }
            return CellLightLevel.DARKNESS;
        }

        canIdentifyActor(actor: Actor): boolean {
            if (!actor.fovOnly) {
                return true;
            }
            let lightCol: Core.Color = this.lightMap[actor.x][actor.y];
            if (!lightCol) {
                return false;
            }
            return Core.ColorUtils.computeIntensity(lightCol) > Constants.PENUMBRA_THRESHOLD
        }

        getActorCharCode(actor: Actor, renderMode: ActorRenderMode): number {
            if (!actor.fovOnly || actor === Engine.instance.actorManager.getPlayer() || renderMode === ActorRenderMode.DETECTED) {
                return super.getActorCharCode(actor, renderMode);
            }

            let lightCol: Core.Color = this.lightMap[actor.x][actor.y];
            if (!lightCol) {
                return Constants.PENUMBRA_ASCIICODE;
            }
            return Core.ColorUtils.computeIntensity(lightCol) <= Constants.PENUMBRA_THRESHOLD ?
                Constants.PENUMBRA_ASCIICODE
                : super.getActorCharCode(actor, renderMode);
        }

        getActorColor(actor: Actor, renderMode: ActorRenderMode): Core.Color {
            if ((!actor.fovOnly && Engine.instance.map.isExplored(actor.x, actor.y)) || renderMode === ActorRenderMode.DETECTED) {
                return super.getActorColor(actor, renderMode);
            }
            let lightCol: Core.Color = this.lightMap[actor.x][actor.y];
            if (!lightCol) {
                return 0;
            }
            return Core.ColorUtils.colorMultiply(super.getActorColor(actor, renderMode), lightCol);
        }

        getBackgroundColor(map: Map, x: number, y: number): Core.Color {
            let lightCol: Core.Color = this.lightMap[x][y];
            if (map.isWall(x, y) && map.isExplored(x, y)) {
                if ( lightCol ) {
                    let result: Core.Color = Core.ColorUtils.colorMultiply(super.getBackgroundColor(map, x, y), lightCol);
                    return Core.ColorUtils.max(result, Constants.DARK_WALL);
                } else {
                     return Constants.DARK_WALL;
                }
            }
            if (!lightCol || !map.isInFov(x, y)) {
                return 0;
            }
            return Core.ColorUtils.colorMultiply(super.getBackgroundColor(map, x, y), lightCol);
        }

        onNewGame() {
            this.lights = [];
        }
        
        onLightOnoff(actor: Actor) {
            // maintain a list of active lights
            if (! actor.light ) {
                return;
            }
            if (! actor.activable || actor.activable.isActive() ) {
                if (this.lights.indexOf(actor) === -1) {
                    this.lights.push(actor);
                }
            } else {
                let idx: number = this.lights.indexOf(actor);
                if (idx !== -1) {
                    this.lights.splice(idx, 1);
                }
            }
        }

        prepareFrame() {
            if (!this.lightMap) {
                this.lightMap = Core.buildMatrix<Core.Color>(Engine.instance.map.w);
                this.inFov = Core.buildMatrix<boolean>(Engine.instance.map.w);
            }
            this.clearLightmap();
            for (let idx: number = 0, len: number = this.lights.length; idx < len; ++idx) {
                let actor: Actor = this.lights[idx];
                let intensityCoef: number = actor.light.computeIntensityVariation(Umbra.application.elapsedTime);
                this.computeLightMap(actor, intensityCoef);
            }
            // finalement, add the "no light" light
            let player: Actor = Engine.instance.actorManager.getPlayer();
            if ( player.light) {
                this.computeLightMap(player, 1);
            }
        }

        private clearLightmap() {
            let w: number = Engine.instance.map.w;
            let h: number = Engine.instance.map.h;
            for (let x: number = 0; x < w; ++x) {
                for (let y: number = 0; y < h; ++y) {
                    this.lightMap[x][y] = 0;
                }
            }
        }

        private computeLightMap(actor: Actor, intensityCoef: number) {
            let range: Core.Rect = new Core.Rect();
            range.x = actor.x - actor.light.options.range;
            range.y = actor.y - actor.light.options.range;
            range.w = actor.light.options.range * 2 + 1;
            range.h = actor.light.options.range * 2 + 1;
            range.clamp(0, 0, Engine.instance.map.w, Engine.instance.map.h);
            let squaredRange: number = actor.light.options.range;
            squaredRange = squaredRange * squaredRange;
            let invSquaredRange = 1 / squaredRange;
            // we use intensity variation coef to also slightly move the light position
            let posVariationCoef = actor.light.options.intensityVariationRange ? ((1-intensityCoef) / actor.light.options.intensityVariationRange -0.5) * 0.25 : 0;
            Engine.instance.map.fov.computeFov(this.inFov, actor.x, actor.y, actor.light.options.range);
            let lightOperation: (c1:Core.Color, c2:Core.Color) => Core.Color;
            switch( actor.light.options.renderMode) {
                case LightRenderMode.MAX: lightOperation = Core.ColorUtils.max; break;
                default:
                case LightRenderMode.ADDITIVE: lightOperation = Core.ColorUtils.add; break;
            }
            for (let x: number = range.x, xmax: number = range.x + range.w; x < xmax; ++x) {
                let dx2 = actor.x - x + posVariationCoef;
                dx2 = dx2 * dx2;
                for (let y: number = range.y, ymax: number = range.y + range.h; y < ymax; ++y) {
                    let dy2 = actor.y - y - posVariationCoef;
                    dy2 = dy2 * dy2;
                    if (dx2 + dy2 <= squaredRange && this.inFov[x][y]) {
                        let intensity: number = actor.light.computeIntensity(dx2 + dy2) * intensityCoef;
                        
                        this.lightMap[x][y] = lightOperation(this.lightMap[x][y], Core.ColorUtils.multiply(actor.light.options.color, intensity));
                    }
                }
            }
        }
    }
}
