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

		ACTOR_ON_CELL - whatever actor is on the selected cell
		CLOSEST_ENEMY - the closest non player creature
		SELECTED_ACTOR - an actor manually selected
		ACTORS_RANGE - all actors close to the cell
		SELECTED_RANGE - all actors close to a manually selected position
	*/
	export const enum TargetSelectionMethod {
		ACTOR_ON_CELL,
		CLOSEST_ENEMY,
		SELECTED_ACTOR,
		ACTORS_IN_RANGE,
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
		selectedTargets: Actor[];
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
			Populates the selectedTargets field, or triggers the tile picker

			Parameters:
			owner - the actor owning the effect (the magic item or the scroll)
			wearer - the actor using the item
			cellPos - the cell where the effect applies (= the wearer position when used from inventory, or a different position when thrown)

			Returns:
			true if targets have been selected (else wait for TILE_SELECTED event, then call <onTileSelected>)
		*/
		selectTargets(owner: Actor, wearer: Actor, cellPos: Yendor.Position): boolean {
			this.selectedTargets = [];
			var creatures: Actor[] = Engine.instance.actorManager.getCreatures();
			switch (this._method) {
				case TargetSelectionMethod.ACTOR_ON_CELL :
					if ( cellPos ) {
						this.selectedTargets = Engine.instance.actorManager.findActorsOnCell(cellPos, creatures);
					} else {
						this.selectedTargets.push(wearer);
					}
					return true;
				case TargetSelectionMethod.CLOSEST_ENEMY :
					var actor = Engine.instance.actorManager.findClosestActor(cellPos ? cellPos : wearer, this.range, creatures);
					if ( actor ) {
						this.selectedTargets.push(actor);
					}
					return true;
				case TargetSelectionMethod.ACTORS_IN_RANGE :
					this.selectedTargets = Engine.instance.actorManager.findActorsInRange( cellPos ? cellPos : wearer, this.range, creatures );
					return true;
				case TargetSelectionMethod.SELECTED_ACTOR :
					log("Left-click a target creature,\nor right-click to cancel.", Constants.LOG_WARN_COLOR);
					Engine.instance.eventBus.publishEvent(EventType.PICK_TILE);
					return false;
				case TargetSelectionMethod.SELECTED_RANGE :
					log("Left-click a target tile,\nor right-click to cancel.", Constants.LOG_WARN_COLOR);
					Engine.instance.eventBus.publishEvent(EventType.PICK_TILE);
					return false;
			}
		}

		/*
			Function: onTileSelected
			Populates the selectedTargets field for selection methods that require a tile selection
		*/
		onTileSelected(pos: Yendor.Position) {
			var creatures: Actor[] = Engine.instance.actorManager.getCreatures();
			switch (this._method) {
				case TargetSelectionMethod.SELECTED_ACTOR :
					this.selectedTargets = Engine.instance.actorManager.findActorsOnCell( pos, creatures);
				break;
				case TargetSelectionMethod.SELECTED_RANGE :
					this.selectedTargets = Engine.instance.actorManager.findActorsInRange( pos, this._range, creatures );
				break;
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

			Parameters:
			actor - the actor this effect is applied to
			coef - a multiplicator to apply to the effect

			Returns:
			false if effect cannot be applied
		*/
		applyTo(actor: Actor, coef: number): boolean;
	}

	/*
		Class: InstantHealthEffect
		Add or remove health points.
	*/
	export class InstantHealthEffect implements Effect {
		className: string;
		private _amount: number;
		private successMessage: string;
		private failureMessage: string;

		get amount() { return this._amount; }

		constructor( amount: number = 0, successMessage?: string, failureMessage?: string) {
			this.className = "InstantHealthEffect";
			this._amount = amount;
			this.successMessage = successMessage;
			this.failureMessage = failureMessage;
		}

		applyTo(actor: Actor, coef: number = 1.0): boolean {
			if (! actor.destructible ) {
				return false;
			}
			if ( this._amount > 0 ) {
				return this.applyHealingEffectTo(actor, coef);
			} else {
				return this.applyWoundingEffectTo(actor, coef);
			}
			return false;
		}

		private applyHealingEffectTo(actor: Actor, coef: number = 1.0): boolean {
			var healPointsCount: number = actor.destructible.heal( coef * this._amount );
			if ( healPointsCount > 0 && this.successMessage ) {
				log(transformMessage(this.successMessage, actor, undefined, healPointsCount));
			} else if ( healPointsCount <= 0 && this.failureMessage ) {
				log(transformMessage(this.failureMessage, actor));
			}
			return true;
		}

		private applyWoundingEffectTo(actor: Actor, coef: number = 1.0) : boolean {
			var realDefense: number = actor.destructible.computeRealDefense(actor);
			var damageDealt = -this._amount * coef - realDefense;
			if ( damageDealt > 0 && this.successMessage ) {
				log(transformMessage(this.successMessage, actor, undefined, damageDealt));
			} else if ( damageDealt <= 0 && this.failureMessage ) {
				log(transformMessage(this.failureMessage, actor));
			}
			return actor.destructible.takeDamage(actor, -this._amount * coef) > 0;
		}
	}

	/*
		Class: ConditionEffect
		Add a condition to an actor.
	*/
	export class ConditionEffect implements Effect {
		className: string;
		private type: ConditionType;
		private nbTurns: number;
		private message: string;
		private additionalArgs: any[];
		constructor( type: ConditionType, nbTurns: number, message?: string, ...additionalArgs: any[] ) {
			this.className = "ConditionEffect";
			this.type = type;
			this.nbTurns = nbTurns;
			this.message = message;
			if (additionalArgs && additionalArgs.length > 0 && additionalArgs[0] !== undefined ) {
				this.additionalArgs = additionalArgs;
			}
		}

		applyTo(actor: Actor, coef: number = 1.0): boolean {
			if (!actor.ai) {
				return false;
			}
			actor.ai.addCondition(Condition.create(this.type, Math.floor(coef * this.nbTurns), this.additionalArgs),
				actor);
			if ( this.message ) {
				log(transformMessage(this.message, actor));
			}
			return true;
		}
	}

	/*
	 	Class: Effector
	 	Combines an effect and a target selector. Can also display a message before applying the effect.
	*/
	export class Effector implements Persistent {
		className: string;
		private _effect: Effect;
		private targetSelector: TargetSelector;
		private message: string;
		private _coef: number;
		private destroyOnEffect: boolean;

		get effect() { return this._effect; }
		get coef() { return this._coef; }

		constructor(_effect?: Effect, _targetSelector?: TargetSelector, _message?: string, destroyOnEffect: boolean = false) {
			this.className = "Effector";
			this._effect = _effect;
			this.targetSelector = _targetSelector;
			this.message = _message;
			this.destroyOnEffect = destroyOnEffect;
		}

		/*
			Function: apply
			Select targets and apply the effect.

			Returns:
			false if a tile needs to be selected (in that case, wait for TILE_SELECTED event, then call <applyOnPos>)
		*/
		apply(owner: Actor, wearer: Actor, cellPos?: Yendor.Position, coef: number = 1.0): boolean {
			this._coef = coef;
			if (this.targetSelector.selectTargets(owner, wearer, cellPos)) {
				this.applyEffectToActorList(owner, wearer, this.targetSelector.selectedTargets);
				return true;
			}
			return false;
		}

		/*
			Function: applyOnPos
			Select targets and apply the effect once a tile has been selected.

			Returns:
			false if no target has been selected
		*/
		applyOnPos(owner: Actor, wearer: Actor, pos: Yendor.Position): boolean {
			this.targetSelector.onTileSelected(pos);
			if ( this.targetSelector.selectedTargets.length > 0 ) {
				this.applyEffectToActorList(owner, wearer, this.targetSelector.selectedTargets);
				return true;
			} else {
				return false;
			}
		}

		private applyEffectToActorList(owner: Actor, wearer: Actor, actors: Actor[]) {
			var success: boolean = false;
			if ( this.message ) {
				log(transformMessage(this.message, wearer));
			}

			for (var i: number = 0, len: number = actors.length; i < len; ++i) {
				if (this._effect.applyTo(actors[i], this._coef)) {
					success = true;
				}
			}
			if ( this.destroyOnEffect && success && wearer && wearer.container ) {
				wearer.container.remove( owner, wearer );
			}
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
		/*
			Property: onUseEffector
			What happens when this item is used.
		*/
		private onUseEffector: Effector;
		/*
			Property: onThrowEffector
			What happens when this item is thrown.
		*/
		private onThrowEffector: Effector;
		private _weight: number;
		private _destroyedWhenThrown: boolean;

		get weight() { return this._weight; }
		get onThrowEffect() { return this.onThrowEffector ? this.onThrowEffector.effect : undefined; }
		get destroyedWhenThrown() { return this._destroyedWhenThrown; }

		constructor(weight: number, destroyedWhenThrown: boolean = false) {
			this.className = "Pickable";
			this._weight = weight;
			this._destroyedWhenThrown = destroyedWhenThrown;
		}

		setOnUseEffect(effect?: Effect, targetSelector?: TargetSelector, message?: string, destroyOnEffect: boolean = false) {
			this.onUseEffector = new Effector(effect, targetSelector, message, destroyOnEffect);
		}

		setOnUseEffector(effector: Effector) {
			this.onUseEffector = effector;
		}

		setOnThrowEffect(effect?: Effect, targetSelector?: TargetSelector, message?: string, destroyOnEffect: boolean = false) {
			this.onThrowEffector = new Effector(effect, targetSelector, message, destroyOnEffect);
		}

		setOnThrowEffector(effector: Effector) {
			this.onThrowEffector = effector;
		}

		/*
			Function: pick
			Put this actor in a container actor

			Parameters:
			owner - the actor owning this Pickable (the item)
			wearer - the container (the creature picking the item)

			Returns:
			true if the operation succeeded
		*/
		pick(owner: Actor, wearer: Actor): boolean {
			if ( wearer.container && wearer.container.add(owner, wearer)) {
				log(transformMessage("[The actor1] pick[s] [the actor2].", wearer, owner));

				if ( owner.equipment && wearer.container.isSlotEmpty(owner.equipment.getSlot())) {
					// equippable and slot is empty : auto-equip
					owner.equipment.equip(owner, wearer);
				}

				// remove this actor from item list
				Engine.instance.actorManager.removeItem(owner);
				return true;
			}
			// wearer is not a container or is full
			return false;
		}

		/*
			Function: drop
			Drop this actor on the ground.
			
			Parameters:
			owner - the actor owning this Pickable (the item)
			wearer - the container (the creature picking the item)
			pos - coordinate if the position is not the wearer's position
		*/
		drop(owner: Actor, wearer: Actor, pos?: Yendor.Position, verb: string = "drop", fromFire: boolean = false) {
			wearer.container.remove(owner, wearer);
			owner.x = pos ? pos.x : wearer.x;
			owner.y = pos ? pos.y : wearer.y;
			Engine.instance.actorManager.addItem(owner);
			if ( owner.equipment ) {
				owner.equipment.unequip(owner, wearer, true);
			}
			if (! fromFire) {
				log(wearer.getThename() + " " + verb + wearer.getVerbEnd() + owner.getthename());
			}
			if ( verb === "drop") {
				Engine.instance.actorManager.resume();
			}
		}

		/*
			Function: use
			Use this item. If it has a onUseEffector, apply the effect and destroy the item.
			If it's an equipment, equip/unequip it.

			Parameters:
			owner - the actor owning this Pickable (the item)
			wearer - the container (the creature using the item)
		*/
		use(owner: Actor, wearer: Actor) {
			if ( this.onUseEffector ) {
				this.onUseEffector.apply(owner, wearer);
			}
			if ( owner.equipment ) {
				owner.equipment.use(owner, wearer);
				Engine.instance.actorManager.resume();
			}
		}

		useOnPos(owner: Actor, wearer: Actor, pos: Yendor.Position) {
			this.onUseEffector.applyOnPos(owner, wearer, pos);
		}

		/*
			Function: throw
			Throw this item. If it has a onUseEffector, apply the effect.

			Parameters:
			owner - the actor owning this Pickable (the item)
		*/
		throw(owner: Actor) {
			log("Left-click where to throw the " + owner.name
				+ ",\nor right-click to cancel.", Constants.LOG_WARN_COLOR);
			Engine.instance.eventBus.publishEvent(EventType.PICK_TILE);
		}

		throwOnPos(owner: Actor, wearer: Actor, fromFire: boolean, pos: Yendor.Position, coef: number = 1) {
			owner.pickable.drop(owner, wearer, pos, "throw", fromFire);
			if (owner.pickable.onThrowEffector) {
				owner.pickable.onThrowEffector.apply(owner, wearer, pos, coef);
				if (owner.pickable.destroyedWhenThrown) {
					Engine.instance.actorManager.removeItem(owner);
				}
			}
		}
	}

	/*
		Class: Equipment
		An item that can be equipped
	*/
	export class Equipment implements Persistent {
		className: string;
		private slot: string;
		private equipped: boolean = false;
		private defenseBonus: number = 0;

		constructor(slot: string, defenseBonus: number = 0) {
			this.className = "Equipment";
			this.slot = slot;
			this.defenseBonus = defenseBonus;
		}

		isEquipped(): boolean { return this.equipped; }

		getSlot(): string { return this.slot; }
		getDefenseBonus(): number { return this.defenseBonus; }

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
			var previousEquipped = wearer.container.getFromSlot(this.slot);
			if ( previousEquipped ) {
				// first unequip previously equipped item
				previousEquipped.equipment.unequip( previousEquipped, wearer );
			} else if (this.slot === Constants.SLOT_BOTH_HANDS) {
				// unequip both hands when equipping a two hand weapon
				var rightHandItem = wearer.container.getFromSlot(Constants.SLOT_RIGHT_HAND);
				if ( rightHandItem ) {
					rightHandItem.equipment.unequip( rightHandItem, wearer );
				}
				var leftHandItem = wearer.container.getFromSlot(Constants.SLOT_LEFT_HAND);
				if ( leftHandItem ) {
					leftHandItem.equipment.unequip( leftHandItem, wearer );
				}
			} else if ( this.slot === Constants.SLOT_RIGHT_HAND || this.slot === Constants.SLOT_LEFT_HAND) {
				// unequip two hands weapon when equipping single hand weapon
				var twoHandsItem = wearer.container.getFromSlot(Constants.SLOT_BOTH_HANDS);
				if ( twoHandsItem) {
					twoHandsItem.equipment.unequip( twoHandsItem, wearer );
				}
			}
			this.equipped = true;
			if ( wearer === Engine.instance.actorManager.getPlayer()) {
				log(transformMessage("[The actor1] equip[s] [the actor2] on [its] " + this.slot, wearer, owner), 0xFFA500 );
			}
		}

		unequip(owner: Actor, wearer: Actor, beforeDrop: boolean = false) {
			this.equipped = false;
			if ( !beforeDrop && wearer === Engine.instance.actorManager.getPlayer()) {
				log(transformMessage("[The actor1] unequip[s] [the actor2] from [its] " + this.slot, wearer, owner), 0xFFA500 );
			}
		}
	}

	/*
		class: Ranged
		an item that throws other items. It's basically a shortcut to throw projectile items with added damages.
		For example instead of [t]hrowing an arrow by hand, you equip a bow and [f]ire it. The result is the same
		except that :
		- the arrow will deal more damages
		- the action will take more time because you need time to load the projectile on the weapon

		The same arrow will deal different damages depending on the bow you use.
		A ranged weapon can throw several type of projectiles (for example dwarven and elven arrows). 
		The projectileType property makes it possible to look for an adequate item in the inventory.
		If a compatible type is equipped (on quiver), it will be used. Else the first compatible item will be used.
		So far, the weapon has no impact on the range but this could be done easily.
	*/
	export class Ranged implements Persistent {
		className: string;
		/*
			Property: _damageCoef
			Damage multiplicator when using this weapon to fire a projectile.
		*/
		private _damageCoef: number;
		/*
			Property: _projectileType
			The actor type that this weapon can fire.
		*/
		private _projectileType: ActorClass;
		/*
			Property: loadTime
			Time to load this weapon with a projectile
		*/
		private _loadTime: number;

		private _projectile: Actor;

		get loadTime() { return this._loadTime; }
		get damageCoef() { return this._damageCoef; }
		get projectileType() { return this._projectileType; }
		get projectile() { return this._projectile; }

		constructor(_damageCoef: number, projectileTypeName: string, loadTime: number) {
			this.className = "Ranged";
			this._damageCoef = _damageCoef;
			this._projectileType  = ActorClass.buildClassHierarchy("weapon|projectile|" + projectileTypeName);
			this._loadTime = loadTime;
		}

		fire(owner: Actor, wearer: Actor) {
			this._projectile = this.findCompatibleProjectile(wearer);
			if (! this._projectile) {
				// no projectile found. cannot fire
				if ( wearer === Engine.instance.actorManager.getPlayer()) {
					log("No " + this._projectileType.name + " available.", 0xFF0000);
					return;
				}
			}
			log(transformMessage("[The actor1] fire[s] [a actor2].", wearer, this._projectile));
			this._projectile.pickable.throw(this._projectile);
		}

		private findCompatibleProjectile(wearer: Actor): Actor {
			var projectile = undefined;
			if ( wearer.container ) {
				// if a projectile type is selected (equipped in quiver), use it
				projectile = wearer.container.getFromSlot(Constants.SLOT_QUIVER);
				if (! projectile || ! projectile.isA(this._projectileType)) {
					// else use the first compatible projectile
					projectile = undefined;
					var n: number = wearer.container.size();
					for ( var i: number = 0; i < n; ++i) {
						var item: Actor = wearer.container.get(i);
						if ( item.isA(this._projectileType)) {
							projectile = item;
							break;
						}
					}
				}
			}
			return projectile;
		}
	}

	/*
		Class: Magic
		Item with magic properties (staff wands, ...)
	*/
	export class Magic implements Persistent {
		className: string;
		private _maxCharges: number;
		private _charges: number;
		private onFireEffector: Effector;

		get maxCharges() { return this._maxCharges; }
		set maxCharges(newValue: number) { this._maxCharges = newValue; }

		constructor(maxCharges: number) {
			this.className = "Magic";
			this._maxCharges = maxCharges;
			this._charges = this._maxCharges;
		}

		setFireEffector(effect: Effect, targetSelector: TargetSelector, message?: string) {
			this.onFireEffector = new Effector(effect, targetSelector, message);
		}

		zap(owner: Actor, wearer: Actor) {
			if ( this._charges === 0 ) {
				log(transformMessage("[The actor1's] " + owner.name + " is uncharged", wearer));
			} else if ( this.onFireEffector ) {
				if (this.onFireEffector.apply(owner, wearer)) {
					this.doPostZap(owner, wearer);
				}
			}
		}

		zapOnPos(owner: Actor, wearer: Actor, pos: Yendor.Position) {
			if (this.onFireEffector.applyOnPos(owner, wearer, pos)) {
				this.doPostZap(owner, wearer);
			} else {
				// TODO fail message
			}
		}

		private doPostZap(owner: Actor, wearer: Actor) {
			this._charges --;
			if ( this._charges > 0 ) {
				log("Remaining charges : " + this._charges );
			} else {
				log(transformMessage("[The actor1's] " + owner.name + " is uncharged", wearer));
			}
		}
	}
}
