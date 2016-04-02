module Game {
    "use strict";
	/********************************************************************************
	 * Group: map renderer
	 ********************************************************************************/
    /**
        enum: ActorRenderMode
        NONE - actor should not be rendered
        NORMAL - actor rendered using normal shading path
        DETECTED - actor detected through magic. special render mode (does not take lighting into account)
     */
    export enum ActorRenderMode {
        NONE,
        NORMAL,
        DETECTED,
    }

    /**
        enum: CellLightLevel
        DARKNESS - cannot see the cell
        PENUMBRA - sees actors but cannot identify them
        LIGHT - sees and identify actors
     */
    export enum CellLightLevel {
        DARKNESS,
        PENUMBRA,
        LIGHT
    }

    /**
        class : MapRendererNode
        An Umbra node that renders a map.
     */
    export abstract class MapRendererNode extends Umbra.Node {
        protected shader: MapShader;
        protected actorPriorityMap: number[][];
        protected basePriority: number=0;
        constructor(shader: MapShader) {
            super();
            this.shader = shader;
        }
        abstract getActorRenderMode(actor: Actor, detectRange: number): ActorRenderMode;
        abstract canIdentifyActor(actor: Actor): boolean;
        abstract renderActor(con: Yendor.Console, actor: Actor, detectRange: number);
        abstract getCellLightLevel(x: number, y: number): CellLightLevel;
    }

    /**
        class: DungeonRendererNode
        Standard dungeon renderer with floor/wall map and simple one-character actors.
     */
    export class DungeonRendererNode extends MapRendererNode {
        getActorRenderMode(actor: Actor, detectRange: number): ActorRenderMode {
            if (!actor.fovOnly && Engine.instance.map.isExplored(actor.pos.x, actor.pos.y)) {
                return ActorRenderMode.NORMAL;
            }
            let player: Actor = Engine.instance.actorManager.getPlayer();
            if (detectRange > 0 && actor.ai && actor.destructible && !actor.destructible.isDead()
                && Core.Position.distance(player.pos, actor.pos) < detectRange) {
                return ActorRenderMode.DETECTED;
            }
            if (Engine.instance.map.isInFov(actor.pos.x, actor.pos.y)) {
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
            let renderMode: ActorRenderMode = this.getActorRenderMode(actor, detectRange);
            if (renderMode !== ActorRenderMode.NONE) {
                let pos: Core.Position = actor.pos;
                con.text[pos.x][pos.y] = this.shader.getActorCharCode(actor, renderMode);
                con.fore[pos.x][pos.y] = this.shader.getActorColor(actor, renderMode);
            }
        }

        private renderActors(con: Yendor.Console) {
            let player: Actor = Engine.instance.actorManager.getPlayer();
            let detectLifeCond: DetectLifeCondition = <DetectLifeCondition>player.ai.getCondition(ConditionType.DETECT_LIFE);
            let detectRange = detectLifeCond ? detectLifeCond.range : 0;
            Engine.instance.actorManager.map(function(actor: Actor): boolean {
               let actorPriority = this.basePriority;
               if ( actor.isA("item")) {
                   actorPriority++;
               } else if ( actor.isA("creature") && ! actor.destructible.isDead()) {
                   actorPriority+=2;
               }
               let mapPriority: number = this.actorPriorityMap[actor.pos.x][actor.pos.y];
               if (mapPriority === undefined || mapPriority < actorPriority) {
                   this.renderActor(con, actor, detectRange);
                   this.actorPriorityMap[actor.pos.x][actor.pos.y] = actorPriority;
               }
               return false;
            }.bind(this));
            this.basePriority += 3;
        }

        private renderMap(con: Yendor.Console) {
            let map: Map = Engine.instance.map;
            if (! this.actorPriorityMap) {
                this.actorPriorityMap = Core.buildMatrix<number>(map.w);            
            }
            for (let x = 0; x < map.w; x++) {
                for (let y = 0; y < map.h; y++) {
                    con.back[x][y] = this.shader.getBackgroundColor(map, x, y);
                }
            }
        }

        onRender(con: Yendor.Console) {
            // compute the field of view if needed
            let player = Engine.instance.actorManager.getPlayer();
            Engine.instance.map.computeFov(player.pos.x, player.pos.y, Constants.FOV_RADIUS);
            this.shader.prepareFrame();
            this.renderMap(con);
            this.renderActors(con);
        }

        onUpdate(time: number) {
        }
    }
}
