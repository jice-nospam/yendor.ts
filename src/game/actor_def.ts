/*
	Section: actors
*/
module Game {
    "use strict";
	/********************************************************************************
	 * Group: actor definitions
	 ********************************************************************************/
    export type ActorClass =
        "creature" |
          "beast" |
          "human" |
        "item" |
          "potion" |
          "key" |
          "scroll" |
          "light" |
          "door" |
          "stair" |
          "weapon" |
            "blade" |
            "shield" |
            "ranged" |
            "staff" |
            "projectile" |
              "arrow" |
              "bolt";
    export interface ActorDef {
        ch?: string;
        color?: Core.Color;
        classes?: ActorClass[];
        plural?: boolean;
        blockWalk?: boolean;
        blockSight?: boolean;
        displayOutOfFov?: boolean;
        pickable?: PickableDef;
        destructible?: DestructibleDef;
        attacker?: AttackerDef;
        ai?: AiDef;
        light?: LightDef;
        equipment?: EquipmentDef;
        ranged?: RangedDef;
        magic?: MagicDef;
        door?: DoorDef;
        lever?: LeverDef;
        xpHolder?: XpHolderDef;
        container?: ContainerDef;
    }

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
        successMessage: string;
        failureMessage: string;
    }

    export interface TeleportEffectDef {
        successMessage: string;
    }

    export interface ConditionEffectDef {
        type: ConditionType;
        nbTurns: number;
        successMessage: string;
        additionalArgs?: ConditionAdditionalParam;
    }

    export interface TargetSelectorDef {
        method: TargetSelectionMethod;
        range?: number;
        radius?: number;
    }

    export interface DestructibleDef {
        healthPoints: number;
        defense: number;
        corpseName: string;
        xp?: number;
    }

    export interface AttackerDef {
        hitPoints: number;
        attackTime: number;
    }


    export enum AiType {
        MONSTER,
        PLAYER,
    }

    export interface AiDef {
        type: AiType;
        walkTime: number;
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
        /*
            Field: intensityVariationPattern
            A string containing numbers 0 to 9 giving the intensity variation curve, or "noise" for a curve computed from a 1D noise
        */
        intensityVariationPattern?: string;
        /*
            Field: intensityVariationRange
            Percentage of intensity removed when intensityVariationPattern === "0".
        */
        intensityVariationRange?: number;
        /*
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
        projectileType: ActorClass;
        loadTime: number;
        range: number;        
    }
    
    export interface MagicDef {
        charges: number;
        onFireEffect: EffectorDef;
    }
    
    export interface DoorDef {
        seeThrough: boolean;
    }
    
    export enum LeverAction {
        OPEN_CLOSE_DOOR
    }

    export interface LeverDef {
        action: LeverAction;        
    }
    
    export interface ContainerDef {
        capacity: number;
    }
    
    export var actorDefs: { [index: string]: ActorDef } = {
        "creature": {
            blockWalk: true,            
        },
        "goblin": {
            ch: "g",
            color: 0x3F7F3F,
            classes: ["creature", "beast"],
            ai: { type: AiType.MONSTER, walkTime: 4 },
            destructible: { corpseName: "goblin corpse", defense: 0, healthPoints: 3, xp: 10 },
            attacker: { attackTime: 4, hitPoints: 1 }
        },
        "orc": {
            ch: "o",
            color: 0x3F7F3F,
            classes: ["creature", "beast"],
            ai: { type: AiType.MONSTER, walkTime: 5 },
            destructible: { corpseName: "dead orc", defense: 0, healthPoints: 9, xp: 35 },
            attacker: { attackTime: 5, hitPoints: 2 }
        },
        "troll": {
            ch: "T",
            color: 0x007F00,
            classes: ["creature", "beast"],
            blockSight: true,
            ai: { type: AiType.MONSTER, walkTime: 6 },
            destructible: { corpseName: "troll carcass", defense: 1, healthPoints: 15, xp: 100 },
            attacker: { attackTime: 6, hitPoints: 3 }
        },
        "player": {
            ch: "@",
            color: 0xFFFFFF,
            classes: ["creature", "human"],
            blockWalk: false,
            ai: { type: AiType.PLAYER, walkTime: Constants.PLAYER_WALK_TIME},
            attacker: { hitPoints: 3, attackTime: Constants.PLAYER_WALK_TIME },
            destructible: { healthPoints:30, defense:0, corpseName:"your cadaver" },
            xpHolder: {baseLevel: Constants.XP_BASE_LEVEL, newLevel: Constants.XP_NEW_LEVEL},
            container: { capacity: 20 },
            light: {renderMode: LightRenderMode.MAX, color: Constants.NOLIGHT_COLOR, falloffType: LightFalloffType.NORMAL, range: 3}
        },
        "potion": {
            ch: "!",
            classes: ["item"],
        },
        "health potion": {
            color: 0x800080,
            classes: ["potion"],
            pickable: {
                weight: 0.5,
                onUseEffector: {
                    destroyOnEffect: true,
                    targetSelector: { method: TargetSelectionMethod.ACTOR_ON_CELL },
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
                    targetSelector: { method: TargetSelectionMethod.ACTOR_ON_CELL },
                    effect: {
                        type: EffectType.INSTANT_HEALTH,
                        data: {
                            amount: 5,
                            successMessage: "The potion explodes on [the actor1], healing [it] for [value1] hit points.",
                            failureMessage: "The potion explodes on [the actor1] but it has no effect"
                        }
                    }
                }
            }
        },
        "regeneration potion": {
            color: 0x800080,
            classes: ["potion"],
            pickable: {
                weight: 0.5,
                onUseEffector: {
                    destroyOnEffect: true,
                    targetSelector: { method: TargetSelectionMethod.ACTOR_ON_CELL },
                    effect: {
                        type: EffectType.CONDITION,
                        data: {
                            type: ConditionType.REGENERATION,
                            nbTurns: 20,
                            successMessage: "[The actor1] drink[s] the regeneration potion and feel[s]\nthe life flowing through [it].",
                            additionalArgs: {amount: 10}
                        }
                    }
                },
                onThrowEffector: {
                    destroyOnEffect: true,
                    targetSelector: { method: TargetSelectionMethod.ACTOR_ON_CELL },
                    effect: {
                        type: EffectType.CONDITION,
                        data: {
                            type: ConditionType.REGENERATION,
                            nbTurns: 20,
                            successMessage: "The potion explodes on [the actor1].\nLife is flowing through [it].",
                            additionalArgs: {amount: 10}
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
                            type: ConditionType.CONFUSED,
                            nbTurns: 12,
                            successMessage: "[The actor1's] eyes look vacant,\nas [it] start[s] to stumble around!"
                        }
                    }
                },
            }
        },
        "light": {
          ch: "/",
          classes:["item"],
          equipment: { slot:"left hand" }  
        },
        "candle": {
            color: Constants.BONE_COLOR,
            classes:["light"],
            pickable: { weight: 0.5 },
            light: {
                renderMode: LightRenderMode.ADDITIVE,
                color: Constants.CANDLE_LIGHT_COLOR, falloffType: LightFalloffType.NORMAL, range: 8,
                intensityVariationLength: 200, intensityVariationRange: 0.25, intensityVariationPattern:"noise" 
            }
        },
        "torch": {
            color: Constants.WOOD_COLOR,
            classes:["light"],
            pickable: { weight: 0.5 },
            light: {
                renderMode: LightRenderMode.ADDITIVE,
                color: Constants.TORCH_LIGHT_COLOR, falloffType: LightFalloffType.LINEAR, range: 10,
                intensityVariationLength: 300, intensityVariationRange: 0.15, intensityVariationPattern:"noise"
            }
        },
        "weapon": {
            classes:["item"]
        },
        "short sword": {
            ch: "/",
            classes:["weapon","blade"],
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
            classes:["weapon","blade"],
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
            classes:["weapon","blade"],
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
                            type: ConditionType.STUNNED,
                            nbTurns: 2,
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
        "projectile": {
            ch:"\\",
            classes:["weapon"],
            equipment: { slot:"quiver" },
        },
        "bone arrow": {
            color: Constants.BONE_COLOR,
            classes:["projectile","arrow"],
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
            classes:["projectile","arrow"],
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
        "staff": {
            ch:"/",
            color: Constants.WOOD_COLOR,
            classes:["weapon"],
        },
        "sunrod": {
            classes:["staff"],
            pickable: { weight: 3 },
            equipment: { slot:"hands" },
            light: {
                renderMode: LightRenderMode.ADDITIVE,
                color: Constants.SUNROD_LIGHT_COLOR, falloffType: LightFalloffType.LINEAR, range: 15,
                intensityVariationLength: 1300, intensityVariationRange: 0.15, intensityVariationPattern:"0000000111112222333445566677778888899999998888877776665544333222211111"
            }            
        },
        "wand of frost": {
            classes:["staff"],
            pickable: { weight: 0.5 },
            equipment: { slot:"right hand" },
            magic: {
                charges: 5,
                onFireEffect: {
                    destroyOnEffect: false,
                    targetSelector: { method: TargetSelectionMethod.SELECTED_ACTOR, range: 5 },
                    message:"[The actor1] zap[s] [its] wand.",
                    effect: {
                        type: EffectType.CONDITION,                        
                        data: {
                            type: ConditionType.FROZEN,
                            nbTurns: 10,
                            successMessage: "[The actor1] [is] covered with frost."
                        }
                    }
                }
            }
        },            
        "staff of teleportation": {
            classes:["staff"],
            pickable: { weight: 3 },
            equipment: { slot:"hands" },
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
            pickable: { weight: 3 },
            equipment: { slot:"hands" },
            magic: {
                charges: 5,
                onFireEffect: {
                    destroyOnEffect: false,
                    targetSelector: { method: TargetSelectionMethod.ACTOR_ON_CELL },
                    message:"[The actor1] zap[s] [its] staff.",
                    effect: {
                        type: EffectType.CONDITION,                        
                        data: {
                            type: ConditionType.DETECT_LIFE,
                            nbTurns: 10,
                            successMessage: "[The actor1] [is] aware of life around [it].",
                            additionalArgs: { range: 15 }
                        }
                    }
                }
            }
        },            
        "staff of mapping": {
            classes:["staff"],
            pickable: { weight: 3 },
            equipment: { slot:"hands" },
            magic: {
                charges: 5,
                onFireEffect: {
                    destroyOnEffect: false,
                    targetSelector: { method: TargetSelectionMethod.ACTOR_ON_CELL },
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
            blockWalk: true,
            lever: { action: LeverAction.OPEN_CLOSE_DOOR }
        },
        "wooden door": {
            classes:["door"],
            color: Constants.WOOD_COLOR,
            blockSight: true,
            door: { seeThrough: false },
        },
        "iron portcullis": {
            classes:["door"],
            color: Constants.IRON_COLOR,
            blockSight: false,
            door: { seeThrough: true },
        },
        "stair": {
            color: 0xFFFFFF,
            displayOutOfFov: true,
            plural: true            
        },
        "stair up": {
            ch:"<",
            classes:["stair"]
        },        
        "stair down": {
            ch:">",
            classes:["stair"]
        },        
    }
}
