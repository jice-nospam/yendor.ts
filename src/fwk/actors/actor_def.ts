/*
	Section: actors
*/
import * as Core from "../core/main";

/********************************************************************************
 * Group: actor definitions
 ********************************************************************************/

export interface ActorDef {
    ch?: string;
    color?: Core.Color;
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
    pickable?: PickableDef;
    destructible?: DestructibleDef;
    attacker?: AttackerDef;
    ai?: AiDef;
    light?: LightDef;
    equipment?: EquipmentDef;
    ranged?: RangedDef;
    magic?: MagicDef;
    activable?: ActivableDef | DoorDef;
    xpHolder?: XpHolderDef;
    container?: ContainerDef;
}

/**
    Interface: PickableDef
    Somethind that can be picked/dropped/thrown by the player
*/
export interface PickableDef {
    weight: number;
    destroyedWhenThrown?: boolean;
    onUseEffector?: EffectorDef;
    onThrowEffector?: EffectorDef;
}

export interface EffectorDef {
    effect: EffectDef;
    targetSelector: TargetSelectorDef;
    message?: string;
    destroyOnEffect: boolean;
}

export enum EffectType {
    INSTANT_HEALTH, // => InstantHealthEffectDef
    TELEPORT, // => TeleportEffectDef
    CONDITION, // => ConditionEffectDef
    MAP_REVEAL, // => no data
    EVENT, // => EventEffectDef
}

export interface EffectDef {
    type: EffectType;
    data?: InstantHealthEffectDef | TeleportEffectDef | ConditionEffectDef | EventEffectDef;
}

export interface EventEffectDef {
    eventType: string;
    eventData: any;
}

export interface InstantHealthEffectDef {
    amount: number;
    /** does this effect also work on deads (defult : false) */
    canResurrect?: boolean;
    /** message if effect succeded. actor1 = this actor. actor2 = the wearer */
    successMessage?: string;
    /** message if effect failed. actor1 = this actor. actor2 = the wearer */
    failureMessage?: string;
}

export interface TeleportEffectDef {
    successMessage: string;
}

/**
    enum: ActivableType
    What type of feature to create
    SINGLE - Activable
    DOOR - Door
    TOGGLE - Lever
    */
export enum ActivableType {
    /** activates every time you use it (for example press button) */
    SINGLE,
    DOOR,
    /** two positions (for example toggle button) */
    TOGGLE,
    LEVER
}

/**
 * enum: ActivableDef
 * Something that can be turned on and off.
 */
export interface ActivableDef {
    type: ActivableType;
    activateMessage?: string;
    deactivateMessage?: string;
    activeByDefault?: boolean;
    onActivateEffector?: EffectorDef;
}

export interface DoorDef extends ActivableDef {
    seeThrough: boolean;
}

/*
    Enum: ConditionType

    CONFUSED - moves randomly and attacks anything on path
    STUNNED - don't move or attack, then get confused
    HEALTH_VARIATION - regain/lose {amount} health points over time
    OVERENCUMBERED - walk slower. This also affects all actions relying on walkTime.
    DETECT_LIFE - detect living creatures at {range} distance
*/

export const enum ConditionType {
    CONFUSED,
    STUNNED,
    FROZEN,
    HEALTH_VARIATION,
    OVERENCUMBERED,
    DETECT_LIFE,
}

export interface ConditionDef {
    type: ConditionType;
    /** use 0 for infinite condition */
    nbTurns: number;
    amount?: number;
    range?: number;
    /** don't display this condition on UI */
    noDisplay?: boolean;
    /** for activable items */
    onlyIfActive?: boolean;
    /** to override the condition's default name */
    name?: string;
}

export interface ConditionEffectDef {
    condition: ConditionDef;
    successMessage: string;
}

/**
    Enum: TargetSelectionMethod
    Define how we select the actors that are impacted by an effect.

    WEARER - the actor containing this actor
    WEARER_INVENTORY - an actor from the wearer's inventory. Can be filtered with actorType
    ACTOR_ON_CELL - whatever actor is on the selected cell
    CLOSEST_ENEMY - the closest non player creature
    SELECTED_ACTOR - an actor manually selected
    ACTORS_RANGE - all actors close to the cell
    SELECTED_RANGE - all actors close to a manually selected position
*/
export const enum TargetSelectionMethod {
    WEARER,
    WEARER_INVENTORY,
    ACTOR_ON_CELL,
    CLOSEST_ENEMY,
    SELECTED_ACTOR,
    ACTORS_IN_RANGE,
    SELECTED_RANGE
}

export interface TargetSelectorDef {
    method: TargetSelectionMethod;
    actorType?: string;
    range?: number;
    radius?: number;
}

export interface DestructibleDef {
    healthPoints: number;
    /** can use actor1 = the actor owning this destructible and actor2 = the actor wearing actor1 */
    deathMessage?: string;
    defense?: number;
    /** if no corpse name, actor is destroyed when healthPoints reach 0 */
    corpseName?: string;
    corpseChar?: string;
    xp?: number;
}

export interface AttackerDef {
    hitPoints: number;
    attackTime: number;
}


export enum AiType {
    ITEM,
    MONSTER,
    PLAYER,
}

export interface AiDef {
    type: AiType;
    walkTime: number;
    conditions?: ConditionDef[];
}

export interface XpHolderDef {
    baseLevel: number;
    newLevel: number;
}

/*
    Enum: LightFalloffType
    How does the light intensity decrease along distance.
    See http://roguecentral.org/doryen/articles/lights-in-full-color-roguelikes

    LINEAR - faster. Decreases linearly. Small penumbra zone
    NORMAL - improved inverse square. medium penumbra zone
    INVERSE_SQUARE - raw inverse square. big penumbra zone
*/
export enum LightFalloffType {
    LINEAR,
    NORMAL,
    INVERSE_SQUARE
}

export enum LightRenderMode {
    ADDITIVE,
    MAX
}

export interface LightDef {
    renderMode: LightRenderMode;
    color: Core.Color;
    range: number;
    falloffType: LightFalloffType;
    /**
        Field: intensityVariationPattern
        A string containing numbers 0 to 9 giving the intensity variation curve, or "noise" for a curve computed from a 1D noise
    */
    intensityVariationPattern?: string;
    /**
        Field: intensityVariationRange
        Percentage of intensity removed when intensityVariationPattern === "0".
    */
    intensityVariationRange?: number;
    /**
        Field: intensityVariationLength
        delay corresponding to the intensityVariationPattern in milliseconds.
    */
    intensityVariationLength?: number;
}

export type EquipmentSlot = "right hand"|"left hand"|"hands"|"quiver";

export interface EquipmentDef {
    slot: EquipmentSlot;
    defense?: number;
}

export interface RangedDef {
    damageCoef: number;
    projectileType: string;
    loadTime: number;
    range: number;
}

export interface MagicDef {
    charges: number;
    onFireEffect: EffectorDef;
}

export interface ContainerDef {
    capacity: number;
}
