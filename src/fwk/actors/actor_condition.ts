/**
 * Section: effects
 */
import * as Core from "../core/main";
import {Actor} from "./actor";
import {ConditionTypeEnum, IConditionDef} from "./actor_def";
import {AFTER_STUNNED_CONFUSION_DELAY, FROST_COLOR} from "./base";

/**
 * ==============================================================================
 * Group: conditions
 * ===============================================================================
 */

/**
 * Class: Condition
 * Permanent or temporary effect affecting a creature.
 * Conditions can only be applied to actors with ai feature and are updated
 * by the <Actor.update()> function called by the scheduler.
 */
export class Condition {
    // factory
    public static create(def: IConditionDef): Condition {
        switch (def.type) {
            case ConditionTypeEnum.HEALTH_VARIATION:
                return new HealthVariationCondition(def);
            case ConditionTypeEnum.STUNNED:
                return new StunnedCondition(def);
            case ConditionTypeEnum.FROZEN:
                return new FrozenCondition(def);
            case ConditionTypeEnum.DETECT_LIFE:
                return new DetectLifeCondition(def);
            default:
                return new Condition(def);
        }
    }

    private static condNames = ["confused", "stunned", "frozen", "regeneration", "overencumbered", "life detection"];

    public readonly onlyIfActive: boolean;
    public readonly initialTime: number;

    /**
     * Property: time
     * Time before this condition stops, or -1 for permanent conditions
     */
    protected _time: number;
    protected _type: ConditionTypeEnum;
    protected name: string|undefined;
    protected noDisplay: boolean;

    protected constructor(def: IConditionDef) {
        if (def) {
            this.initialTime = def.nbTurns;
            this._time = def.nbTurns;
            this._type = def.type;
            this.noDisplay = def.noDisplay || false;
            this.name = def.name;
            this.onlyIfActive = def.onlyIfActive || false;
        }
    }

    get type() { return this._type; }
    get time() { return this._time; }
    public getName() { return this.noDisplay ? undefined : this.name ? this.name : Condition.condNames[this._type]; }

    /**
     * Function: onApply
     * What happens when an actor gets this condition
     */
    public onApply(_owner: Actor) {
        // default empty
    }

    /**
     * Function: onApply
     * What happens when this condition is removed from an actor
     */
    public onRemove(_owner: Actor) {
        // default empty
    }

    /**
     * Function: update
     * What happens every turn when an actor has this condition
     * Returns:
     * false if the condition has ended
     */
    public update(_owner: Actor): boolean {
        if (this._time > 0) {
            this._time--;
            return (this._time > 0);
        }
        return true;
    }
}

/**
 * Class: HealthVariationCondition
 * The actor gain or lose health points over time
 */
export class HealthVariationCondition extends Condition {
    private hpPerTurn: number;
    constructor(def: IConditionDef) {
        super(def);
        if ( def && def.amount ) {
            this.hpPerTurn = def.nbTurns === 0 ? def.amount : def.amount / def.nbTurns;
        }
    }

    public update(owner: Actor): boolean {
        if (owner.destructible) {
            if (! this.onlyIfActive || ! owner.activable || owner.activable.isActive()) {
                if ( this.hpPerTurn > 0) {
                    owner.destructible.heal(owner, this.hpPerTurn);
                } else if ( this.hpPerTurn < 0) {
                    owner.destructible.takeDamage(owner, -this.hpPerTurn);
                }
            }
        }
        return super.update(owner);
    }
}

/**
 * Class: StunnedCondition
 * The creature cannot move or attack while stunned. Then it gets confused for a few turns
 */
export class StunnedCondition extends Condition {
    constructor(def: IConditionDef) {
        super(def);
    }

    public update(owner: Actor): boolean {
        if (! super.update(owner)) {
            if (this.type === ConditionTypeEnum.STUNNED) {
                // after being stunned, wake up confused
                this._type = ConditionTypeEnum.CONFUSED;
                this._time = AFTER_STUNNED_CONFUSION_DELAY;
            } else {
                return false;
            }
        }
        return true;
    }
}

/**
 * Class: DetectLifeCondition
 * Detect creatures through walls
 */
export class DetectLifeCondition extends Condition {
    // above this range, creatures are not detected
    public readonly range: number;

    constructor(def: IConditionDef) {
        super(def);
        if (def && def.range) {
            this.range = def.range;
        }
    }
}

/**
 * Class: FrozenCondition
 * The creature is slowed down
 */
export class FrozenCondition extends Condition {
    private originalColor: Core.Color;
    constructor(def: IConditionDef) {
        super(def);
    }

    public onApply(owner: Actor) {
        this.originalColor = owner.col;
        owner.col = FROST_COLOR;
    }

    public onRemove(owner: Actor) {
        owner.col = this.originalColor;
    }

    public update(owner: Actor): boolean {
        let progress = (this._time - 1) / this.initialTime;
        owner.col = Core.ColorUtils.add(Core.ColorUtils.multiply(FROST_COLOR, progress),
            Core.ColorUtils.multiply(this.originalColor, 1 - progress));
        return super.update(owner);
    }
}
