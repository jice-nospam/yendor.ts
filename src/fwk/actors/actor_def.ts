/*
	Section: actors
*/
import * as Core from "../core/main";
import { IProbabilityMap } from "./actor";

/**
 * =============================================================================
 * Group: actor definitions
 * =============================================================================
 */

export interface IActorDef {
    ch?: string;
    color?: Core.Color;
    name: string;
    pluralName?: string;
    abstract?: boolean;
    /** can we say "a bag of <thisActorType>" ? */
    containerQualifier?: boolean;
    /** other ActorDefs this one inherits properties from */
    prototypes?: string[];
    /** whether the actor's name is singular or plural */
    plural?: boolean;
    /** can we walk on the cell where the actor is ? */
    blockWalk?: boolean;
    /** this actor is placed on a wall tile (like levers, wall torches, ...) */
    wallActor?: boolean;
    /** can we see through the cell where the actor is ? */
    blockSight?: boolean;
    /** once discovered, should the actor be displayed on map even if out of sight ? */
    displayOutOfFov?: boolean;
    pickable?: IPickableDef;
    destructible?: IDestructibleDef;
    attacker?: IAttackerDef;
    ai?: IAiDef;
    light?: ILightDef;
    equipment?: IEquipmentDef;
    ranged?: IRangedDef;
    magic?: IMagicDef;
    activable?: IActivableDef | IDoorDef;
    xpHolder?: IXpHolderDef;
    container?: IContainerDef;
}

/**
 * Interface: PickableDef
 * Somethind that can be picked/dropped/thrown by the player
 */
export interface IPickableDef {
    weight: number;
    destroyedWhenThrown?: boolean;
    onUseEffector?: IEffectorDef;
    onThrowEffector?: IEffectorDef;
}

export interface IEffectorDef {
    effect: IEffectDef;
    targetSelector: ITargetSelectorDef;
    message?: string;
    destroyOnEffect: boolean;
}

export enum EffectTypeEnum {
    INSTANT_HEALTH = 1, // => InstantHealthEffectDef
    TELEPORT, // => TeleportEffectDef
    CONDITION, // => ConditionEffectDef
    MAP_REVEAL, // => no data
    EVENT, // => EventEffectDef
}

export interface IEffectDef {
    type: EffectTypeEnum;
    /** effect can only affect one actor (arrow) or several (explosion) */
    singleActor?: boolean;
}

export interface IEventEffectDef extends IEffectDef {
    eventType: string;
    eventData: any;
}

export interface IInstantHealthEffectDef extends IEffectDef {
    amount: number;
    /** does this effect also work on deads (defult : false) */
    canResurrect?: boolean;
    /** message if effect succeded. actor1 = this actor. actor2 = the wearer */
    successMessage?: string;
    /** message if effect failed. actor1 = this actor. actor2 = the wearer */
    failureMessage?: string;
}

export interface ITeleportEffectDef extends IEffectDef {
    successMessage: string;
}

/**
 * enum: ActivableTypeEnum
 * What type of feature to create
 * SINGLE - Activable
 * DOOR - Door
 * TOGGLE - levers
 */
export const enum ActivableTypeEnum {
    /** activates every time you use it (for example press button) */
    SINGLE = 1,
    DOOR,
    /** two positions (for example toggle button) */
    TOGGLE,
    LEVER
}

/**
 * interface: IActivableDef
 * Something that can be turned on and off.
 */
export interface IActivableDef {
    type: ActivableTypeEnum;
    activateMessage?: string;
    deactivateMessage?: string;
    activeByDefault?: boolean;
    onActivateEffector?: IEffectorDef;
}

export interface IDoorDef extends IActivableDef {
    seeThrough: boolean;
}

/*
    Enum: ConditionTypeEnum

    CONFUSED - moves randomly and attacks anything on path
    STUNNED - don't move or attack, then get confused
    HEALTH_VARIATION - regain/lose {amount} health points over time
    OVERENCUMBERED - walk slower. This also affects all actions relying on walkTime.
    DETECT_LIFE - detect living creatures at {range} distance
*/

export const enum ConditionTypeEnum {
    CONFUSED = 1,
    STUNNED,
    FROZEN,
    HEALTH_VARIATION,
    OVERENCUMBERED,
    DETECT_LIFE,
}

export interface IConditionDef {
    type: ConditionTypeEnum;
    /** use 0 for infinite condition */
    nbTurns: number;
    amount?: number;
    range?: number;
    /** don't display this condition on UI */
    noDisplay?: boolean;
    /** for activable items */
    onlyIfActive?: boolean;
    /** only display on living creatures (for example confused) */
    noCorpse?: boolean;
    /** to override the condition's default name */
    name?: string;
}

export interface IConditionEffectDef extends IEffectDef {
    condition: IConditionDef;
    successMessage: string;
}

/**
 * Enum: TargetSelectionMethodEnum
 * Define how we select the actors that are impacted by an effect.
 * WEARER - the actor containing this actor
 * WEARER_INVENTORY - an actor from the wearer's inventory. Can be filtered with actorType
 * ACTOR_ON_CELL - whatever actor is on the selected cell
 * CLOSEST_ENEMY - the closest non player creature
 * SELECTED_ACTOR - an actor manually selected
 * ACTORS_RANGE - all actors close to the cell
 * SELECTED_RANGE - all actors close to a manually selected position
 */
export const enum TargetSelectionMethodEnum {
    WEARER = 1,
    WEARER_INVENTORY,
    ACTOR_ON_CELL,
    CLOSEST_ENEMY,
    SELECTED_ACTOR,
    ACTORS_IN_RANGE,
    SELECTED_RANGE
}

export interface ITargetSelectorDef {
    method: TargetSelectionMethodEnum;
    actorType?: string;
    range?: number;
    radius?: number;
}

export interface IDestructibleDef {
    healthPoints?: number;
    /** can use actor1 = the actor owning this destructible and actor2 = the actor wearing actor1 */
    deathMessage?: string;
    defense?: number;
    qualifiers?: string[];
    /** if no corpse name, actor is destroyed when healthPoints reach 0 */
    corpseName?: string;
    corpseChar?: string;
    /** probability for this item to drop loot */
    loot?: IProbabilityMap;
    xp?: number;
}

export interface IAttackerDef {
    hitPoints: number;
    attackTime: number;
}

export enum AiTypeEnum {
    ITEM = 1,
    MONSTER,
    PLAYER,
}

export interface IAiDef {
    type: AiTypeEnum;
    walkTime: number;
    conditions?: IConditionDef[];
    /** name of the behavior tree */
    treeName?: string;
}

export interface IXpHolderDef {
    baseLevel: number;
    newLevel: number;
}

/**
 * Enum: LightFalloffTypeEnum
 * How does the light intensity decrease along distance.
 * See http://roguecentral.org/doryen/articles/lights-in-full-color-roguelikes
 * LINEAR - faster. Decreases linearly. Small penumbra zone
 * NORMAL - improved inverse square. medium penumbra zone
 * INVERSE_SQUARE - raw inverse square. big penumbra zone
 */
export enum LightFalloffTypeEnum {
    LINEAR = 1,
    NORMAL,
    INVERSE_SQUARE
}

export enum LightRenderModeEnum {
    ADDITIVE = 1,
    MAX
}

export interface ILightDef {
    renderMode: LightRenderModeEnum;
    color: Core.Color;
    range: number;
    falloffType: LightFalloffTypeEnum;
    /**
     * Field: intensityVariationPattern
     * A string containing numbers 0 to 9 giving the intensity variation curve,
     * or "noise" for a curve computed from a 1D noise
     */
    intensityVariationPattern?: string;
    /**
     * Field: intensityVariationRange
     * Percentage of intensity removed when intensityVariationPattern === "0".
     */
    intensityVariationRange?: number;
    /**
     * Field: intensityVariationLength
     * delay corresponding to the intensityVariationPattern in milliseconds.
     */
    intensityVariationLength?: number;
}

export interface IEquipmentDef {
    /** list of slots this item can be equipped on */
    slots: string[];
    defense?: number;
}

export interface IRangedDef {
    damageCoef: number;
    projectileType: string;
    loadTime: number;
    range: number;
}

export interface IMagicDef {
    charges: number;
    onFireEffect: IEffectorDef;
}

export interface IContainerDef {
    /** total weight this container can contain */
    capacity: number;
    /** if this container can only contain certain types of items */
    filter?: string[];
    /** list of existing slots in this container */
    slots?: string[];
}
