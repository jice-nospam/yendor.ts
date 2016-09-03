/**
	Section: effects
*/
import * as Core from "../core/main";
import * as Yendor from "../yendor/main";
import * as Umbra from "../umbra/main";
import * as Map from "../map/main";
import {Actor, SpecialActors} from "./actor";
import {TargetSelectionMethod, TargetSelectorDef, InstantHealthEffectDef, ConditionDef, EventEffectDef} from "./actor_def";
import {transformMessage} from "./base";
import {Condition} from "./actor_condition";

/********************************************************************************
 * Group: target selection
 ********************************************************************************/
export interface TilePicker {
    pickATile(message: string, origin?: Core.Position, range?: number, radius?: number): Promise<Core.Position>;
}

/**
    Class: TargetSelector
    Various ways to select actors
*/
export class TargetSelector implements Core.Persistent {
    private _method: TargetSelectionMethod;
    private actorType: string;
    private _range: number;
    private _radius: number;

    constructor(def: TargetSelectorDef) {
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
    selectTargets(owner: Actor, wearer: Actor, cellPos: Core.Position): Promise<Actor[]> {
        let selectedTargets: Actor[] = [];
        switch (this._method) {
            // synchronous cases
            case TargetSelectionMethod.WEARER:
                selectedTargets.push(wearer);
                break;
            case TargetSelectionMethod.ACTOR_ON_CELL:
                selectedTargets = Actor.list.filter((actor: Actor) => actor.pos.equals(cellPos) && actor.isA("creature"));
                break;
            case TargetSelectionMethod.CLOSEST_ENEMY:
                let actor = Actor.findClosestEnemy(cellPos ? cellPos : wearer.pos, this.range);
                if (actor) {
                    selectedTargets.push(actor);
                }
                break;
            case TargetSelectionMethod.ACTORS_IN_RANGE:
                selectedTargets = Actor.list.filter((actor: Actor) =>
                    actor.isA("creature")
                    && Core.Position.distance(cellPos ? cellPos : wearer.pos, actor.pos) < this.range
                );
                break;
            // asynchronous cases
            case TargetSelectionMethod.WEARER_INVENTORY:
                // check if there's only one corresponding target
                if ( !wearer.container ) {
                    break;
                }
                for (let i: number = 0, len: number = wearer.container.size(); i < len; ++i) {
                    let actor: Actor = wearer.container.get(i);
                    if (!this.actorType || actor.isA(this.actorType)) {
                        selectedTargets.push(actor);
                    }
                }
                if ( selectedTargets.length === 1 ) {
                    // auto-select item when there's only one corresponding.
                    break;
                } else {
                    // player must select an actor from his inventory.
                    selectedTargets = [];
                    if ( wearer.ai && wearer.ai.inventoryItemPicker) {
                        return new Promise<Actor[]>((resolve) => {
                            wearer.ai.inventoryItemPicker.pickItemFromInventory("select an item", wearer, this.actorType).then((item: Actor) => {
                                selectedTargets.push(item);
                                resolve(selectedTargets);
                            });
                        });
                    }
                }
                break;
            case TargetSelectionMethod.SELECTED_ACTOR:
                if (wearer.ai && wearer.ai.tilePicker) {
                    return new Promise<Actor[]>((resolve) => {
                        wearer.ai.tilePicker.pickATile("Left-click a target creature,\nor right-click to cancel.", new Core.Position(wearer.pos.x, wearer.pos.y),
                            this._range, this._radius).then((pos: Core.Position) => {
                            resolve(this.onTileSelected(pos));
                        });
                    });
                }
                break;
            case TargetSelectionMethod.SELECTED_RANGE:
                if ( wearer.ai && wearer.ai.tilePicker ) {
                    return new Promise<Actor[]>((resolve) => {
                        wearer.ai.tilePicker.pickATile("Left-click a target tile,\nor right-click to cancel.", new Core.Position(wearer.pos.x, wearer.pos.y), this._range, this._radius).then((pos: Core.Position) => {
                            resolve(this.onTileSelected(pos));
                        });
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
        Function: onTileSelected
        Populates the __selectedTargets field for selection methods that require a tile selection
    */
    onTileSelected(pos: Core.Position): Actor[] {
        switch (this._method) {
            case TargetSelectionMethod.SELECTED_ACTOR:
                return Actor.list.filter((actor: Actor) => actor.pos.equals(pos) && actor.isA("creature"));
            case TargetSelectionMethod.SELECTED_RANGE:
                return Actor.list.filter((actor: Actor) => actor.isA("creature") && Core.Position.distance(pos, actor.pos) < this._radius);
        }
        return [];
    }
}

/********************************************************************************
 * Group: effects
 ********************************************************************************/

/**
    Interface: Effect
    Some effect that can be applied to actors. The effect might be triggered by using an item or casting a spell.
*/
export interface Effect extends Core.Persistent {
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
    private _amount: number = 0;
    private canResurrect: boolean = false;
    private successMessage: string;
    private failureMessage: string;

    get amount() { return this._amount; }

    constructor(def: InstantHealthEffectDef) {
        if ( def ) {
            this._amount = def.amount;
            this.successMessage = def.successMessage;
            this.failureMessage = def.failureMessage;
            if ( def.canResurrect !== undefined ) {
                this.canResurrect = def.canResurrect;
            }
        }
    }

    applyTo(actor: Actor, coef: number = 1.0): boolean {
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
        let wearer: Actor = actor.getWearer();
        if (healPointsCount > 0 && this.successMessage) {
            Umbra.logger.info(transformMessage(this.successMessage, actor, wearer, healPointsCount));
        } else if (healPointsCount <= 0 && this.failureMessage) {
            Umbra.logger.info(transformMessage(this.failureMessage, actor));
        }
        return true;
    }

    private applyWoundingEffectTo(actor: Actor, coef: number = 1.0): boolean {
        let realDefense: number = actor.destructible.computeRealDefense(actor);
        let damageDealt = -this._amount * coef - realDefense;
        let wearer: Actor = actor.getWearer();
        if (damageDealt > 0 && this.successMessage) {
            Umbra.logger.info(transformMessage(this.successMessage, actor, wearer, damageDealt));
        } else if (damageDealt <= 0 && this.failureMessage) {
            Umbra.logger.info(transformMessage(this.failureMessage, actor, wearer));
        }
        return actor.destructible.takeDamage(actor, -this._amount * coef) > 0;
    }
}

/**
    Class: TeleportEffect
    Teleport the target at a random location.
*/
export class TeleportEffect implements Effect {
    private successMessage: string;

    constructor(successMessage?: string) {
        this.successMessage = successMessage;
    }

    applyTo(actor: Actor, coef: number = 1.0): boolean {
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
export class EventEffect implements Effect {
    private eventType: string;
    private eventData: any;
    constructor(def: EventEffectDef) {
        if ( def ) {
            this.eventType = def.eventType;
            this.eventData = def.eventData;
        }
    }

    applyTo(actor: Actor, coef: number = 1.0): boolean {
        Umbra.EventManager.publishEvent(this.eventType, this.eventData);
        return true;
    }
}

/**
    Class: ConditionEffect
    Add a condition to an actor.
*/
export class ConditionEffect implements Effect {
    conditionDef: ConditionDef;
    private message: string;
    constructor(def: ConditionDef, message?: string) {
        this.message = message;
        this.conditionDef = def;
    }

    applyTo(actor: Actor, coef: number = 1.0): boolean {
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

export class MapRevealEffect implements Effect {
    applyTo(actor: Actor, coef: number = 1.0): boolean {
        if (actor === Actor.specialActors[SpecialActors.PLAYER]) {
            Map.Map.current.reveal();
            return true;
        }
        return false;
    }
}

/**
    Class: Effector
    Combines an effect and a target selector. Can also display a message before applying the effect.
*/
export class Effector implements Core.Persistent {
    private _effect: Effect;
    private targetSelector: TargetSelector;
    private message: string;
    private _coef: number;
    private destroyOnEffect: boolean;

    get effect() { return this._effect; }
    get coef() { return this._coef; }

    constructor(_effect?: Effect, _targetSelector?: TargetSelector, _message?: string, destroyOnEffect: boolean = false) {
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
    apply(owner: Actor, wearer: Actor, cellPos?: Core.Position, coef: number = 1.0): Promise<boolean> {
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

        for (let i: number = 0, len: number = actors.length; i < len; ++i) {
            if (this._effect.applyTo(actors[i], this._coef)) {
                success = true;
            }
        }
        if (this.destroyOnEffect && success && wearer && wearer.container) {
            owner.destroy();
        }
    }
}
