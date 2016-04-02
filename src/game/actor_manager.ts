/**
	Section: actors
*/
module Game {
    "use strict";
	/********************************************************************************
	 * Group: actor manager Umbra node
	 ********************************************************************************/

    export interface ActorProcessor {
        /** return true to stop iterating */
        (actor: Actor): boolean;
    }

    export interface ActorFilter {
        /** return true to select the actor */
        (actor: Actor): boolean;
    }

	/**
		Class: ActorManagerNode
		Stores all the actors in the game.
	*/
    export class ActorManagerNode extends Umbra.Node implements Umbra.EventListener {
        private playerId: ActorId;
        private stairsUpId: ActorId;
        private stairsDownId: ActorId;
        private scheduler: Yendor.Scheduler = new Yendor.Scheduler();
        private actors: { [index: number]: Actor } = {};
        public enableEvents: boolean = true;

        constructor() {
            super();
            Umbra.EventManager.registerEventListener(this, EventType[EventType.LOAD_GAME]);
            Umbra.EventManager.registerEventListener(this, EventType[EventType.SAVE_GAME]);
            Umbra.EventManager.registerEventListener(this, EventType[EventType.DELETE_SAVEGAME]);
            Umbra.EventManager.registerEventListener(this, Gizmo.EventType[Gizmo.EventType.MODAL_SHOW]);
            Umbra.EventManager.registerEventListener(this, Gizmo.EventType[Gizmo.EventType.MODAL_HIDE]);
        }

        onModalShow(w: Gizmo.Widget) {
            this.pause();
        }

        onModalHide(w: Gizmo.Widget) {
            this.resume();
        }

        getPlayer(): Player {
            return <Player>this.actors[this.playerId];
        }

        getActor(id: ActorId) {
            return this.actors[id];
        }

        map(actorProcessor: ActorProcessor) {
            for (let index in this.actors) {
                if (this.actors.hasOwnProperty(index)) {
                    if (actorProcessor(this.actors[index])) {
                        return;
                    }
                }
            }
        }

        filter(actorFilter: ActorFilter): Actor[] {
            let selectedActors: Actor[] = [];
            for (let index in this.actors) {
                if (this.actors.hasOwnProperty(index) && actorFilter(this.actors[index])) {
                    selectedActors.push(this.actors[index]);
                }
            }
            return selectedActors;
        }
        
        filterAndCount(actorFilter: ActorFilter): number {
            let actorCount: number = 0;
            for (let index in this.actors) {
                if (this.actors.hasOwnProperty(index) && actorFilter(this.actors[index])) {
                    actorCount++;
                }
            }
            return actorCount;
        }        

        registerActor(actor: Actor) {
            if (Yendor.urlParams[Constants.URL_PARAM_DEBUG]) {
                console.log("new actor " + actor.readableId + "[" + actor.id.toString(16) + "]");
            }
            this.actors[actor.id] = actor;
        }

        addActor(actor: Actor) {
            if (actor) {
                if (actor.ai) {
                    this.scheduler.add(actor);
                }
                if (actor.light && (!actor.activable || actor.activable.isActive())) {
                    Umbra.EventManager.publishEvent(EventType[EventType.LIGHT_ONOFF], actor);
                }
                // possibly set the map transparency
                actor.moveTo(actor.pos.x, actor.pos.y);
            }
        }

        getStairsUp(): Actor {
            return this.actors[this.stairsUpId];
        }

        getStairsDown(): Actor {
            return this.actors[this.stairsDownId];
        }

        destroyActor(actorId: ActorId) {
            let actor: Actor = this.actors[actorId];
            let wearer: Actor = actor.getWearer();
            if (wearer) {
                wearer.container.remove(actor.id, wearer);
            }
            if (actor.ai) {
                this.scheduler.remove(actor);
            }
            if (actor.activable && actor.activable.isActive() && actor.light) {
                actor.activable.deactivate(actor);
            }
            if (actor.container) {
                let i: number = actor.container.size();
                while ( i > 0 ) {
                    this.destroyActor(actor.container.get(0).id);
                    --i;
                }
            }
            delete this.actors[actorId];
        }

        newLevel() {
            // remove all actors but the player and its inventory (except unused keys)
            let player: Player = this.getPlayer();
            this.map(function(actor: Actor): boolean {
                if ( actor !== player && (actor.isA("key") || !player.contains(actor.id))) {
                    this.destroyActor(actor.id);
                }
                return false;
            }.bind(this));
            this.createStairs();
        }
        
        newGame() {
            this.map(function(actor: Actor): boolean {
                this.destroyActor(actor.id);
                return false;
            }.bind(this));
            this.createStairs();
            this.createPlayer();
        }

        onRender(root: Yendor.Console) {
        }

        isPlayerDead(): boolean {
            return this.getPlayer().destructible.isDead();
        }

		/**
			Function: onUpdate
			Triggers actors' A.I. during a new game turn.
		*/
        onUpdate(time: number) {
            if (Gizmo.Widget.getActiveModal() === undefined && getLastPlayerAction() !== undefined) {
                this.resume();
            }
            if (this.isPaused()) {
                return;
            }
            let player: Actor = this.getPlayer();
            let oldPlayerX: number = player.pos.x;
            let oldPlayerY: number = player.pos.y;
            this.scheduler.run();
            if (player.pos.x !== oldPlayerX || player.pos.y !== oldPlayerY) {
                // the player moved. Recompute the field of view
                Engine.instance.map.computeFov(player.pos.x, player.pos.y, Constants.FOV_RADIUS);
            }
        }

        resume() {
            this.scheduler.resume();
        }

        pause() {
            if (!this.isPaused()) {
                Engine.instance.saveGame();
            }
            this.scheduler.pause();
        }

        isPaused() {
            return this.scheduler.isPaused();
        }

		/**
			Function: createStairs
			Create the actors for up and down stairs. The position is not important, actors will be placed by the dungeon builder.
		*/
        createStairs() {
            this.stairsUpId = ActorFactory.create(ActorType.STAIRS_UP).id;
            this.stairsDownId = ActorFactory.create(ActorType.STAIRS_DOWN).id;
        }

        createPlayer() {
            let player: Actor = ActorFactory.create(ActorType.PLAYER);
            this.playerId = player.id;
            this.addActor(player);
        }

        onLoadGame() {
            let persister: Core.Persister = Engine.instance.persister;
            this.actors = persister.loadFromKey(Constants.PERSISTENCE_ACTORS_KEY);
            this.map(function(actor: Actor): boolean {
                if ( actor.isA("player")) {
                    this.playerId = actor.id;
                } else if ( actor.isA("stairs up")) {
                    this.stairsUpId = actor.id;
                } else if ( actor.isA("stairs down")) {
                    this.stairsDownId = actor.id;
                }
                if (actor.ai) {
                    this.scheduler.add(actor);
                }
                /*
                already done in actor.postLoad
                if ( actor.light && (!actor.activable || actor.activable.isActive())) {
                    Umbra.EventManager.publishEvent(EventType[EventType.LIGHT_ONOFF], actor);
                }
                */
                return false;
            }.bind(this));
        }

        onSaveGame() {
            let persister: Core.Persister = Engine.instance.persister;
            persister.saveToKey(Constants.PERSISTENCE_ACTORS_KEY, this.actors);
        }

        onDeleteSavegame() {
            let persister: Core.Persister = Engine.instance.persister;
            persister.deleteKey(Constants.PERSISTENCE_ACTORS_KEY);
        }

		/**
			Function: findClosestActor

			In the `actors` array, find the closest actor (except the player) from position `pos` within `range`.
			If range is 0, no range limitation.
		*/
        findClosestEnemy(pos: Core.Position, range: number): Actor {
            let bestDistance: number = 1E8;
            let closestActor: Actor;
            let player: Actor = this.getPlayer();
            for (let index in this.actors) {
                if (this.actors.hasOwnProperty(index)) {
                    let actor: Actor = this.actors[index];
                    if (actor !== player && actor.isA("creature") && ! actor.destructible.isDead()) {
                        let distance: number = Core.Position.distance(pos, actor.pos);
                        if (distance < bestDistance && (distance < range || range === 0)) {
                            bestDistance = distance;
                            closestActor = actor;
                        }
                    }
                }
            }
            return closestActor;
        }
    }

}
