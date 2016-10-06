/**
 * Section: effects
 */
import * as Core from "../core/main";
import * as Umbra from "../umbra/main";
import * as Map from "../map/main";
import {Actor, SpecialActorsEnum} from "./actor";
import {TargetSelectionMethodEnum, ITargetSelectorDef, IInstantHealthEffectDef, IConditionDef,
    IEventEffectDef} from "./actor_def";
import {transformMessage} from "./base";
import {Condition} from "./actor_condition";

/**
 * =============================================================================
 * Group: target selection
 * =============================================================================
 */
export interface ITilePicker {
    pickATile(message: string, origin?: Core.Position, range?: number, radius?: number): Promise<Core.Position>;
}

/**
 * Class: TargetSelector
 * Various ways to select actors
 */
export class TargetSelector {
    private _method: TargetSelectionMethodEnum;
    private actorType: string|undefined;
    private _range: number|undefined;
    private _radius: number|undefined;

    constructor(def: ITargetSelectorDef) {
        if (def) {
            this._method = def.method;
            this._range = def.range;
            this._radius = def.radius;
            this.actorType = def.actorType;
        }
    }

    /**
     * Property: method
     * The target selection method (read-only)
     */
    get method() { return this._method; }

    /**
     * Property: range
     * The selection range (read-only)
     */
    get range() { return this._range; }

    /**
     * Property: radius
     * Radius of effect around the selected position
     */
    get radius() { return this._radius; }

    /**
     * Function: selectTargets
     * Populates the __selectedTargets field, or triggers the tile picker
     * Parameters:
     * owner - the actor owning the effect (the magic item or the scroll)
     * wearer - the actor using the item
     * cellPos - the selected cell where the effect applies (for types SELECTED_ACTOR and SELECTED_RANGE)
     * Returns:
     * true if targets have been selected (else wait for TILE_SELECTED event, then call <onTileSelected>)
     */
    public selectTargets(_owner: Actor, wearer: Actor, cellPos?: Core.Position): Promise<Actor[]> {
        let selectedTargets: Actor[] = [];
        switch (this._method) {
            // synchronous cases
            case TargetSelectionMethodEnum.WEARER:
                selectedTargets.push(wearer);
                break;
            case TargetSelectionMethodEnum.ACTOR_ON_CELL:
                if ( cellPos) {
                    selectedTargets = Actor.list.filter((actor: Actor) => actor.pos.equals(cellPos)
                        && actor.isA("creature[s]"));
                }
                break;
            case TargetSelectionMethodEnum.CLOSEST_ENEMY:
                let actor = Actor.findClosestEnemy(cellPos ? cellPos : wearer.pos, this.range);
                if (actor) {
                    selectedTargets.push(actor);
                }
                break;
            case TargetSelectionMethodEnum.ACTORS_IN_RANGE:
                selectedTargets = Actor.list.filter((actor: Actor) =>
                    actor.isA("creature[s]")
                    && Core.Position.distance(cellPos ? cellPos : wearer.pos, actor.pos) < this.range
                );
                break;
            // asynchronous cases
            case TargetSelectionMethodEnum.WEARER_INVENTORY:
                // check if there's only one corresponding target
                if ( !wearer.container ) {
                    break;
                }
                wearer.container.getContent(this.actorType, true, selectedTargets);
                if ( selectedTargets.length === 1 ) {
                    // auto-select item when there's only one corresponding.
                    break;
                } else if ( selectedTargets.length > 1 ) {
                    // player must select an actor from his inventory.
                    selectedTargets = [];
                    if ( wearer.ai && wearer.ai.inventoryItemPicker) {
                        return new Promise<Actor[]>((resolve) => {
                            if (wearer.ai.inventoryItemPicker) {
                                wearer.ai.inventoryItemPicker.pickItemFromInventory("select an item", wearer,
                                    this.actorType).then((item: Actor) => {
                                    selectedTargets.push(item);
                                    resolve(selectedTargets);
                                });
                            }
                        });
                    }
                }
                break;
            case TargetSelectionMethodEnum.SELECTED_ACTOR:
                if (wearer.ai && wearer.ai.tilePicker) {
                    return new Promise<Actor[]>((resolve) => {
                        if (wearer.ai.tilePicker) {
                            wearer.ai.tilePicker.pickATile("Left-click a target creature,\nor right-click to cancel.",
                                new Core.Position(wearer.pos.x, wearer.pos.y),
                                this._range, this._radius).then((pos: Core.Position) => {
                                resolve(this.onTileSelected(pos));
                            });
                        }
                    });
                }
                break;
            case TargetSelectionMethodEnum.SELECTED_RANGE:
                if ( wearer.ai && wearer.ai.tilePicker ) {
                    return new Promise<Actor[]>((resolve) => {
                        if (wearer.ai.tilePicker) {
                            wearer.ai.tilePicker.pickATile("Left-click a target tile,\nor right-click to cancel.",
                                new Core.Position(wearer.pos.x, wearer.pos.y), this._range, this._radius).then(
                                    (pos: Core.Position) => {
                                        resolve(this.onTileSelected(pos));
                                    });
                        }
                    });
                }
                break;
            default :
                break;
        }
        return new Promise<Actor[]>((resolve) =>  {
            resolve(selectedTargets);
        });
    }

    /**
     * Function: onTileSelected
     * Populates the __selectedTargets field for selection methods that require a tile selection
     */
    public onTileSelected(pos: Core.Position): Actor[] {
        switch (this._method) {
            case TargetSelectionMethodEnum.SELECTED_ACTOR:
                return Actor.list.filter((actor: Actor) => actor.pos.equals(pos) && actor.isA("creature[s]"));
            case TargetSelectionMethodEnum.SELECTED_RANGE:
                return Actor.list.filter((actor: Actor) => actor.isA("creature[s]")
                    && Core.Position.distance(pos, actor.pos) < this._radius);
            default: break;
        }
        return [];
    }
}

/**
 * =============================================================================
 * Group: effects
 * =============================================================================
 */

/**
 * Interface: IEffect
 * Some effect that can be applied to actors. The effect might be triggered by using an item or casting a spell.
 */
export interface IEffect {
    /**
     * Function: applyTo
     * Apply an effect to an actor
     * Parameters:
     * actor - the actor this effect is applied to
     * coef - a multiplicator to apply to the effect
     * Returns:
     * false if effect cannot be applied
     */
    applyTo(actor: Actor, coef: number): boolean;
}

/**
 * Class: InstantHealthEffect
 * Add or remove health points.
 */
export class InstantHealthEffect implements IEffect {
    private _amount: number = 0;
    private canResurrect: boolean = false;
    private successMessage: string|undefined;
    private failureMessage: string|undefined;

    get amount() { return this._amount; }

    constructor(def: IInstantHealthEffectDef) {
        if ( def ) {
            this._amount = def.amount;
            this.successMessage = def.successMessage;
            this.failureMessage = def.failureMessage;
            if ( def.canResurrect !== undefined ) {
                this.canResurrect = def.canResurrect;
            }
        }
    }

    public applyTo(actor: Actor, coef: number = 1.0): boolean {
        if (!actor.destructible) {
            return false;
        }
        if (this._amount > 0) {
            if (this.canResurrect || !  actor.destructible.isDead()) {
            return this.applyHealingEffectTo(actor, coef);
            }
        }
        return this.applyWoundingEffectTo(actor, coef);
    }

    private applyHealingEffectTo(actor: Actor, coef: number = 1.0): boolean {
        let healPointsCount: number = actor.destructible.heal(actor, coef * this._amount);
        let wearer: Actor|undefined = actor.getWearer();
        let result: boolean = false;
        if (healPointsCount > 0 && this.successMessage) {
            Umbra.logger.info(transformMessage(this.successMessage, actor, wearer, healPointsCount));
            result = true;
        } else if (healPointsCount <= 0 && this.failureMessage) {
            Umbra.logger.info(transformMessage(this.failureMessage, actor));
        }
        return result;
    }

    private applyWoundingEffectTo(actor: Actor, coef: number = 1.0): boolean {
        let realDefense: number = actor.destructible.computeRealDefense(actor);
        let damageDealt = -this._amount * coef - realDefense;
        let wearer: Actor|undefined = actor.getWearer();
        if (damageDealt > 0 && this.successMessage) {
            Umbra.logger.info(transformMessage(this.successMessage, actor, wearer, damageDealt));
        } else if (damageDealt <= 0 && this.failureMessage) {
            Umbra.logger.info(transformMessage(this.failureMessage, actor, wearer));
        }
        return actor.destructible.takeDamage(actor, -this._amount * coef) > 0;
    }
}

/**
 * Class: TeleportEffect
 * Teleport the target at a random location.
 */
export class TeleportEffect implements IEffect {
    private successMessage: string|undefined;

    constructor(successMessage?: string) {
        this.successMessage = successMessage;
    }

   public applyTo(actor: Actor, _coef: number = 1.0): boolean {
        let x: number;
        let y: number;
        [x, y] = Map.Map.current.findRandomWamlkableCell();
        actor.moveTo(x, y);
        if (this.successMessage) {
            Umbra.logger.info(transformMessage(this.successMessage, actor));
        }
        return true;
    }
}

/**
 * class: EventEffect
 * Sends an event
 */
export class EventEffect implements IEffect {
    private eventType: string;
    private eventData: any;
    constructor(def: IEventEffectDef) {
        if ( def ) {
            this.eventType = def.eventType;
            this.eventData = def.eventData;
        }
    }

    public applyTo(_actor: Actor, _coef: number = 1.0): boolean {
        Umbra.EventManager.publishEvent(this.eventType, this.eventData);
        return true;
    }
}

/**
 * Class: ConditionEffect
 * Add a condition to an actor.
 */
export class ConditionEffect implements IEffect {
    private conditionDef: IConditionDef;
    private message: string|undefined;
    constructor(def: IConditionDef, message?: string) {
        this.message = message;
        this.conditionDef = def;
    }

    public applyTo(actor: Actor, _coef: number = 1.0): boolean {
        if (!actor.ai) {
            return false;
        }
        actor.ai.addCondition(Condition.create(this.conditionDef), actor);
        if (this.message) {
            Umbra.logger.info(transformMessage(this.message, actor));
        }
        return true;
    }
}

export class MapRevealEffect implements IEffect {
    public applyTo(actor: Actor, _coef: number = 1.0): boolean {
        if (actor === Actor.specialActors[SpecialActorsEnum.PLAYER]) {
            Map.Map.current.reveal();
            return true;
        }
        return false;
    }
}

/**
 * Class: Effector
 * Combines an effect and a target selector. Can also display a message before applying the effect.
 */
export class Effector {
    private _effect: IEffect;
    private targetSelector: TargetSelector;
    private message: string|undefined;
    private _coef: number;
    private destroyOnEffect: boolean;

    get effect() { return this._effect; }
    get coef() { return this._coef; }

    constructor(_effect: IEffect, _targetSelector: TargetSelector, _message?: string,
                destroyOnEffect: boolean = false) {
        this._effect = _effect;
        this.targetSelector = _targetSelector;
        this.message = _message;
        this.destroyOnEffect = destroyOnEffect;
    }

    /**
     * Function: apply
     * Select targets and apply the effect.
     * Returns:
     * false if a tile needs to be selected (in that case, wait for TILE_SELECTED event, then call <applyOnPos>)
     */
    public apply(owner: Actor, wearer: Actor, cellPos?: Core.Position, coef: number = 1.0): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            this._coef = coef;
            this.targetSelector.selectTargets(owner, wearer, cellPos).then((targets: Actor[]) => {
                this.applyEffectToActorList(owner, wearer, targets);
                resolve(targets.length > 0);
            });
        });
    }

    private applyEffectToActorList(owner: Actor, wearer: Actor, actors: Actor[]) {
        let success: boolean = false;
        if (this.message) {
            Umbra.logger.info(transformMessage(this.message, wearer));
        }

        for (let actor of actors) {
            if (this._effect.applyTo(actor, this._coef)) {
                success = true;
            }
        }
        if (this.destroyOnEffect && success && wearer && wearer.container) {
            owner.destroy();
        }
    }
}
