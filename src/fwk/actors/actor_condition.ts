/**
	Section: effects
*/
import * as Core from "../core/main";
import {Actor} from "./actor";
import {ConditionType, ConditionDef} from "./actor_def";
import {AFTER_STUNNED_CONFUSION_DELAY, FROST_COLOR} from "./base";

	/********************************************************************************
	 * Group: conditions
	 ********************************************************************************/

	/**
	 	Class: Condition
	 	Permanent or temporary effect affecting a creature.
        Conditions can only be applied to actors with ai feature and are updated by the <Actor.update()> function called by the scheduler.
	*/
    export class Condition implements Core.Persistent {
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

        get onlyIfActive(): boolean { return this._onlyIfActive; }

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
        }

        update(owner: Actor): boolean {
            if (! super.update(owner)) {
                if (this.type === ConditionType.STUNNED) {
                    // after being stunned, wake up confused
                    this._type = ConditionType.CONFUSED;
                    this._time = AFTER_STUNNED_CONFUSION_DELAY;
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
        }

        onApply(owner: Actor) {
            this.originalColor = owner.col;
            owner.col = FROST_COLOR;
        }

        onRemove(owner: Actor) {
            owner.col = this.originalColor;
        }

        update(owner: Actor): boolean {
            let progress = (this._time - 1) / this._initialTime;
            owner.col = Core.ColorUtils.add(Core.ColorUtils.multiply(FROST_COLOR, progress),
                Core.ColorUtils.multiply(this.originalColor, 1 - progress));
            return super.update(owner);
        }
    }
