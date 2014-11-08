/*
	Section: actors
*/
module Game {
	/********************************************************************************
	 * Group: items
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
	export class TargetSelector {
		/*
			Constructor: constructor

			Parameters:
			_method - the target selection method
			_range - for methods requiring a range
		*/
		constructor(private _method: TargetSelectionMethod, private _range: number = 0) {}

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
			actorManager -
		*/
		selectTargets(owner: Actor, wearer: Actor, actorManager: ActorManager,
			applyEffects: (owner: Actor, wearer: Actor, actors: Actor[]) => void) {
			var selectedTargets: Actor[] = [];
			switch (this._method) {
				case TargetSelectionMethod.WEARER :
					selectedTargets.push(wearer);
				break;
				case TargetSelectionMethod.WEARER_CLOSEST_ENEMY :
					var actor = actorManager.findClosestActor(wearer, this.range, actorManager.getCreatures());
					if ( actor ) {
						selectedTargets.push(actor);
					}
				break;
			// TODO
			//	case TargetSelectionMethod.SELECTED_ACTOR : return selectActor(wearer, actorManager); break;
			//	case TargetSelectionMethod.WEARER_RANGE : return selectCloseEnemies(wearer, actorManager); break;
				case TargetSelectionMethod.SELECTED_RANGE :
					log("Left-click a target tile for the fireball,\nor right-click to cancel.", "red");
					var theRange = this.range;
					EventBus.getInstance().publishEvent(new Event<TilePickerListener>(EventType.PICK_TILE,
						function(pos: Yendor.Position) {
							var actors: Actor[] = actorManager.findActorsInRange( pos, theRange, actorManager.getCreatures() );
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

	/*
		Interface: Effect
		Some effect that can be applied to actors. The effect might be triggered by using an item or casting a spell.
	*/
	export interface Effect {
		/*
			Function: applyTo
			Apply an effect to an actor

			Returns:
			false if effect cannot be applied
		*/
		applyTo(actor: Actor): boolean;
	}

	export class InstantHealthEffect implements Effect {
		constructor( private _amount: number, private _message?: string) {}

		applyTo(actor: Actor): boolean {
			if (! actor.destructible ) {
				return false;
			}
			if ( this._amount > 0 ) {
				// healing effect
				var healPointsCount: number = actor.destructible.heal( this._amount );
				if ( healPointsCount > 0 && this._message ) {
					// TODO message formatting utility
					log(this._message);
				}
				return true;
			} else {
				// wounding effect
				if ( this._message && actor.destructible.defense < -this._amount ) {
					log(this._message);
				}
				if ( actor.destructible.takeDamage(actor, -this._amount) ) {
					return true;
				}
			}
			return false;
		}
	}

	/*
		Class: Pickable
		An actor that can be picked by a creature
	*/
	export class Pickable {
		constructor( private _effect: Effect, private _targetSelector?: TargetSelector) {}
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
				EventBus.getInstance().publishEvent(new Event<Actor>(EventType.REMOVE_ACTOR, owner));
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
			weare - the container

			Returns:
			true if the action succeeded
		*/
		use(owner: Actor, wearer: Actor, actorManager: ActorManager) {
			if ( this._targetSelector ) {
				this._targetSelector.selectTargets(owner, wearer, actorManager, this.applyEffectToActorList.bind(this));
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

		/*
			Some factory helpers
		*/
		static createHealthPotion(x: number, y: number, amount: number): Actor {
			var healthPotion = new Actor(x, y, "!", "health potion", "purple");
			healthPotion.pickable = new Pickable(new InstantHealthEffect(amount, "You drink the health potion"),
				new TargetSelector( TargetSelectionMethod.WEARER ));
			healthPotion.blocks = false;
			return healthPotion;
		}

		static createLightningBoltScroll(x: number, y: number, range: number, damages: number): Actor {
			var lightningBolt = new Actor(x, y, "#", "scroll of lightning bolt", "rgb(255,255,63)");
			lightningBolt.pickable = new Pickable( new InstantHealthEffect(-damages, "A lightning bolt hits with a loud thunder!"),
				new TargetSelector( TargetSelectionMethod.WEARER_CLOSEST_ENEMY, range));
			lightningBolt.blocks = false;
			return lightningBolt;
		}

		static createFireballScroll(x: number, y: number, range: number, damages: number): Actor {
			var fireball = new Actor(x, y, "#", "scroll of fireball", "rgb(255,255,63)");
			fireball.pickable = new Pickable( new InstantHealthEffect(-damages, "A fireball burns all nearby creatures!"),
				new TargetSelector( TargetSelectionMethod.SELECTED_RANGE, range));
			fireball.blocks = false;
			return fireball;
		}
	}
}
