/*
	Section: items
*/
module Game {
	"use strict";

	/********************************************************************************
	 * Group: target selection
	 ********************************************************************************/
	/*
		Enum: TargetSelectionMethod
		Define how we select the actors that are impacted by an effect.
		The wearer is the actor triggering the effect (by using an item or casting a spell)

		WEARER - the actor using the item or casting the spell
		WEARER_CLOSEST_ENEMY - the closest enemy 
		SELECTED_ACTOR - an actor manually selected
		WEARER_RANGE - all actors close to the wearer
		SELECTED_RANGE - all actors close to a manually selected position
	*/
	export enum TargetSelectionMethod {
		WEARER,
		WEARER_CLOSEST_ENEMY,
		SELECTED_ACTOR,
		WEARER_RANGE,
		SELECTED_RANGE
	}

	/*
		Class: TargetSelector
		Various ways to select actors
	*/
	export class TargetSelector implements Persistent {
		className: string;
		private _method: TargetSelectionMethod;
		private _range: number;
		/*
			Constructor: constructor

			Parameters:
			_method - the target selection method
			_range - for methods requiring a range
		*/
		constructor(_method: TargetSelectionMethod = undefined, _range: number = 0) {
			this.className = "TargetSelector";
			this._method = _method;
			this._range = _range;
		}

		/*
			Property: method
			The target selection method (read-only)
		*/
		get method() { return this._method; }

		/*
			Property: range
			The selection range (read-only)
		*/
		get range() { return this._range; }

		/*
			Function: selectTargets
			Return all the actors matching the selection criteria

			Parameters:
			owner - the actor owning the effect (the magic item or the scroll)
			wearer - the actor using the item
		*/
		selectTargets(owner: Actor, wearer: Actor, applyEffects: (owner: Actor, wearer: Actor, actors: Actor[]) => void) {
			var selectedTargets: Actor[] = [];
			var creatures: Actor[] = ActorManager.instance.getCreatures();
			switch (this._method) {
				case TargetSelectionMethod.WEARER :
					selectedTargets.push(wearer);
				break;
				case TargetSelectionMethod.WEARER_CLOSEST_ENEMY :
					var actor = ActorManager.instance.findClosestActor(wearer, this.range, creatures);
					if ( actor ) {
						selectedTargets.push(actor);
					}
				break;
				case TargetSelectionMethod.SELECTED_ACTOR :
					log("Left-click a target creature,\nor right-click to cancel.", "red");
					EventBus.instance.publishEvent(new Event<TilePickerListener>(EventType.PICK_TILE,
						function(pos: Yendor.Position) {
							var actors: Actor[] = ActorManager.instance.findActorsOnCell( pos, creatures);
							if (actors.length > 0) {
								applyEffects(owner, wearer, actors);
							}
						}
					));
				break;
			// TODO
			// case TargetSelectionMethod.WEARER_RANGE : return selectCloseEnemies(wearer, actorManager); break;
				case TargetSelectionMethod.SELECTED_RANGE :
					log("Left-click a target tile,\nor right-click to cancel.", "red");
					var theRange = this.range;
					EventBus.instance.publishEvent(new Event<TilePickerListener>(EventType.PICK_TILE,
						function(pos: Yendor.Position) {
							var actors: Actor[] = ActorManager.instance.findActorsInRange( pos, theRange, creatures );
							if (actors.length > 0) {
								applyEffects(owner, wearer, actors);
							}
						}
					));
				break;
			}
			if (selectedTargets.length > 0) {
				applyEffects(owner, wearer, selectedTargets);
			}
		}
	}

	/********************************************************************************
	 * Group: effects
	 ********************************************************************************/

	/*
		Interface: Effect
		Some effect that can be applied to actors. The effect might be triggered by using an item or casting a spell.
	*/
	export interface Effect extends Persistent {
		/*
			Function: applyTo
			Apply an effect to an actor

			Returns:
			false if effect cannot be applied
		*/
		applyTo(actor: Actor): boolean;
	}

	export class InstantHealthEffect implements Effect {
		className: string;
		private _amount: number;
		private _message: string;
		constructor( _amount: number = 0, _message?: string) {
			this.className = "InstantHealthEffect";
			this._amount = _amount;
			this._message = _message;
		}

		applyTo(actor: Actor): boolean {
			if (! actor.destructible ) {
				return false;
			}
			if ( this._amount > 0 ) {
				return this.applyHealingEffectTo(actor);
			} else {
				return this.applyWoundingEffectTo(actor);
			}
			return false;
		}

		private applyHealingEffectTo(actor: Actor): boolean {
			var healPointsCount: number = actor.destructible.heal( this._amount );
			if ( healPointsCount > 0 && this._message ) {
				// TODO message formatting utility
				log(this._message);
			}
			return true;
		}

		private applyWoundingEffectTo(actor: Actor) : boolean {
			if ( this._message && actor.destructible.defense < -this._amount ) {
				log(this._message);
			}
			return actor.destructible.takeDamage(actor, -this._amount) > 0;
		}
	}

	export class AiChangeEffect implements Effect {
		className: string;
		private _newAi: TemporaryAi;
		private _message: string;
		constructor( _newAi: TemporaryAi = undefined, _message?: string ) {
			this.className = "AiChangeEffect";
			this._newAi = _newAi;
			this._message = _message;
		}

		applyTo(actor: Actor): boolean {
			this._newAi.applyTo(actor);
			if ( this._message ) {
				log(this._message);
			}
			return true;
		}
	}

	/********************************************************************************
	 * Group: items
	 ********************************************************************************/

	/*
		Class: Pickable
		An actor that can be picked by a creature
	*/
	export class Pickable implements Persistent {
		className: string;
		private _effect: Effect;
		private _targetSelector: TargetSelector

		constructor( _effect?: Effect, _targetSelector?: TargetSelector) {
			this.className = "Pickable";
			this._effect = _effect;
			this._targetSelector = _targetSelector;
		}

		/*
			Function: pick
			Put this actor in a container actor

			Parameters:
			owner - the actor owning this Pickable (the item)
			wearer - the container

			Returns:
			true if the operation succeeded
		*/
		pick(owner: Actor, wearer: Actor): boolean {
			if ( wearer.container && wearer.container.add(owner)) {
				// tells the engine to remove this actor from main list
				EventBus.instance.publishEvent(new Event<Actor>(EventType.REMOVE_ACTOR, owner));
				return true;
			}
			// wearer is not a container or is full
			return false;
		}

		/*
			Function: use
			Consume this item, destroying it

			Parameters:
			owner - the actor owning this Pickable (the item)
			wearer - the container (the creature using the item)
		*/
		use(owner: Actor, wearer: Actor) {
			if ( this._targetSelector ) {
				this._targetSelector.selectTargets(owner, wearer, this.applyEffectToActorList.bind(this));
				if ( this._targetSelector.method !== TargetSelectionMethod.SELECTED_RANGE
					&& this._targetSelector.method !== TargetSelectionMethod.SELECTED_ACTOR ) {
					EventBus.instance.publishEvent(new Event<GameStatus>(EventType.CHANGE_STATUS, GameStatus.NEW_TURN));
				}
			}
			if ( owner.equipment ) {
				owner.equipment.use(owner, wearer);
			}
		}

		private applyEffectToActorList(owner: Actor, wearer: Actor, actors: Actor[]) {
			var success: boolean = false;

			for (var i = 0; i < actors.length; ++i) {
				if (this._effect.applyTo(actors[i])) {
					success = true;
				}
			}
			if ( success && wearer.container ) {
				wearer.container.remove( owner );
			}
		}
	}

	/*
		Class: Equipment
		An item that can be equiped
	*/
	export class Equipment implements Persistent {
		className: string;
		private slot: string;
		private equipped: boolean = false;

		constructor(slot: string) {
			this.className = "Equipment";
			this.slot = slot;
		}

		isEquipped(): boolean { return this.equipped; }

		getSlot() { return this.slot; }

		/*
			Function: use
			Use (equip or unequip) this item.
			Parameters:
			owner: the actor owning this Equipment (the item)
			wearer: the container (the creature using this item)
		*/
		use(owner: Actor, wearer: Actor) {
			if ( this.equipped ) {
				this.unequip(owner, wearer);
			} else {
				this.equip(owner, wearer);
			}
		}

		equip(owner: Actor, wearer: Actor) {
			this.equipped = true;
			if ( wearer === ActorManager.instance.getPlayer()) {
				log("Equipped " + owner.name + " on " + this.slot, "green" );
			}
		}

		unequip(owner: Actor, wearer: Actor) {
			this.equipped = false;
			if ( wearer === ActorManager.instance.getPlayer()) {
				log("Unequipped " + owner.name + " from " + this.slot, "yellow" );
			}
		}
	}
}
