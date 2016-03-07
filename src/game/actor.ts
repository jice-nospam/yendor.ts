/*
	Section: actors
*/
module Game {
	"use strict";
	/********************************************************************************
	 * Group: actor manager Umbra node
	 ********************************************************************************/
	/*
		Type: ActorId
		The CRC32 hashed value of the actor's readable id.
	*/
	export type ActorId = number;

	export interface ActorProcessor {
		(actor: Actor): void;
	}

	export interface ActorFilter {
		(actor: Actor): boolean;
	}

	/*
		Class: ActorManager
		Stores all the actors in the game.
	*/
	export class ActorManager extends Umbra.Node implements Umbra.EventListener {
		private playerId: ActorId;
		private stairsUpId: ActorId;
		private stairsDownId: ActorId;
		private creatureIds: ActorId[];
		private corpseIds: ActorId[];
		private updatingCorpseIds: ActorId[];
		private itemIds: ActorId[];
		private scheduler: Yendor.Scheduler = new Yendor.Scheduler();
		private actors: {[index: number]: Actor} = {};
        public enableEvents: boolean = true;

        constructor() {
            super();
            Umbra.EventManager.registerEventListener(this, EventType[EventType.LOAD_GAME]);
            Umbra.EventManager.registerEventListener(this, EventType[EventType.SAVE_GAME]);
            Umbra.EventManager.registerEventListener(this, EventType[EventType.DELETE_SAVEGAME]);
            Umbra.EventManager.registerEventListener(this, EventType[EventType.GAIN_XP]);
            Umbra.EventManager.registerEventListener(this, Gizmo.EventType[Gizmo.EventType.MODAL_SHOW]);
            Umbra.EventManager.registerEventListener(this, Gizmo.EventType[Gizmo.EventType.MODAL_HIDE]);            
        }

        onGainXp(amount: number) {
            this.getPlayer().addXp(amount);
        }
        
        onModalShow(w: Gizmo.Widget) {
            this.pause();
        }

        onModalHide(w: Gizmo.Widget) {
            this.resume();
        }   
        
		getPlayer() : Player {
			return <Player>this.actors[this.playerId];
		}

		getActor(id: ActorId) {
			return this.actors[id];
		}

		map(actorProcessor: ActorProcessor) {
			for (var index in this.actors) {
				if ( this.actors.hasOwnProperty(index) ) {
					actorProcessor(this.actors[index]);
				}
			}
		}

		filter(actorFilter: ActorFilter): Actor[] {
			var selectedActors: Actor[] = [];
			for (var index in this.actors) {
				if ( this.actors.hasOwnProperty(index) && actorFilter(this.actors[index])) {
					selectedActors.push(this.actors[index]);
				}
			}
			return selectedActors;
		}

		registerActor(actor: Actor) {
			if ( Yendor.urlParams[Constants.URL_PARAM_DEBUG] ) {
				console.log("new actor " + actor.readableId + "[" + actor.id.toString(16) + "]");
			}
			this.actors[actor.id] = actor;
		}

		addCreature( actor: Actor ) {
			this.creatureIds.push(actor.id);
			this.scheduler.add(actor);
			// possibly set the map transparency
			actor.moveTo(actor.x, actor.y);
		}

		addItem( actor: Actor ) {
			this.itemIds.push(actor.id);
			// possibly set the map transparency
			actor.moveTo(actor.x, actor.y);
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
			delete this.actors[actorId];
			var idList: ActorId[] = this.creatureIds;
			var index: number = idList.indexOf(actorId);
			if ( index !== -1 ) {
				idList.splice(index, 1);
			}
			idList = this.itemIds;
			index = idList.indexOf(actorId);
			if ( index !== -1 ) {
				idList.splice(index, 1);
			}
			idList = this.corpseIds;
			index = idList.indexOf(actorId);
			if ( index !== -1 ) {
				idList.splice(index, 1);
			}
			idList = this.updatingCorpseIds;
			index = idList.indexOf(actorId);
			if ( index !== -1 ) {
				idList.splice(index, 1);
			}
		}

		clear() {
			// remove all actors but the player
			if (this.creatureIds) {
				this.creatureIds.forEach((actorId: ActorId) => {
					if ( actorId !== this.playerId ) {
						delete this.actors[actorId];
					}
				});
				this.itemIds.forEach((actorId: ActorId) => { delete this.actors[actorId]; });
				this.corpseIds.forEach((actorId: ActorId) => { delete this.actors[actorId]; });
				this.updatingCorpseIds.forEach((actorId: ActorId) => { delete this.actors[actorId]; });
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
			var player: Player = this.getPlayer();
			if (player === undefined) {
				return;
			}
			for (var i: number = 0, len: number = player.container.size(); i < len; ++i) {
				var key: Actor = player.container.get(i);
				if ( key.isA("key") ) {
					player.container.remove(key, player);
					i--;
					len--;
					delete this.actors[key.id];
				}
			}
		}

        /*
            Function: reset
            Reset the actors for a new level/game
        */
        reset(newGame: boolean) {
            this.clear();
            this.createStairs();
            if ( newGame ) {
                this.createPlayer();
            } else {
                // don't recreate the player in case of new level
                this.addCreature(this.getPlayer());
            }            
        }

		private renderActorList(actorIds: ActorId[], root: Yendor.Console) {
			var nbActors: number = actorIds.length;
			for (var i: number = 0; i < nbActors; i++) {
				var actor: Actor = this.actors[actorIds[i]];
				if ( Engine.instance.map.shouldRenderActor(actor) ) {
					actor.render(root);
				}
			}
		}

		onRender(root: Yendor.Console) {
			this.renderActorList(this.corpseIds, root);
			this.renderActorList(this.itemIds, root);
			this.renderActorList(this.creatureIds, root);
		}

		isPlayerDead(): boolean {
			return this.getPlayer().destructible.isDead();
		}

		/*
			Function: onUpdate
			Triggers actors' A.I. during a new game turn.
			Moves the dead actors from the actor list to the corpse list.
		*/
		onUpdate(time: number) {
            if (Gizmo.Widget.getActiveModal() === undefined && getLastPlayerAction() !== undefined ) {
                this.resume();
            }
            if (this.isPaused()) {
                return;
            }
			var player: Actor = this.getPlayer();
			var oldPlayerX: number = player.x;
			var oldPlayerY: number = player.y;
			this.scheduler.run();
			this.moveDeadToCorpse();
			this.updateCorpses();
			if ( player.x !== oldPlayerX || player.y !== oldPlayerY) {
				// the player moved. Recompute the field of view
				Engine.instance.map.computeFov(player.x, player.y, Constants.FOV_RADIUS);
			}
		}

		private moveDeadToCorpse() {
			for ( var i: number = 0, len: number = this.creatureIds.length; i < len; ++i) {
				var actor: Actor = this.actors[this.creatureIds[i]];
				if ( actor.destructible && actor.destructible.isDead() ) {
					// actor is dead. move it to corpse list
					// note that corpses must still be updated until they have no active conditions
					// for example, to make it possible for corpses to unfreeze.
					if (! actor.ai.hasActiveConditions()) {
						this.scheduler.remove(actor);
					} else {
						this.updatingCorpseIds.push(actor.id);
					}
					this.creatureIds.splice( i, 1);
					i--;
					len--;
					this.corpseIds.push(actor.id);
				}
			}
		}

		private updateCorpses() {
			for ( var i: number = 0, len: number = this.updatingCorpseIds.length; i < len; ++i) {
				var actor: Actor = this.actors[this.updatingCorpseIds[i]];
				if ( ! actor.ai.hasActiveConditions()) {
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
			if (! this.isPaused()) {
				Engine.instance.saveGame();
			}
			this.scheduler.pause();
		}

		isPaused() {
			return this.scheduler.isPaused();
		}

		removeItem(itemId: ActorId) {
			var idx: number = this.itemIds.indexOf(itemId);
			if ( idx !== -1 ) {
				this.itemIds.splice(idx, 1);
			}
		}

		/*
			Function: createStairs
			Create the actors for up and down stairs. The position is not important, actors will be placed by the dungeon builder.
		*/
		createStairs() {
			this.stairsUpId = ActorFactory.create(ActorType.STAIR_UP).id;
			this.stairsDownId = ActorFactory.create(ActorType.STAIR_DOWN).id;
			this.itemIds.push(this.stairsUpId);
			this.itemIds.push(this.stairsDownId);
		}

		createPlayer() {
			var player: Actor = ActorFactory.create(ActorType.PLAYER);
			this.playerId = player.id;
			this.addCreature(player);
		}

		onLoadGame() {
            var persister: Persister = Engine.instance.persister;
			this.actors = persister.loadFromKey(Constants.PERSISTENCE_ACTORS_KEY);
			this.creatureIds = persister.loadFromKey(Constants.PERSISTENCE_CREATURE_IDS_KEY);
			for ( var i: number = 0, len: number = this.creatureIds.length; i < len; ++i ) {
				this.scheduler.add(this.actors[this.creatureIds[i]]);
			}
			this.playerId = this.creatureIds[0];
			this.itemIds = persister.loadFromKey(Constants.PERSISTENCE_ITEM_IDS_KEY);
			this.stairsUpId = this.itemIds[0];
			this.stairsDownId = this.itemIds[1];
			this.corpseIds = persister.loadFromKey(Constants.PERSISTENCE_CORPSE_IDS_KEY);
			this.updatingCorpseIds = persister.loadFromKey(Constants.PERSISTENCE_UPDATING_CORPSE_IDS_KEY);
		}

		onSaveGame() {
            var persister: Persister = Engine.instance.persister;
			persister.saveToKey(Constants.PERSISTENCE_ACTORS_KEY, this.actors);
			persister.saveToKey(Constants.PERSISTENCE_CREATURE_IDS_KEY, this.creatureIds);
			persister.saveToKey(Constants.PERSISTENCE_ITEM_IDS_KEY, this.itemIds);
			persister.saveToKey(Constants.PERSISTENCE_CORPSE_IDS_KEY, this.corpseIds);
			persister.saveToKey(Constants.PERSISTENCE_UPDATING_CORPSE_IDS_KEY, this.updatingCorpseIds);
		}

		onDeleteSavegame() {
            var persister: Persister = Engine.instance.persister;
			persister.deleteKey(Constants.PERSISTENCE_ACTORS_KEY);
			persister.deleteKey(Constants.PERSISTENCE_CREATURE_IDS_KEY);
			persister.deleteKey(Constants.PERSISTENCE_ITEM_IDS_KEY);
			persister.deleteKey(Constants.PERSISTENCE_CORPSE_IDS_KEY);
			persister.deleteKey(Constants.PERSISTENCE_UPDATING_CORPSE_IDS_KEY);
		}
        
		/*
			Function: findClosestActor

			In the `actors` array, find the closest actor (except the player) from position `pos` within `range`.
			If range is 0, no range limitation.
		*/
		findClosestActor( pos: Core.Position, range: number, actorIds: ActorId[] ) : Actor {
			var bestDistance: number = 1E8;
			var closestActor: Actor;
			var nbActors: number = actorIds.length;
			for (var i: number = 0; i < nbActors; i++) {
				var actorId: ActorId = actorIds[i];
				if ( actorId !== this.playerId ) {
					var actor: Actor = this.actors[actorId];
					var distance: number = Core.Position.distance(pos, actor);
					if ( distance < bestDistance && (distance < range || range === 0) ) {
						bestDistance = distance;
						closestActor = actor;
					}
				}
			}
			return closestActor;
		}

		/*
			Function: findActorsOnCell

			Parameters:
			pos - a position on the map
			actors - the list of actors to scan (either actors, corpses or items)

			Returns:
			an array containing all the living actors on the cell

		*/
		findActorsOnCell( pos: Core.Position, actorIds: ActorId[]) : Actor[] {
			var actorsOnCell: Actor[] = [];
			var nbActors: number = actorIds.length;
			for (var i: number = 0; i < nbActors; i++) {
				var actor: Actor = this.actors[actorIds[i]];
				if ( actor.x === pos.x && actor.y === pos.y ) {
					actorsOnCell.push(actor);
				}
			}
			return actorsOnCell;
		}

		/*
			Function: findActorsInRange
			Returns all actor near a position

			Parameters:
			pos - a position on the map
			range - maximum distance from position
			actors - actor array to look up

			Returns:
			an actor array containing all actor within range
		*/
		findActorsInRange( pos: Core.Position, range: number, actorIds: ActorId[]): Actor[] {
			var actorsInRange: Actor[] = [];
			var nbActors: number = actorIds.length;
			for (var i: number = 0; i < nbActors; i++) {
				var actor: Actor = this.actors[actorIds[i]];
				if (Core.Position.distance(pos, actor) <= range ) {
					actorsInRange.push( actor );
				}
			}
			return actorsInRange;
		}

		/*
			Function: findAdjacentLever
			Return the first adjacent item having the lever feature

			Parameters:
			pos - a position on the map
		*/
		findAdjacentLever( pos: Core.Position ): Actor {
			var adjacentCells: Core.Position[] = pos.getAdjacentCells(Engine.instance.map.width, Engine.instance.map.height);
			var len: number = adjacentCells.length;
			// scan all 8 adjacent cells
			for ( var i: number = 0; i < len; ++i) {
				if ( !Engine.instance.map.isWall(adjacentCells[i].x, adjacentCells[i].y)) {
					var items: Actor[] = this.findActorsOnCell(adjacentCells[i], this.itemIds);
					for ( var j: number = 0, jlen: number = items.length; j < jlen; ++j) {
						if ( items[j].lever ) {
							return items[j];
						}
					}
				}
			}
			return undefined;
		}
	}

	/********************************************************************************
	 * Group: actors
	 ********************************************************************************/

	export enum ActorFeatureType {
		// can be destroyed/killed
		DESTRUCTIBLE,
		// can deal damages
		ATTACKER,
		// updates itself
		AI,
		// can be picked (put inside a container actor)
		PICKABLE,
		// can contain other actors
		CONTAINER,
		// can be equipped on a slot
		EQUIPMENT,
		// can throw away some type of actors
		RANGED,
		// has magic properties
		MAGIC,
		// can be open/closed. Can be combined with a lockable
		DOOR,
		// can be triggered by pressing E when standing on an adjacent cell
		LEVER,
		// can be locked/unlocked
		LOCKABLE,
	}

	export interface ActorFeature extends Persistent {
	}

	 /*
	 	Class: Actor
	 	The base class for all actors.
	 	Actor shouldn't hold references to other Actors, else there might be cyclic dependencies which
	 	keep the json serializer from working. Instead, hold ActorId and use ActorManager.getActor()
	 */
	export class Actor extends Core.Position implements Persistent, Yendor.TimedEntity {
        // persister classname
		className: string;
        private classes: string[] = [];
		private _id: ActorId;
		private _readableId: string;
		// the ascii code of the symbol representing this actor on the map
		private _ch: number;
		// the name to be used by mouse look or the inventory screen
		name: string;
		// the color associated with this actor's symbol
		col: Core.Color;

		private features: { [index: number]: ActorFeature} = {};

		// whether you can walk on the tile where this actor is
		blocks: boolean = false;
		// whether light goes through this actor
		transparent: boolean = true;
		// whether you can see this actor only if it's in your field of view
		fovOnly: boolean = true;
		// whether this actor name is singular (you can write "a <name>")
		private _singular: boolean = true;

		get id() { return this._id; }
		get readableId() { return this._readableId; }

		constructor(readableId?: string) {
			super();
			this.className = "Actor";
			if (readableId) {
				// readableId is undefined when loading a game
				this._readableId = readableId;
				this._id = Core.crc32(readableId);
				Engine.instance.actorManager.registerActor(this);
			}
		}

		init(_x: number = 0, _y: number = 0, _ch: string = "", _name: string = "", col: Core.Color = "", 
            types: ActorClass[] = undefined, singular: boolean = true) {
			this.moveTo(_x, _y);
			this._ch = _ch.charCodeAt(0);
			this.name = _name;
			this.col = col;
			this._singular = singular;
			if ( types ) {
                this.classes.concat(types);
            }
		}

		moveTo(x: number, y: number) {
			if (! this.transparent) {
				Engine.instance.map.setTransparent(this.x, this.y, true);
				super.moveTo(x, y);
				Engine.instance.map.setTransparent(this.x, this.y, false);
			} else {
				super.moveTo(x, y);
			}
		}

		get waitTime() { return this.ai ? this.ai.waitTime : undefined ; }
		set waitTime(newValue: number) {
			if (this.ai) {
				this.ai.waitTime = newValue;
			}
		}

		isA(type: ActorClass): boolean {
			return this.classes.indexOf(type) !== -1;
		}

		get ch() { return String.fromCharCode(this._ch); }
		set ch(newValue: string) { this._ch = newValue.charCodeAt(0); }

		isSingular(): boolean {
			return this._singular;
		}

		isStackable(): boolean {
			return ! this.destructible && (! this.equipment || ! this.equipment.isEquipped() || this.equipment.getSlot() === Constants.SLOT_QUIVER);
		}

		// feature getters & setters
		get destructible(): Destructible { return <Destructible>this.features[ActorFeatureType.DESTRUCTIBLE]; }
		set destructible(newValue: Destructible) { this.features[ActorFeatureType.DESTRUCTIBLE] = newValue; }

		get attacker(): Attacker { return <Attacker>this.features[ActorFeatureType.ATTACKER]; }
		set attacker(newValue: Attacker) { this.features[ActorFeatureType.ATTACKER] = newValue; }

		get ai(): Ai { return <Ai>this.features[ActorFeatureType.AI]; }
		set ai(newValue: Ai) { this.features[ActorFeatureType.AI] = newValue; }

		get pickable(): Pickable {return <Pickable>this.features[ActorFeatureType.PICKABLE]; }
		set pickable(newValue: Pickable) { this.features[ActorFeatureType.PICKABLE] = newValue; }

		get container(): Container {return <Container>this.features[ActorFeatureType.CONTAINER]; }
		set container(newValue: Container) {this.features[ActorFeatureType.CONTAINER] = newValue; }

		get equipment(): Equipment {return <Equipment>this.features[ActorFeatureType.EQUIPMENT]; }
		set equipment(newValue: Equipment) {this.features[ActorFeatureType.EQUIPMENT] = newValue; }

		get ranged(): Ranged { return <Ranged>this.features[ActorFeatureType.RANGED]; }
		set ranged(newValue: Ranged) { this.features[ActorFeatureType.RANGED] = newValue; }

		get magic(): Magic { return <Magic>this.features[ActorFeatureType.MAGIC]; }
		set magic(newValue: Magic) { this.features[ActorFeatureType.MAGIC] = newValue; }

		get door(): Door { return <Door>this.features[ActorFeatureType.DOOR]; }
		set door(newValue: Door) { this.features[ActorFeatureType.DOOR] = newValue; }

		get lock(): Lockable { return <Lockable>this.features[ActorFeatureType.LOCKABLE]; }
		set lock(newValue: Lockable) { this.features[ActorFeatureType.LOCKABLE] = newValue; }

		get lever(): Lever { return <Lever>this.features[ActorFeatureType.LEVER]; }
		set lever(newValue: Lever) { this.features[ActorFeatureType.LEVER] = newValue; }

		/*
			Function: getaname
			Returns " a <name>" or " an <name>" or " <name>"
		*/
		getaname(): string {
			if ( !this.isSingular() ) {
				return " " + this.name;
			}
			var article: string = ("aeiou".indexOf(this.name[0]) !== -1 ? " an " : " a ");
			return article + this.name;
		}

		/*
			Function: getAname
			Returns "A <name>" or "An <name>" or "<name>"
		*/
		getAname(): string {
			if ( !this.isSingular() ) {
				return this.name;
			}
			var article: string = ("aeiou".indexOf(this.name[0]) !== -1 ? "An " : "A ");
			return article + this.name;
		}

		/*
			Function: getTheresaname
			Returns "There's a <name>" or "There's an <name>" or "There are <name>"
		*/
		getTheresaname(): string {
			var verb = this.isSingular() ? "'s" : " are";
			return "There" + verb + this.getaname();
		}

		/*
			Function: getthename
			Returns " the <name>"
		*/
		getthename(): string {
			return " the " + this.name;
		}

		/*
			Function: getThename
			Returns "The <name>"
		*/
		getThename(): string {
			return "The " + this.name;
		}

		/*
			Function: getThenames
			Returns "The <name>'s "
		*/
		getThenames(): string {
			return this.getThename() + "'s ";
		}

		/*
			Function: getthenames
			Returns " the <name>'s "
		*/
		getthenames(): string {
			return this.getthename() + "'s ";
		}

		getits(): string {
			return " its ";
		}

		getit(): string {
			return " it";
		}

		getis(): string {
			return this.isSingular() ? " is" : " are";
		}

		getVerbEnd(): string {
			return this.isSingular() ? "s" : "";
		}

		getDescription(): string {
			var desc = this.name;
			if ( this.magic ) {
				if ( this.magic.charges > 0 ) {
					desc += ", " + this.magic.charges + " charges";
				} else {
					desc += ", uncharged";
				}
			}
			if ( this.equipment && this.equipment.isEquipped()) {
				desc += ", on " + this.equipment.getSlot();
			}
			if ( this.ai ) {
				var condDesc: string = this.ai.getConditionDescription();
				if ( condDesc ) {
					desc += ", " + condDesc;
				}
			}
			return desc;
		}

		update() {
			if ( this.ai ) {
				this.ai.update(this);
			}
		}

		render(root: Yendor.Console) {
			root.text[this.x][this.y] = this._ch;
			root.fore[this.x][this.y] = this.col;
		}

		/*
			Function: postLoad
			json.stringify cannot handle cyclic dependencies so we have to rebuild them here
		*/
		postLoad() {
			// rebuild container -> listener backlinks
			if ( this.ai && this.container ) {
				this.container.setListener(this.ai);
			}
		}

	}
}
