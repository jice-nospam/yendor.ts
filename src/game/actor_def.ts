/*
	Section: actors
*/
module Game {
    "use strict";
	/********************************************************************************
	 * Group: actor definitions
	 ********************************************************************************/
    
    export interface ActorDef {
        ch?: string;
        color?: Core.Color;
        classes?: string[];
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
        INSTANT_HEALTH,
        TELEPORT,
        CONDITION,
        MAP_REVEAL,
    }

    export interface EffectDef {
        type: EffectType;
        data?: InstantHealthEffectDef | TeleportEffectDef | ConditionEffectDef;
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
        NORMAL - Activable
        DOOR - Door
        LEVER - Lever
     */
    export enum ActivableType {
        NORMAL,
        DOOR,
        LEVER
    }
    
    export interface ActivableDef {
        type: ActivableType;
        activateMessage?: string;
        deactivateMessage?: string;
        activeByDefault?: boolean;
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
    
    export let actorDefs: { [index: string]: ActorDef } = {
        "creature" : {
            blockWalk: true,                        
        },
        "beast": {
            classes:["creature"]
        },
        "goblin": {
            ch: "g",
            color: 0x3F7F3F,
            classes: ["beast"],
            ai: { type: AiType.MONSTER, walkTime: 4 },
            destructible: { corpseName: "goblin corpse", corpseChar:"%", defense: 0, healthPoints: 3, xp: 10 },
            attacker: { attackTime: 4, hitPoints: 1 }
        },
        "orc": {
            ch: "o",
            color: 0x3F7F3F,
            classes: ["beast"],
            ai: { type: AiType.MONSTER, walkTime: 5 },
            destructible: { corpseName: "dead orc", corpseChar:"%", defense: 0, healthPoints: 9, xp: 35 },
            attacker: { attackTime: 5, hitPoints: 2 }
        },
        "troll": {
            ch: "T",
            color: 0x007F00,
            classes: ["beast"],
            blockSight: true,
            ai: { type: AiType.MONSTER, walkTime: 6 },
            destructible: { corpseName: "troll carcass", corpseChar:"%", defense: 1, healthPoints: 15, xp: 100 },
            attacker: { attackTime: 6, hitPoints: 3 }
        },
        "human": {
            classes:["creature"]
        },
        "player": {
            ch: "@",
            color: 0xFFFFFF,
            classes: ["human"],
            blockWalk: false,
            ai: { type: AiType.PLAYER, walkTime: Constants.PLAYER_WALK_TIME},
            attacker: { hitPoints: 3, attackTime: Constants.PLAYER_WALK_TIME },
            destructible: { healthPoints:30, defense:0, corpseName:"your cadaver", corpseChar:"%" },
            xpHolder: {baseLevel: Constants.XP_BASE_LEVEL, newLevel: Constants.XP_NEW_LEVEL},
            container: { capacity: 20 },
            light: {renderMode: LightRenderMode.MAX, color: Constants.NOLIGHT_COLOR, falloffType: LightFalloffType.NORMAL, range: 3}
        },
        "item":{  
        },
        "flask": {
            ch: "!",
            classes: ["item"],
        },
        "oil flask": {
          color: Constants.OIL_FLASK_COLOR,
          classes: ["flask"],
          pickable: {
                weight: 1,
                onUseEffector: {
                    destroyOnEffect: true,
                    targetSelector: { method: TargetSelectionMethod.WEARER_INVENTORY, actorType: "lantern" },
                    effect: {
                        type: EffectType.INSTANT_HEALTH,
                        data: {
                            amount: 200,
                            canResurrect: true,
                            successMessage:"[The actor2] refill[s2] [its2] lantern."
                        }
                    }
                },                
          }
        },
        "health potion": {
            color: Constants.HEALTH_POTION_COLOR,
            classes: ["flask"],
            pickable: {
                weight: 0.5,
                destroyedWhenThrown: true,
                onUseEffector: {
                    destroyOnEffect: true,
                    targetSelector: { method: TargetSelectionMethod.WEARER },
                    effect: {
                        type: EffectType.INSTANT_HEALTH,
                        data: {
                            amount: 5,
                            successMessage: "[The actor1] drink[s] the health potion and regain[s] [value1] hit points.",
                            failureMessage: "[The actor1] drink[s] the health potion but it has no effect"
                        }
                    }
                },
                onThrowEffector: {
                    destroyOnEffect: true,
                    targetSelector: { method: TargetSelectionMethod.SELECTED_RANGE, radius: 1 },
                    effect: {
                        type: EffectType.INSTANT_HEALTH,
                        data: {
                            amount: 3,
                            successMessage: "The potion explodes on [the actor1], healing [it] for [value1] hit points.",
                            failureMessage: "The potion explodes on [the actor1] but it has no effect"
                        }
                    }
                }
            }
        },
        "regeneration potion": {
            color: Constants.HEALTH_POTION_COLOR,
            classes: ["flask"],
            pickable: {
                weight: 0.5,
                destroyedWhenThrown: true,
                onUseEffector: {
                    destroyOnEffect: true,
                    targetSelector: { method: TargetSelectionMethod.WEARER },
                    effect: {
                        type: EffectType.CONDITION,
                        data: {
                            condition: {
                                type: ConditionType.HEALTH_VARIATION,
                                name:"regeneration",
                                nbTurns: 20,
                                amount: 10
                            },
                            successMessage: "[The actor1] drink[s] the regeneration potion and feel[s]\nthe life flowing through [it].",
                        }
                    }
                },
                onThrowEffector: {
                    destroyOnEffect: true,
                    targetSelector: { method: TargetSelectionMethod.SELECTED_RANGE, radius: 1 },
                    effect: {
                        type: EffectType.CONDITION,
                        data: {
                            condition: {
                                type: ConditionType.HEALTH_VARIATION,
                                name:"regeneration",
                                nbTurns: 12,
                                amount: 6
                            },
                            successMessage: "The potion explodes on [the actor1].\nLife is flowing through [it].",
                        }
                    }
                }
            }
        },
        "scroll": {
              ch: "#",
              color: Constants.PAPER_COLOR,
              classes: ["item"]
        },
        "scroll of lightning bolt": {
            classes:["scroll"],
            pickable: {
                weight: 0.1,
                onUseEffector: {
                    destroyOnEffect: true,
                    targetSelector: { method: TargetSelectionMethod.CLOSEST_ENEMY, range: 5 },
                    effect: {
                        type: EffectType.INSTANT_HEALTH,
                        data: {
                            amount: -20,
                            successMessage: "A lightning bolt strikes [the actor1] with a loud thunder!\nThe damage is [value1] hit points."
                        }
                    }
                },
            }
        },
        "scroll of fireball": {
            classes:["scroll"],
            pickable: {
                weight: 0.1,
                onUseEffector: {
                    destroyOnEffect: true,
                    targetSelector: { method: TargetSelectionMethod.SELECTED_RANGE, range: 10, radius: 3 },
                    message: "A fireball explodes, burning everything within 3 tiles.",
                    effect: {
                        type: EffectType.INSTANT_HEALTH,
                        data: {
                            amount: -12,
                            successMessage: "[The actor1] get[s] burned for [value1] hit points."
                        }
                    }
                },
            }
        },
        "scroll of confusion": {
            classes:["scroll"],
            pickable: {
                weight: 0.1,
                onUseEffector: {
                    destroyOnEffect: true,
                    targetSelector: { method: TargetSelectionMethod.SELECTED_ACTOR, range: 5 },
                    effect: {
                        type: EffectType.CONDITION,
                        data: {
                            condition: {
                                type: ConditionType.CONFUSED,
                                nbTurns: 12,
                            },
                            successMessage: "[The actor1's] eyes look vacant,\nas [it] start[s] to stumble around!"
                        }
                    }
                },
            }
        },
        "light": {
          ch: "/",
          classes:["item"],
          activable: { type: ActivableType.NORMAL, activateMessage:"[The actor1] is on.", deactivateMessage:"[The actor1] is off."  }
        },
        "pickableLight": {
          classes:["light"],  
          equipment: { slot:"left hand" },
        },
        "candle": {
            color: Constants.BONE_COLOR,
            classes:["pickableLight"],
            pickable: { weight: 0.5 },
            light: {
                renderMode: LightRenderMode.MAX,
                color: Constants.CANDLE_LIGHT_COLOR, falloffType: LightFalloffType.NORMAL, range: 8,
                intensityVariationLength: 200, intensityVariationRange: 0.25, intensityVariationPattern:"noise" 
            },
            destructible: {
                healthPoints: 160,
                deathMessage: "[The actor2's] candle has burnt away"
            },
            ai: { 
                type: AiType.ITEM,
                walkTime: Constants.PLAYER_WALK_TIME,
                conditions: [{
                    type: ConditionType.HEALTH_VARIATION,
                    nbTurns: 0,
                    amount: -1,
                    noDisplay: true,
                    onlyIfActive: true
                }]
            }
        },
        "torch": {
            color: Constants.WOOD_COLOR,
            classes:["pickableLight"],
            pickable: { weight: 0.5 },
            light: {
                renderMode: LightRenderMode.MAX,
                color: Constants.TORCH_LIGHT_COLOR, falloffType: LightFalloffType.LINEAR, range: 9,
                intensityVariationLength: 300, intensityVariationRange: 0.15, intensityVariationPattern:"noise"
            },
            destructible: {
                healthPoints: 240,
                deathMessage: "[The actor2's] torch has burnt away"
            },
            ai: { 
                type: AiType.ITEM,
                walkTime: Constants.PLAYER_WALK_TIME,
                conditions: [{
                    type: ConditionType.HEALTH_VARIATION,
                    nbTurns: 0,
                    amount: -1,
                    noDisplay: true,
                    onlyIfActive: true
                }]
            }
        },
        "lantern": {
            color: Constants.WOOD_COLOR,
            classes:["pickableLight"],
            pickable: { weight: 1 },
            light: {
                renderMode: LightRenderMode.MAX,
                color: Constants.TORCH_LIGHT_COLOR, falloffType: LightFalloffType.LINEAR, range: 12,
                intensityVariationLength: 500, intensityVariationRange: 0.1, intensityVariationPattern:"noise"
            },
            destructible: {
                healthPoints: 500,
                deathMessage: "[The actor2's] lantern is empty.",
                // same name to avoid item destruction
                corpseName: "lantern"
            },
            ai: { 
                type: AiType.ITEM,
                walkTime: Constants.PLAYER_WALK_TIME,
                conditions: [{
                    type: ConditionType.HEALTH_VARIATION,
                    nbTurns: 0,
                    amount: -1,
                    noDisplay: true,
                    onlyIfActive: true
                }]
            }
        },        
        "wall torch": {
            color: Constants.WOOD_COLOR,
            classes:["light"],
            wallActor: true,
            displayOutOfFov: true,
            light: {
                renderMode: LightRenderMode.MAX,
                color: Constants.TORCH_LIGHT_COLOR, falloffType: LightFalloffType.LINEAR, range: 18,
                intensityVariationLength: 300, intensityVariationRange: 0.15, intensityVariationPattern:"noise"
            },
            activable: { type:ActivableType.NORMAL, activeByDefault: true }
        },        
        "weapon": {
            classes:["item"]
        },
        "blade": {
            classes:["weapon"]  
        },
        "short sword": {
            ch: "/",
            classes:["blade"],
            color: Constants.STEEL_COLOR,
            pickable: { weight: 2,
            onThrowEffector: {
                    destroyOnEffect: false,
                    targetSelector: { method: TargetSelectionMethod.ACTOR_ON_CELL },
                    effect: {
                        type: EffectType.INSTANT_HEALTH,
                        data: {
                            amount: -4,
                            successMessage: "The sword hits [the actor1] for [value1] hit points."
                        }
                    }
                }                
            },
            attacker: { attackTime: 4, hitPoints: 4 },
            equipment: { slot:"right hand" }
        },
        "longsword": {
            ch: "/",
            classes:["blade"],
            color: Constants.STEEL_COLOR,
            pickable: { weight: 3,
            onThrowEffector: {
                    destroyOnEffect: false,
                    targetSelector: { method: TargetSelectionMethod.ACTOR_ON_CELL },
                    effect: {
                        type: EffectType.INSTANT_HEALTH,
                        data: {
                            amount: -6,
                            successMessage: "The sword hits [the actor1] for [value1] hit points."
                        }
                    }
                }                
            },
            attacker: { attackTime: 5, hitPoints: 6 },
            equipment: { slot:"right hand" }
        },
        "greatsword": {
            ch: "/",
            classes:["blade"],
            color: Constants.STEEL_COLOR,
            pickable: { weight: 4,
                onThrowEffector: {
                    destroyOnEffect: false,
                    targetSelector: { method: TargetSelectionMethod.ACTOR_ON_CELL },
                    effect: {
                        type: EffectType.INSTANT_HEALTH,
                        data: {
                            amount: -10,
                            successMessage: "The sword hits [the actor1] for [value1] hit points."
                        }
                    }
                }                
            },
            attacker: { attackTime: 6, hitPoints: 10 },
            equipment: { slot:"hands" }
        },
        "shield": {
            ch: "[",
            classes:["weapon"],
            pickable: { weight: 5,
                onThrowEffector: {
                    destroyOnEffect: false,
                    targetSelector: { method: TargetSelectionMethod.ACTOR_ON_CELL },
                    effect: {
                        type: EffectType.CONDITION,
                        data: {
                            condition: {
                                type: ConditionType.STUNNED,
                                nbTurns: 2,
                            },
                            successMessage: "The shield hits [the actor1] and stuns [it]!"
                        }
                    }
                }                
           },
        },
        "wooden shield": {
            classes:["shield"],
            color: Constants.WOOD_COLOR,
            equipment: { slot:"left hand", defense: 1 }
        },
        "iron shield": {
            classes:["shield"],
            color: Constants.IRON_COLOR,
            equipment: { slot:"left hand", defense: 1.5 }
        },
        "projectile": {
            ch:"\\",
            classes:["weapon"],
            equipment: { slot:"quiver" },
        },
        "arrow": {
            classes:["projectile"]
        },
        "bone arrow": {
            color: Constants.BONE_COLOR,
            classes:["arrow"],
            pickable: { weight: 0.1,
                onThrowEffector: {
                    destroyOnEffect: false,
                    targetSelector: { method: TargetSelectionMethod.ACTOR_ON_CELL },
                    effect: {
                        type: EffectType.INSTANT_HEALTH,
                        data: {
                            amount: -1,
                            successMessage: "The arrow hits [the actor1] for [value1] points."
                        }
                    }
                }                                 
            }
        },
        "iron arrow": {
            color: Constants.WOOD_COLOR,
            classes:["arrow"],
            pickable: { weight: 0.1,
                onThrowEffector: {
                    destroyOnEffect: false,
                    targetSelector: { method: TargetSelectionMethod.ACTOR_ON_CELL },
                    effect: {
                        type: EffectType.INSTANT_HEALTH,
                        data: {
                            amount: -1.25,
                            successMessage: "The arrow hits [the actor1] for [value1] points."
                        }
                    }
                }                                 
            }
        },
        "bolt": {
            color: Constants.IRON_COLOR,
            classes:["projectile"],
            pickable: { weight: 0.1,
                onThrowEffector: {
                    destroyOnEffect: false,
                    targetSelector: { method: TargetSelectionMethod.ACTOR_ON_CELL },
                    effect: {
                        type: EffectType.INSTANT_HEALTH,
                        data: {
                            amount: -0.5,
                            successMessage: "The bolt hits [the actor1] for [value1] points."
                        }
                    }
                }                                 
            }
        },             
        "ranged": {
            ch: ")",
            color: Constants.WOOD_COLOR,
            classes:["weapon"],
            pickable: { weight: 2 },
        },
        "short bow": {
            classes:["ranged"],
            equipment: { slot:"hands" },
            ranged: { damageCoef: 4, projectileType: "arrow", loadTime: 4, range: 15 }
        },
        "long bow": {
            classes:["ranged"],
            equipment: { slot:"hands" },
            ranged: { damageCoef: 8, projectileType: "arrow", loadTime: 6, range: 30 }
        },
        "crossbow": {
            classes:["ranged"],
            equipment: { slot:"right hand" },
            ranged: { damageCoef: 8, projectileType: "bolt", loadTime: 5, range: 10 }
        },        
        "wand": {
            ch:"/",
            color: Constants.WOOD_COLOR,
            classes:["weapon"],            
            pickable: { weight: 0.5 },
            equipment: { slot:"right hand" }
        },
        "wand of frost": {
            classes:["wand"],
            magic: {
                charges: 5,
                onFireEffect: {
                    destroyOnEffect: false,
                    targetSelector: { method: TargetSelectionMethod.SELECTED_ACTOR, range: 5 },
                    message:"[The actor1] zap[s] [its] wand.",
                    effect: {
                        type: EffectType.CONDITION,                        
                        data: {
                            condition: {
                                type: ConditionType.FROZEN,
                                nbTurns: 10,
                            },
                            successMessage: "[The actor1] [is] covered with frost."
                        }
                    }
                }
            }
        },            
        "staff": {
            ch:"/",
            color: Constants.WOOD_COLOR,
            classes:["weapon"],
            pickable: { weight: 3 },
            equipment: { slot:"hands" }
        },
        "sunrod": {
            classes:["staff"],
            light: {
                renderMode: LightRenderMode.ADDITIVE,
                color: Constants.SUNROD_LIGHT_COLOR, falloffType: LightFalloffType.LINEAR, range: 15,
                intensityVariationLength: 1300, intensityVariationRange: 0.15, intensityVariationPattern:"0000000111112222333445566677778888899999998888877776665544333222211111"
            },
            activable: { type: ActivableType.NORMAL }              
        },
        "staff of teleportation": {
            classes:["staff"],
            magic: {
                charges: 5,
                onFireEffect: {
                    destroyOnEffect: false,
                    targetSelector: { method: TargetSelectionMethod.SELECTED_ACTOR, range: 5 },
                    message:"[The actor1] zap[s] [its] staff.",
                    effect: {
                        type: EffectType.TELEPORT,                        
                        data: { successMessage: "[The actor1] disappear[s] suddenly." }
                    }
                }
            }
        },            
        "staff of life detection": {
            classes:["staff"],
            magic: {
                charges: 5,
                onFireEffect: {
                    destroyOnEffect: false,
                    targetSelector: { method: TargetSelectionMethod.WEARER },
                    message:"[The actor1] zap[s] [its] staff.",
                    effect: {
                        type: EffectType.CONDITION,                        
                        data: {
                            condition: {
                                type: ConditionType.DETECT_LIFE,
                                nbTurns: 30,
                                range: 15 
                            },
                            successMessage: "[The actor1] [is] aware of life around [it].",
                        }
                    }
                }
            }
        },            
        "staff of mapping": {
            classes:["staff"],
            magic: {
                charges: 5,
                onFireEffect: {
                    destroyOnEffect: false,
                    targetSelector: { method: TargetSelectionMethod.WEARER },
                    message:"[The actor1] zap[s] [its] staff.",
                    effect: {
                        type: EffectType.MAP_REVEAL
                    }
                }
            }
        },
        "key": {
            ch:"p",
            color: Constants.IRON_COLOR,
            classes:["item"],
            pickable: { weight: 0.1 },
        },
        "door": {
            ch:"+",
            displayOutOfFov: true,
            blockWalk: true
        },
        "wooden door": {
            classes:["door"],
            color: Constants.WOOD_COLOR,
            blockSight: true,
            activable: {  type: ActivableType.DOOR, seeThrough: false, activateMessage:"[The actor1] is open", deactivateMessage:"[The actor1] is closed." },
        },
        "iron portcullis": {
            classes:["door"],
            color: Constants.IRON_COLOR,
            blockSight: false,
            activable: {  type: ActivableType.DOOR, seeThrough: true, activateMessage:"[The actor1] is open", deactivateMessage:"[The actor1] is closed." },
        },
        "stairs": {
            color: 0xFFFFFF,
            displayOutOfFov: true,
            plural: true            
        },
        "stairs up": {
            ch:"<",
            classes:["stairs"]
        },        
        "stairs down": {
            ch:">",
            classes:["stairs"]
        },        
    }
}
