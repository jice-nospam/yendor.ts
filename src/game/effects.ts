/**
	Section: effects
*/
module Game {
    "use strict";


	/********************************************************************************
	 * Group: target selection
	 ********************************************************************************/
	/**
		Class: TargetSelector
		Various ways to select actors
	*/
    export class TargetSelector implements Persistent {
        className: string;
        private _method: TargetSelectionMethod;
        private actorType: string; 
        private _range: number;
        private _radius: number;
        __selectedTargets: Actor[];

        constructor(def: TargetSelectorDef) {
            this.className = "TargetSelector";
            if (def) {
                this._method = def.method;
                this._range = def.range;
                this._radius = def.radius;
                this.actorType = def.actorType;
            }
        }

		/**
			Property: method
			The target selection method (read-only)
		*/
        get method() { return this._method; }

		/**
			Property: range
			The selection range (read-only)
		*/
        get range() { return this._range; }

		/**
			Property: radius
			Radius of effect around the selected position
		*/
        get radius() { return this._radius; }

		/**
			Function: selectTargets
			Populates the __selectedTargets field, or triggers the tile picker

			Parameters:
			owner - the actor owning the effect (the magic item or the scroll)
			wearer - the actor using the item
			cellPos - the selected cell where the effect applies (for types SELECTED_ACTOR and SELECTED_RANGE)

			Returns:
			true if targets have been selected (else wait for TILE_SELECTED event, then call <onTileSelected>)
		*/
        selectTargets(owner: Actor, wearer: Actor, cellPos: Core.Position): boolean {
            this.__selectedTargets = [];
            let creatureIds: ActorId[] = Engine.instance.actorManager.getCreatureIds();
            let data: TilePickerEventData;
            switch (this._method) {
                case TargetSelectionMethod.WEARER:
                    this.__selectedTargets.push(wearer);
                    return true;
                case TargetSelectionMethod.WEARER_INVENTORY:
                    // check if there's only one corresponding target
                    if ( !wearer.container ) {
                        return true;
                    }
                    for (let i: number = 0, len: number = wearer.container.size(); i < len; ++i) {
                        let actor: Actor = wearer.container.get(i);
                        if (!this.actorType || actor.isA(this.actorType)) {
                            this.__selectedTargets.push(actor);
                        }
                    }
                    if ( this.__selectedTargets.length === 1 ) {
                        return true;
                    }
                    // TODO. player must select an actor from this.__selectedTargets list.
                    return false;
                case TargetSelectionMethod.ACTOR_ON_CELL:
                    this.__selectedTargets = Engine.instance.actorManager.findActorsOnCell(cellPos, creatureIds);
                    return true;
                case TargetSelectionMethod.CLOSEST_ENEMY:
                    let actor = Engine.instance.actorManager.findClosestActor(cellPos ? cellPos : wearer, this.range, creatureIds);
                    if (actor) {
                        this.__selectedTargets.push(actor);
                    }
                    return true;
                case TargetSelectionMethod.ACTORS_IN_RANGE:
                    this.__selectedTargets = Engine.instance.actorManager.findActorsInRange(cellPos ? cellPos : wearer, this.range, creatureIds);
                    return true;
                case TargetSelectionMethod.SELECTED_ACTOR:
                    log("Left-click a target creature,\nor right-click to cancel.", Constants.LOG_WARN_COLOR);
                    data = { origin: new Core.Position(wearer.x, wearer.y), range: this._range, radius: this._radius };
                    Umbra.EventManager.publishEvent(EventType[EventType.PICK_TILE], data);
                    return false;
                case TargetSelectionMethod.SELECTED_RANGE:
                    log("Left-click a target tile,\nor right-click to cancel.", Constants.LOG_WARN_COLOR);
                    data = { origin: new Core.Position(wearer.x, wearer.y), 
                        range: this._range ? this._range : owner.computeThrowRange(wearer), 
                        radius: this._radius };
                    Umbra.EventManager.publishEvent(EventType[EventType.PICK_TILE], data);
                    return false;
                default :
                    return false;
            }
        }

		/**
			Function: onTileSelected
			Populates the __selectedTargets field for selection methods that require a tile selection
		*/
        onTileSelected(pos: Core.Position) {
            let creatureIds: ActorId[] = Engine.instance.actorManager.getCreatureIds();
            switch (this._method) {
                case TargetSelectionMethod.SELECTED_ACTOR:
                    this.__selectedTargets = Engine.instance.actorManager.findActorsOnCell(pos, creatureIds);
                    break;
                case TargetSelectionMethod.SELECTED_RANGE:
                    this.__selectedTargets = Engine.instance.actorManager.findActorsInRange(pos, this._radius, creatureIds);
                    break;
            }
        }
    }

	/********************************************************************************
	 * Group: conditions
	 ********************************************************************************/


	/**
	 	Class: Condition
	 	Permanent or temporary effect affecting a creature
	*/
    export class Condition implements Persistent {
        className: string;

		/**
	 		Property: time
	 		Time before this condition stops, or -1 for permanent conditions
		*/
        protected _time: number;
        protected _type: ConditionType;
        protected _initialTime: number;
        protected name: string;
        protected noDisplay: boolean;
        protected _onlyIfActive: boolean;
        private static condNames = ["confused", "stunned", "frozen", "regeneration", "overencumbered", "life detection"];

        get onlyIfActive(): boolean {return this._onlyIfActive;}

        // factory
        static create(def: ConditionDef): Condition {
            switch (def.type) {
                case ConditionType.HEALTH_VARIATION:
                    return new HealthVariationCondition(def);
                case ConditionType.STUNNED:
                    return new StunnedCondition(def);
                case ConditionType.FROZEN:
                    return new FrozenCondition(def);
                case ConditionType.DETECT_LIFE:
                    return new DetectLifeCondition(def);
                default:
                    return new Condition(def);
            }
        }

        constructor(def: ConditionDef) {
            this.className = "Condition";
            if (def) {
                this._initialTime = def.nbTurns;
                this._time = def.nbTurns;
                this._type = def.type;
                this.noDisplay = def.noDisplay;
                this.name = def.name;
                this._onlyIfActive = def.onlyIfActive;
            }
        }

        get type() { return this._type; }
        get time() { return this._time; }
        get initialTime() { return this._initialTime; }
        getName() { return this.noDisplay ? undefined : this.name ? this.name : Condition.condNames[this._type]; }

		/**
			Function: onApply
			What happens when an actor gets this condition
		*/
        onApply(owner: Actor) {
            // default empty
        }

		/**
			Function: onApply
			What happens when this condition is removed from an actor
		*/
        onRemove(owner: Actor) {
            // default empty
        }

		/**
			Function: update
			What happens every turn when an actor has this condition

			Returns:
				false if the condition has ended
		*/
        update(owner: Actor): boolean {
            if (this._time > 0) {
                this._time--;
                return (this._time > 0);
            }
            return true;
        }
    }

	/**
		Class: HealthVariationCondition
		The actor gain or lose health points over time
	*/
    export class HealthVariationCondition extends Condition {
        private hpPerTurn: number;
        constructor(def: ConditionDef) {
            super(def);
            this.className = "HealthVariationCondition";
            if ( def ) {
                this.hpPerTurn = def.nbTurns === 0 ? def.amount : def.amount / def.nbTurns;
            }
        }

        update(owner: Actor): boolean {
            if (owner.destructible) {
                if ( this.hpPerTurn > 0) {
                    owner.destructible.heal(owner, this.hpPerTurn);
                } else if ( this.hpPerTurn < 0) {
                    owner.destructible.takeDamage(owner, -this.hpPerTurn);
                }
            }
            return super.update(owner);
        }
    }

	/**
		Class: StunnedCondition
		The creature cannot move or attack while stunned. Then it gets confused for a few turns
	*/
    export class StunnedCondition extends Condition {
        constructor(def: ConditionDef) {
            super(def);
            this.className = "StunnedCondition";
        }

        update(owner: Actor): boolean {
            if (! super.update(owner)) {
                if (this.type === ConditionType.STUNNED) {
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


	/**
		Class: DetectLifeCondition
		Detect creatures through walls
	*/
    export class DetectLifeCondition extends Condition {
        // above this range, creatures are not detected
        private _range: number;

        get range() { return this._range; }

        constructor(def: ConditionDef) {
            super(def);
            this.className = "DetectLifeCondition";
            if (def) {
                this._range = def.range;
            }
        }
    }

	/**
		Class: FrozenCondition
		The creature is slowed down
	*/
    export class FrozenCondition extends Condition {
        private originalColor: Core.Color;
        constructor(def: ConditionDef) {
            super(def);
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
            let progress = (this._time - 1) / this._initialTime;
            owner.col = Core.ColorUtils.add(Core.ColorUtils.multiply(Constants.FROST_COLOR, progress),
                Core.ColorUtils.multiply(this.originalColor, 1 - progress));
            return super.update(owner);
        }
    }

	/********************************************************************************
	 * Group: effects
	 ********************************************************************************/

	/**
		Interface: Effect
		Some effect that can be applied to actors. The effect might be triggered by using an item or casting a spell.
	*/
    export interface Effect extends Persistent {
		/**
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

	/**
		Class: InstantHealthEffect
		Add or remove health points.
	*/
    export class InstantHealthEffect implements Effect {
        className: string;
        private _amount: number;
        private successMessage: string;
        private failureMessage: string;

        get amount() { return this._amount; }

        constructor(amount: number = 0, successMessage?: string, failureMessage?: string) {
            this.className = "InstantHealthEffect";
            this._amount = amount;
            this.successMessage = successMessage;
            this.failureMessage = failureMessage;
        }

        applyTo(actor: Actor, coef: number = 1.0): boolean {
            if (!actor.destructible) {
                return false;
            }
            if (this._amount > 0) {
                return this.applyHealingEffectTo(actor, coef);
            } else {
                return this.applyWoundingEffectTo(actor, coef);
            }
        }

        private applyHealingEffectTo(actor: Actor, coef: number = 1.0): boolean {
            let healPointsCount: number = actor.destructible.heal(actor, coef * this._amount);
            let wearer: Actor = actor.getWearer();
            if (healPointsCount > 0 && this.successMessage) {
                log(transformMessage(this.successMessage, actor, wearer, healPointsCount));
            } else if (healPointsCount <= 0 && this.failureMessage) {
                log(transformMessage(this.failureMessage, actor));
            }
            return true;
        }

        private applyWoundingEffectTo(actor: Actor, coef: number = 1.0): boolean {
            let realDefense: number = actor.destructible.computeRealDefense(actor);
            let damageDealt = -this._amount * coef - realDefense;
            let wearer: Actor = actor.getWearer();
            if (damageDealt > 0 && this.successMessage) {
                log(transformMessage(this.successMessage, actor, wearer, damageDealt));
            } else if (damageDealt <= 0 && this.failureMessage) {
                log(transformMessage(this.failureMessage, actor, wearer));
            }
            return actor.destructible.takeDamage(actor, -this._amount * coef) > 0;
        }
    }

	/**
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
            let x: number = Engine.instance.rng.getNumber(0, Engine.instance.map.w - 1);
            let y: number = Engine.instance.rng.getNumber(0, Engine.instance.map.h - 1);
            while (!Engine.instance.map.canWalk(x, y)) {
                x++;
                if (x === Engine.instance.map.w) {
                    x = 0;
                    y++;
                    if (y === Engine.instance.map.h) {
                        y = 0;
                    }
                }
            }
            actor.moveTo(x, y);
            if (this.successMessage) {
                log(transformMessage(this.successMessage, actor));
            }
            return true;
        }
    }

	/**
		Class: ConditionEffect
		Add a condition to an actor.
	*/
    export class ConditionEffect implements Effect {
        className: string;
        conditionDef: ConditionDef;
        private message: string;
        constructor(def: ConditionDef, message?: string) {
            this.className = "ConditionEffect";
            this.message = message;
            this.conditionDef = def;
        }

        applyTo(actor: Actor, coef: number = 1.0): boolean {
            if (!actor.ai) {
                return false;
            }
            actor.ai.addCondition(Condition.create(this.conditionDef),
                actor);
            if (this.message) {
                log(transformMessage(this.message, actor));
            }
            return true;
        }
    }

    export class MapRevealEffect implements Effect {
        className: string;
        constructor() {
            this.className = "MapRevealEffect";
        }

        applyTo(actor: Actor, coef: number = 1.0): boolean {
            if (actor === Engine.instance.actorManager.getPlayer()) {
                Engine.instance.map.reveal();
                return true;
            }
            return false;
        }
    }

	/**
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

		/**
			Function: apply
			Select targets and apply the effect.

			Returns:
			false if a tile needs to be selected (in that case, wait for TILE_SELECTED event, then call <applyOnPos>)
		*/
        apply(owner: Actor, wearer: Actor, cellPos?: Core.Position, coef: number = 1.0): boolean {
            this._coef = coef;
            if (this.targetSelector.selectTargets(owner, wearer, cellPos)) {
                this.applyEffectToActorList(owner, wearer, this.targetSelector.__selectedTargets);
                return true;
            }
            return false;
        }

		/**
			Function: applyOnPos
			Select targets and apply the effect once a tile has been selected.

			Returns:
			false if no target has been selected
		*/
        applyOnPos(owner: Actor, wearer: Actor, pos: Core.Position): boolean {
            this.targetSelector.onTileSelected(pos);
            if (this.targetSelector.__selectedTargets.length > 0) {
                this.applyEffectToActorList(owner, wearer, this.targetSelector.__selectedTargets);
                return true;
            } else {
                return false;
            }
        }

        private applyEffectToActorList(owner: Actor, wearer: Actor, actors: Actor[]) {
            let success: boolean = false;
            if (this.message) {
                log(transformMessage(this.message, wearer));
            }

            for (let i: number = 0, len: number = actors.length; i < len; ++i) {
                if (this._effect.applyTo(actors[i], this._coef)) {
                    success = true;
                }
            }
            if (this.destroyOnEffect && success && wearer && wearer.container) {
                wearer.container.remove(owner.id, wearer);
                // actually remove actor from actorManager
                Engine.instance.actorManager.destroyActor(owner.id);
            }
        }
    }
}
