module Game {
    "use strict";
	/********************************************************************************
	 * Group: map renderer
	 ********************************************************************************/

    export enum ActorRenderMode {
        NONE,
        NORMAL,
        DETECTED,
    }

    export enum CellLightLevel {
        DARKNESS,
        PENUMBRA,
        LIGHT
    }

    export abstract class MapRendererNode extends Umbra.Node {
        protected shader: MapShader;
        constructor(shader: MapShader) {
            super();
            this.shader = shader;
        }
        abstract getActorRenderMode(actor: Actor, detectRange: number): ActorRenderMode;
        abstract canIdentifyActor(actor: Actor): boolean;
        abstract renderActor(con: Yendor.Console, actor: Actor, detectRange: number);
        abstract getCellLightLevel(x: number, y: number): CellLightLevel;
    }


    export class DungeonRendererNode extends MapRendererNode {
        getActorRenderMode(actor: Actor, detectRange: number): ActorRenderMode {
            if (!actor.fovOnly && Engine.instance.map.isExplored(actor.x, actor.y)) {
                return ActorRenderMode.NORMAL;
            }
            var player: Actor = Engine.instance.actorManager.getPlayer();
            if (detectRange > 0 && actor.ai && actor.destructible && !actor.destructible.isDead()
                && Core.Position.distance(player, actor) < detectRange) {
                return ActorRenderMode.DETECTED;
            }
            if (Engine.instance.map.isInFov(actor.x, actor.y)) {
                return ActorRenderMode.NORMAL;
            }
            return ActorRenderMode.NONE;
        }

        canIdentifyActor(actor: Actor): boolean {
            return this.shader.canIdentifyActor(actor);
        }

        getCellLightLevel(x: number, y: number): CellLightLevel {
            return this.shader.getCellLightLevel(x, y);
        }

        renderActor(con: Yendor.Console, actor: Actor, detectRange: number) {
            var renderMode: ActorRenderMode = this.getActorRenderMode(actor, detectRange);
            if (renderMode !== ActorRenderMode.NONE) {
                con.text[actor.x][actor.y] = this.shader.getActorCharCode(actor, renderMode);
                con.fore[actor.x][actor.y] = this.shader.getActorColor(actor, renderMode);
            }
        }


        private renderActorList(actorIds: ActorId[], root: Yendor.Console, detectRange: number) {
            var nbActors: number = actorIds.length;
            for (var i: number = 0; i < nbActors; i++) {
                var actor: Actor = Engine.instance.actorManager.getActor(actorIds[i]);
                Engine.instance.mapRenderer.renderActor(root, actor, detectRange);
            }
        }

        private renderActors(con: Yendor.Console) {
            var player: Actor = Engine.instance.actorManager.getPlayer();
            var detectLifeCond: DetectLifeCondition = <DetectLifeCondition>player.ai.getCondition(ConditionType.DETECT_LIFE);
            var detectRange = detectLifeCond ? detectLifeCond.range : 0;
            this.renderActorList(Engine.instance.actorManager.getCorpseIds(), con, detectRange);
            this.renderActorList(Engine.instance.actorManager.getItemIds(), con, detectRange);
            this.renderActorList(Engine.instance.actorManager.getCreatureIds(), con, detectRange);
        }

        private renderMap(con: Yendor.Console) {
            var map: Map = Engine.instance.map;
            for (var x = 0; x < map.w; x++) {
                for (var y = 0; y < map.h; y++) {
                    con.back[x][y] = this.shader.getBackgroundColor(map, x, y);
                }
            }
        }

        onRender(con: Yendor.Console) {
            // compute the field of view if needed
            var player = Engine.instance.actorManager.getPlayer();
            Engine.instance.map.computeFov(player.x, player.y, Constants.FOV_RADIUS);
            this.shader.prepareFrame();
            this.renderMap(con);
            this.renderActors(con);
        }

        onUpdate(time: number) {
        }
    }
}
