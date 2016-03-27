/**
	Section: actors
*/
module Game {
    "use strict";
	/********************************************************************************
	 * Group: actor manager Umbra node
	 ********************************************************************************/

    export interface ActorProcessor {
        (actor: Actor): void;
    }

    export interface ActorFilter {
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
        private creatureIds: ActorId[];
        private corpseIds: ActorId[];
        private updatingCorpseIds: ActorId[];
        private itemIds: ActorId[];
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
                    actorProcessor(this.actors[index]);
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

        registerActor(actor: Actor) {
            if (Yendor.urlParams[Constants.URL_PARAM_DEBUG]) {
                console.log("new actor " + actor.readableId + "[" + actor.id.toString(16) + "]");
            }
            this.actors[actor.id] = actor;
        }

        addCreature(actor: Actor) {
            if (actor) {
                this.creatureIds.push(actor.id);
                this.scheduler.add(actor);
                // possibly set the map transparency
                actor.moveTo(actor.x, actor.y);
            }
        }

        addItem(actor: Actor) {
            if (actor) {
                this.itemIds.push(actor.id);
                if (actor.ai) {
                    this.scheduler.add(actor);
                }
                // possibly set the map transparency
                actor.moveTo(actor.x, actor.y);
            }
        }

        getCreatureIds(): ActorId[] {
            return this.creatureIds;
        }

        getItemIds(): ActorId[] {
            return this.itemIds;
        }

        getCorpseIds(): ActorId[] {
            return this.corpseIds;
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
            if (actor.activable && actor.activable.isActive()) {
                actor.activable.deactivate(actor);
            }
            delete this.actors[actorId];
            let idList: ActorId[] = this.creatureIds;
            let index: number = idList.indexOf(actorId);
            if (index !== -1) {
                idList.splice(index, 1);
            }
            idList = this.itemIds;
            index = idList.indexOf(actorId);
            if (index !== -1) {
                idList.splice(index, 1);
            }
            idList = this.corpseIds;
            index = idList.indexOf(actorId);
            if (index !== -1) {
                idList.splice(index, 1);
            }
            idList = this.updatingCorpseIds;
            index = idList.indexOf(actorId);
            if (index !== -1) {
                idList.splice(index, 1);
            }
        }

        deleteActor(actorId: ActorId) {
            let actor: Actor = this.actors[actorId];
            if (!actor) {
                return;
            }
            if (actor.activable && actor.activable.isActive()) {
                actor.activable.deactivate(actor);
            }
            if (actor.container) {
                for (let i: number = 0, len: number = actor.container.size(); i < len; ++i) {
                    this.deleteActor(actor.container.get(i).id);
                }
            }
            delete this.actors[actorId];
        }

        clear() {
            // remove all actors but the player and its inventory
            if (this.creatureIds) {
                let player: Player = this.getPlayer();
                this.creatureIds.forEach((actorId: ActorId) => {
                    if (actorId !== this.playerId) { this.deleteActor(actorId); }
                });
                this.itemIds.forEach((actorId: ActorId) => { if (!player.container.contains(actorId)) { this.deleteActor(actorId); } });
                this.corpseIds.forEach((actorId: ActorId) => { this.deleteActor(actorId); });
                this.updatingCorpseIds.forEach((actorId: ActorId) => { this.deleteActor(actorId); });
            }
            // TODO remove creature inventory items when creatures have inventory
            this.removePlayerKeys();
            this.creatureIds = [];
            this.corpseIds = [];
            this.updatingCorpseIds = [];
            this.itemIds = [];
            this.scheduler.clear();
        }

        private removePlayerKeys() {
            let player: Player = this.getPlayer();
            if (player === undefined) {
                return;
            }
            for (let i: number = 0, len: number = player.container.size(); i < len; ++i) {
                let key: Actor = player.container.get(i);
                if (key.isA("key")) {
                    player.container.remove(key.id, player);
                    i--;
                    len--;
                    delete this.actors[key.id];
                }
            }
        }

        /**
            Function: reset
            Reset the actors for a new level/game
        */
        reset(newGame: boolean) {
            this.clear();
            this.createStairs();
            if (newGame) {
                this.createPlayer();
            } else {
                // don't recreate the player in case of new level
                let player: Player = this.getPlayer();
                this.addCreature(player);
                for (let i: number = 0, len: number = player.container.size(); i < len; ++i) {
                    let item: Actor = player.container.get(i);
                    if (item.ai) {
                        this.scheduler.add(item);
                    }
                }
            }
        }



        onRender(root: Yendor.Console) {
        }

        isPlayerDead(): boolean {
            return this.getPlayer().destructible.isDead();
        }

		/**
			Function: onUpdate
			Triggers actors' A.I. during a new game turn.
			Moves the dead actors from the actor list to the corpse list.
		*/
        onUpdate(time: number) {
            if (Gizmo.Widget.getActiveModal() === undefined && getLastPlayerAction() !== undefined) {
                this.resume();
            }
            if (this.isPaused()) {
                return;
            }
            let player: Actor = this.getPlayer();
            let oldPlayerX: number = player.x;
            let oldPlayerY: number = player.y;
            this.scheduler.run();
            this.moveDeadToCorpse();
            this.updateCorpses();
            if (player.x !== oldPlayerX || player.y !== oldPlayerY) {
                // the player moved. Recompute the field of view
                Engine.instance.map.computeFov(player.x, player.y, Constants.FOV_RADIUS);
            }
        }

        private moveDeadToCorpse() {
            for (let i: number = 0, len: number = this.creatureIds.length; i < len; ++i) {
                let actor: Actor = this.actors[this.creatureIds[i]];
                if (actor.isA("creature") && actor.destructible && actor.destructible.isDead()) {
                    // actor is dead. move it to corpse list
                    // note that corpses must still be updated until they have no active conditions
                    // for example, to make it possible for corpses to unfreeze.
                    if (!actor.ai.hasActiveConditions()) {
                        this.scheduler.remove(actor);
                    } else {
                        this.updatingCorpseIds.push(actor.id);
                    }
                    this.creatureIds.splice(i, 1);
                    i--;
                    len--;
                    this.corpseIds.push(actor.id);
                }
            }
        }

        private updateCorpses() {
            for (let i: number = 0, len: number = this.updatingCorpseIds.length; i < len; ++i) {
                let actor: Actor = this.actors[this.updatingCorpseIds[i]];
                if (!actor.ai.hasActiveConditions()) {
                    this.scheduler.remove(actor);
                    this.updatingCorpseIds.splice(i, 1);
                    i--;
                    len--;
                }
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

        removeItem(itemId: ActorId) {
            let idx: number = this.itemIds.indexOf(itemId);
            if (idx !== -1) {
                this.itemIds.splice(idx, 1);
            }
        }

		/**
			Function: createStairs
			Create the actors for up and down stairs. The position is not important, actors will be placed by the dungeon builder.
		*/
        createStairs() {
            this.stairsUpId = ActorFactory.create(ActorType.STAIRS_UP).id;
            this.stairsDownId = ActorFactory.create(ActorType.STAIRS_DOWN).id;
            this.itemIds.push(this.stairsUpId);
            this.itemIds.push(this.stairsDownId);
        }

        createPlayer() {
            let player: Actor = ActorFactory.create(ActorType.PLAYER);
            this.playerId = player.id;
            this.addCreature(player);
        }

        onLoadGame() {
            let persister: Persister = Engine.instance.persister;
            this.actors = persister.loadFromKey(Constants.PERSISTENCE_ACTORS_KEY);
            this.creatureIds = persister.loadFromKey(Constants.PERSISTENCE_CREATURE_IDS_KEY);
            for (let i: number = 0, len: number = this.creatureIds.length; i < len; ++i) {
                this.scheduler.add(this.actors[this.creatureIds[i]]);
            }
            this.playerId = this.creatureIds[0];
            this.itemIds = persister.loadFromKey(Constants.PERSISTENCE_ITEM_IDS_KEY);
            for (let i: number = 0, len: number = this.itemIds.length; i < len; ++i) {
                let item: Actor = this.actors[this.itemIds[i]];
                if (item.ai) {
                    this.scheduler.add(item);
                }
            }
            this.stairsUpId = this.itemIds[0];
            this.stairsDownId = this.itemIds[1];
            this.corpseIds = persister.loadFromKey(Constants.PERSISTENCE_CORPSE_IDS_KEY);
            this.updatingCorpseIds = persister.loadFromKey(Constants.PERSISTENCE_UPDATING_CORPSE_IDS_KEY);
            for (let i: number = 0, len: number = this.updatingCorpseIds.length; i < len; ++i) {
                this.scheduler.add(this.actors[this.updatingCorpseIds[i]]);
            }
        }

        onSaveGame() {
            let persister: Persister = Engine.instance.persister;
            persister.saveToKey(Constants.PERSISTENCE_ACTORS_KEY, this.actors);
            persister.saveToKey(Constants.PERSISTENCE_CREATURE_IDS_KEY, this.creatureIds);
            persister.saveToKey(Constants.PERSISTENCE_ITEM_IDS_KEY, this.itemIds);
            persister.saveToKey(Constants.PERSISTENCE_CORPSE_IDS_KEY, this.corpseIds);
            persister.saveToKey(Constants.PERSISTENCE_UPDATING_CORPSE_IDS_KEY, this.updatingCorpseIds);
        }

        onDeleteSavegame() {
            let persister: Persister = Engine.instance.persister;
            persister.deleteKey(Constants.PERSISTENCE_ACTORS_KEY);
            persister.deleteKey(Constants.PERSISTENCE_CREATURE_IDS_KEY);
            persister.deleteKey(Constants.PERSISTENCE_ITEM_IDS_KEY);
            persister.deleteKey(Constants.PERSISTENCE_CORPSE_IDS_KEY);
            persister.deleteKey(Constants.PERSISTENCE_UPDATING_CORPSE_IDS_KEY);
        }

		/**
			Function: findClosestActor

			In the `actors` array, find the closest actor (except the player) from position `pos` within `range`.
			If range is 0, no range limitation.
		*/
        findClosestActor(pos: Core.Position, range: number, actorIds: ActorId[]): Actor {
            let bestDistance: number = 1E8;
            let closestActor: Actor;
            let nbActors: number = actorIds.length;
            for (let i: number = 0; i < nbActors; i++) {
                let actorId: ActorId = actorIds[i];
                if (actorId !== this.playerId) {
                    let actor: Actor = this.actors[actorId];
                    let distance: number = Core.Position.distance(pos, actor);
                    if (distance < bestDistance && (distance < range || range === 0)) {
                        bestDistance = distance;
                        closestActor = actor;
                    }
                }
            }
            return closestActor;
        }

		/**
			Function: findActorsOnCell

			Parameters:
			pos - a position on the map
			actors - the list of actors to scan (either actors, corpses or items)

			Returns:
			an array containing all the living actors on the cell

		*/
        findActorsOnCell(pos: Core.Position, actorIds: ActorId[]): Actor[] {
            let actorsOnCell: Actor[] = [];
            let nbActors: number = actorIds.length;
            for (let i: number = 0; i < nbActors; i++) {
                let actor: Actor = this.actors[actorIds[i]];
                if (actor.x === pos.x && actor.y === pos.y) {
                    actorsOnCell.push(actor);
                }
            }
            return actorsOnCell;
        }

		/**
			Function: findActorsInRange
			Returns all actor near a position

			Parameters:
			pos - a position on the map
			range - maximum distance from position
			actors - actor array to look up

			Returns:
			an actor array containing all actor within range
		*/
        findActorsInRange(pos: Core.Position, range: number, actorIds: ActorId[]): Actor[] {
            let actorsInRange: Actor[] = [];
            let nbActors: number = actorIds.length;
            for (let i: number = 0; i < nbActors; i++) {
                let actor: Actor = this.actors[actorIds[i]];
                if (Core.Position.distance(pos, actor) <= range) {
                    actorsInRange.push(actor);
                }
            }
            return actorsInRange;
        }

		/**
			Function: findAdjacentActor
			Return the first adjacent actor having a specific feature

			Parameters:
			pos - a position on the map
            featureType - an <ActorFeatureType>
		*/
        findAdjacentActorWithFeature(pos: Core.Position, featureType: ActorFeatureType): Actor {
            let adjacentCells: Core.Position[] = pos.getAdjacentCells(Engine.instance.map.w, Engine.instance.map.h);
            let len: number = adjacentCells.length;
            // scan all 8 adjacent cells
            for (let i: number = 0; i < len; ++i) {
                if (!Engine.instance.map.isWall(adjacentCells[i].x, adjacentCells[i].y)) {
                    let items: Actor[] = this.findActorsOnCell(adjacentCells[i], this.itemIds);
                    for (let j: number = 0, jlen: number = items.length; j < jlen; ++j) {
                        if (items[j].hasFeature(featureType)) {
                            return items[j];
                        }
                    }
                }
            }
            return undefined;
        }
    }

}
