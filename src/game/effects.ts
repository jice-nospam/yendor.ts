/*
	Section: effects
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
		private _radius: number;
		__selectedTargets: Actor[];
		/*
			Constructor: constructor

			Parameters:
			_method - the target selection method
			_range - *optional* for methods requiring a range
			_radius - *optional* for methods having a radius of effect
		*/
		constructor(_method: TargetSelectionMethod = undefined, _range?: number, _radius?: number) {
			this.className = "TargetSelector";
			this._method = _method;
			this._range = _range;
			this._radius = _radius;
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
			Property: radius
			Radius of effect around the selected position
		*/
		get radius() { return this._radius; }

		/*
			Function: selectTargets
			Populates the __selectedTargets field, or triggers the tile picker

			Parameters:
			owner - the actor owning the effect (the magic item or the scroll)
			wearer - the actor using the item
			cellPos - the cell where the effect applies (= the wearer position when used from inventory, or a different position when thrown)

			Returns:
			true if targets have been selected (else wait for TILE_SELECTED event, then call <onTileSelected>)
		*/
		selectTargets(owner: Actor, wearer: Actor, cellPos: Yendor.Position): boolean {
			this.__selectedTargets = [];
			var creatures: Actor[] = Engine.instance.actorManager.getCreatures();
			var data: TilePickerEventData;
			switch (this._method) {
				case TargetSelectionMethod.ACTOR_ON_CELL :
					if ( cellPos ) {
						this.__selectedTargets = Engine.instance.actorManager.findActorsOnCell(cellPos, creatures);
					} else {
						this.__selectedTargets.push(wearer);
					}
					return true;
				case TargetSelectionMethod.CLOSEST_ENEMY :
					var actor = Engine.instance.actorManager.findClosestActor(cellPos ? cellPos : wearer, this.range, creatures);
					if ( actor ) {
						this.__selectedTargets.push(actor);
					}
					return true;
				case TargetSelectionMethod.ACTORS_IN_RANGE :
					this.__selectedTargets = Engine.instance.actorManager.findActorsInRange( cellPos ? cellPos : wearer, this.range, creatures );
					return true;
				case TargetSelectionMethod.SELECTED_ACTOR :
					log("Left-click a target creature,\nor right-click to cancel.", Constants.LOG_WARN_COLOR);
					data = {origin: new Yendor.Position(wearer.x, wearer.y), range: this._range, radius: this._radius};
					Engine.instance.eventBus.publishEvent(EventType.PICK_TILE, data);
					return false;
				case TargetSelectionMethod.SELECTED_RANGE :
					log("Left-click a target tile,\nor right-click to cancel.", Constants.LOG_WARN_COLOR);
					data = {origin: new Yendor.Position(wearer.x, wearer.y), range: this._range, radius: this._radius};
					Engine.instance.eventBus.publishEvent(EventType.PICK_TILE, data);
					return false;
			}
		}

		/*
			Function: onTileSelected
			Populates the __selectedTargets field for selection methods that require a tile selection
		*/
		onTileSelected(pos: Yendor.Position) {
			var creatures: Actor[] = Engine.instance.actorManager.getCreatures();
			switch (this._method) {
				case TargetSelectionMethod.SELECTED_ACTOR :
					this.__selectedTargets = Engine.instance.actorManager.findActorsOnCell( pos, creatures);
				break;
				case TargetSelectionMethod.SELECTED_RANGE :
					this.__selectedTargets = Engine.instance.actorManager.findActorsInRange( pos, this._radius, creatures );
				break;
			}
		}
	}

	/********************************************************************************
	 * Group: conditions
	 ********************************************************************************/
	/*
		Enum: ConditionType

	 	CONFUSED - moves randomly and attacks anything on path
	 	STUNNED - don't move or attack, then get confused
	 	REGENERATION - regain health points over time
	 	OVERENCUMBERED - walk slower. This also affects all actions relying on walkTime.
	 	DETECT_LIFE - detect nearby living creatures
	*/
	export const enum ConditionType {
		CONFUSED,
		STUNNED,
		FROZEN,
		REGENERATION,
		OVERENCUMBERED,
		DETECT_LIFE,
	}

	export interface ConditionAdditionalParam {
		amount?: number;
		range?: number;
	}

	/*
	 	Class: Condition
	 	Permanent or temporary effect affecting a creature
	*/
	export class Condition implements Persistent {
		className: string;

		/*
	 		Property: time
	 		Time before this condition stops, or -1 for permanent conditions
		*/
		protected _time: number;
		protected _type: ConditionType;
		protected _initialTime: number;
		private static condNames = [ "confused", "stunned", "frozen", "regeneration", "overencumbered", "life detec" ];

		// factory
		static create(type: ConditionType, time: number, additionalArgs?: ConditionAdditionalParam): Condition {
			switch ( type ) {
				case ConditionType.REGENERATION :
					return new RegenerationCondition(time, additionalArgs.amount);
				case ConditionType.STUNNED :
					return new StunnedCondition(time);
				case ConditionType.FROZEN :
					return new FrozenCondition(time);
				case ConditionType.DETECT_LIFE :
					return new DetectLifeCondition(time, additionalArgs.range);
				default :
					return new Condition(type, time);
			}
		}

		constructor(type: ConditionType, time: number) {
			this.className = "Condition";
			this._initialTime = time;
			this._time = time;
			this._type = type;
		}

		get type() { return this._type; }
		get time() { return this._time; }
		get initialTime() { return this._initialTime; }
		getName() { return Condition.condNames[this._type]; }

		/*
			Function: onApply
			What happens when an actor gets this condition
		*/
		onApply(owner: Actor) {}
		/*
			Function: onApply
			What happens when this condition is removed from an actor
		*/
		onRemove(owner: Actor) {}

		/*
			Function: update
			What happens every turn when an actor has this condition

			Returns:
				false if the condition has ended
		*/
		update(owner: Actor): boolean {
			if ( this._time > 0 ) {
				this._time --;
				return (this._time > 0);
			}
			return true;
		}
	}

	/*
		Class: RegenerationCondition
		The creature gain health points over time
	*/
	export class RegenerationCondition extends Condition {
		private hpPerTurn: number;
		constructor(nbTurns: number, nbHP : number) {
			super(ConditionType.REGENERATION, nbTurns);
			this.className = "RegenerationCondition";
			this.hpPerTurn = nbHP / nbTurns;
		}

		update(owner: Actor): boolean {
			if (owner.destructible) {
				owner.destructible.heal(this.hpPerTurn);
			}
			return super.update(owner);
		}
	}

	/*
		Class: StunnedCondition
		The creature cannot move or attack while stunned. Then it gets confused for a few turns
	*/
	export class StunnedCondition extends Condition {
		constructor(nbTurns: number) {
			super(ConditionType.STUNNED, nbTurns);
			this.className = "StunnedCondition";
		}

		update(owner: Actor): boolean {
			if (! super.update(owner)) {
				if ( this.type === ConditionType.STUNNED) {
					// after being stunned, wake up confused
					this._type = ConditionType.CONFUSED;
					this._time = Constants.AFTER_STUNNED_CONFUSION_DELAY;
				} else {
					return false;
				}
			}
			return true;
		}
	}


	/*
		Class: DetectLifeCondition
		Detect creatures through walls
	*/
	export class DetectLifeCondition extends Condition {
		// above this range, creatures are not detected
		private _range: number;

		get range() { return this._range; }

		constructor(nbTurns: number, range: number) {
			super(ConditionType.DETECT_LIFE, nbTurns);
			this.className = "DetectLifeCondition";
			this._range = range;
		}
	}

	/*
		Class: FrozenCondition
		The creature is slowed down
	*/
	export class FrozenCondition extends Condition {
		private originalColor: Yendor.Color;
		constructor(nbTurns: number) {
			super(ConditionType.FROZEN, nbTurns);
			this.className = "FrozenCondition";
		}

		onApply(owner: Actor) {
			this.originalColor = owner.col;
			owner.col = Constants.FROST_COLOR;
		}

		onRemove(owner: Actor) {
			owner.col = this.originalColor;
		}

		update(owner: Actor): boolean {
			var progress = (this._time - 1) / this._initialTime;
			owner.col = Yendor.ColorUtils.add(Yendor.ColorUtils.multiply(Constants.FROST_COLOR, progress),
				Yendor.ColorUtils.multiply(this.originalColor, 1 - progress));
			return super.update(owner);
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
		Class: TeleportEffect
		Teleport the target at a random location.
	*/
	export class TeleportEffect implements Effect {
		className: string;
		private successMessage: string;

		constructor(successMessage?: string) {
			this.className = "TeleportEffect";
			this.successMessage = successMessage;
		}

		applyTo(actor: Actor, coef: number = 1.0): boolean {
			var x: number = Engine.instance.rng.getNumber(0, Engine.instance.map.width - 1);
			var y: number = Engine.instance.rng.getNumber(0, Engine.instance.map.height - 1);
			while (! Engine.instance.map.canWalk(x, y)) {
				x++;
				if ( x === Engine.instance.map.width ) {
					x = 0;
					y++;
					if ( y === Engine.instance.map.height ) {
						y = 0;
					}
				}
			}
			actor.x = x;
			actor.y = y;
			if ( this.successMessage) {
				log(transformMessage(this.successMessage, actor));
			}
			return true;
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
		private additionalArgs: ConditionAdditionalParam;
		constructor( type: ConditionType, nbTurns: number, message?: string, additionalArgs?: ConditionAdditionalParam ) {
			this.className = "ConditionEffect";
			this.type = type;
			this.nbTurns = nbTurns;
			this.message = message;
			if (additionalArgs) {
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
				this.applyEffectToActorList(owner, wearer, this.targetSelector.__selectedTargets);
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
			if ( this.targetSelector.__selectedTargets.length > 0 ) {
				this.applyEffectToActorList(owner, wearer, this.targetSelector.__selectedTargets);
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
}
