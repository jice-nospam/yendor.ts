/*
	Section: actors
*/
import * as Core from "../fwk/core/main";
import * as Actors from "../fwk/actors/main";
import {Constants, GameStatus} from "./base";
import {EventType} from "./custom_events";

/**
    Enum: ActorType
    enum for all the actors existing in the game.
*/
export enum ActorType {
    // creature
    // 		beast
    GOBLIN,
    ORC,
    TROLL,
    // 		human
    PLAYER,
    // flask
    OIL_FLASK,
    HEALTH_POTION,
    REGENERATION_POTION,
    // scroll
    SCROLL_OF_LIGHTNING_BOLT,
    SCROLL_OF_FIREBALL,
    SCROLL_OF_CONFUSION,
    // weapon
    // 		blades
    SHORT_SWORD,
    LONGSWORD,
    GREATSWORD,
    // 		shield
    WOODEN_SHIELD,
    IRON_SHIELD,
    // 		ranged
    SHORT_BOW,
    LONG_BOW,
    CROSSBOW,
    // 		staffs, wands and rods
    WAND_OF_FROST,
    STAFF_OF_TELEPORTATION,
    STAFF_OF_LIFE_DETECTION,
    STAFF_OF_MAPPING,
    SUNROD,
    // 		projectile
    // 			arrow
    BONE_ARROW,
    IRON_ARROW,
    // 			bolt
    BOLT,
    // light
    CANDLE,
    TORCH,
    LANTERN,
    WALL_TORCH,
    // miscellaneous
    STAIRS_UP,
    STAIRS_DOWN,
    WOODEN_DOOR,
    IRON_PORTCULLIS,
    KEY,

    ACTOR_TYPE_COUNT
};

let actorDefs: { [index: string]: Actors.ActorDef } = {
    "creature" : {
        blockWalk: true,
    },
    "beast": {
        prototypes: ["creature"]
    },
    "goblin": {
        ch: "g",
        color: 0x3F7F3F,
        prototypes: ["beast"],
        ai: { type: Actors.AiType.MONSTER, walkTime: 4 },
        destructible: { corpseName: "goblin corpse", corpseChar: "%", defense: 0, healthPoints: 3, xp: 10 },
        attacker: { attackTime: 4, hitPoints: 1 }
    },
    "orc": {
        ch: "o",
        color: 0x3F7F3F,
        prototypes: ["beast"],
        ai: { type: Actors.AiType.MONSTER, walkTime: 5 },
        destructible: { corpseName: "dead orc", corpseChar: "%", defense: 0, healthPoints: 9, xp: 35 },
        attacker: { attackTime: 5, hitPoints: 2 }
    },
    "troll": {
        ch: "T",
        color: 0x007F00,
        prototypes: ["beast"],
        blockSight: true,
        ai: { type: Actors.AiType.MONSTER, walkTime: 6 },
        destructible: { corpseName: "troll carcass", corpseChar: "%", defense: 1, healthPoints: 15, xp: 100 },
        attacker: { attackTime: 6, hitPoints: 3 }
    },
    "human": {
        prototypes: ["creature"]
    },
    "player": {
        ch: "@",
        color: 0xFFFFFF,
        prototypes: ["human"],
        blockWalk: false,
        ai: { type: Actors.AiType.PLAYER, walkTime: Actors.PLAYER_WALK_TIME},
        attacker: { hitPoints: 3, attackTime: Actors.PLAYER_WALK_TIME },
        destructible: { healthPoints: 30, defense: 0, corpseName: "your cadaver", corpseChar: "%" },
        xpHolder: {baseLevel: Constants.XP_BASE_LEVEL, newLevel: Constants.XP_NEW_LEVEL},
        container: { capacity: 20 },
        light: {renderMode: Actors.LightRenderMode.MAX, color: Constants.NOLIGHT_COLOR, falloffType: Actors.LightFalloffType.NORMAL, range: 3}
    },
    "item": {
    },
    "flask": {
        ch: "!",
        prototypes: ["item"],
    },
    "oil flask": {
        color: Constants.OIL_FLASK_COLOR,
        prototypes: ["flask"],
        pickable: {
            weight: 1,
            onUseEffector: {
                destroyOnEffect: true,
                targetSelector: { method: Actors.TargetSelectionMethod.WEARER_INVENTORY, actorType: "lantern" },
                effect: {
                    type: Actors.EffectType.INSTANT_HEALTH,
                    data: {
                        amount: 200,
                        canResurrect: true,
                        successMessage: "[The actor2] refill[s2] [its2] lantern."
                    }
                }
            },
        }
    },
    "health potion": {
        color: Constants.HEALTH_POTION_COLOR,
        prototypes: ["flask"],
        pickable: {
            weight: 0.5,
            destroyedWhenThrown: true,
            onUseEffector: {
                destroyOnEffect: true,
                targetSelector: { method: Actors.TargetSelectionMethod.WEARER },
                effect: {
                    type: Actors.EffectType.INSTANT_HEALTH,
                    data: {
                        amount: 5,
                        successMessage: "[The actor1] drink[s] the health potion and regain[s] [value1] hit points.",
                        failureMessage: "[The actor1] drink[s] the health potion but it has no effect"
                    }
                }
            },
            onThrowEffector: {
                destroyOnEffect: true,
                targetSelector: { method: Actors.TargetSelectionMethod.SELECTED_RANGE, radius: 1 },
                effect: {
                    type: Actors.EffectType.INSTANT_HEALTH,
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
        prototypes: ["flask"],
        pickable: {
            weight: 0.5,
            destroyedWhenThrown: true,
            onUseEffector: {
                destroyOnEffect: true,
                targetSelector: { method: Actors.TargetSelectionMethod.WEARER },
                effect: {
                    type: Actors.EffectType.CONDITION,
                    data: {
                        condition: {
                            type: Actors.ConditionType.HEALTH_VARIATION,
                            name: "regeneration",
                            nbTurns: 20,
                            amount: 10
                        },
                        successMessage: "[The actor1] drink[s] the regeneration potion and feel[s]\nthe life flowing through [it].",
                    }
                }
            },
            onThrowEffector: {
                destroyOnEffect: true,
                targetSelector: { method: Actors.TargetSelectionMethod.SELECTED_RANGE, radius: 1 },
                effect: {
                    type: Actors.EffectType.CONDITION,
                    data: {
                        condition: {
                            type: Actors.ConditionType.HEALTH_VARIATION,
                            name: "regeneration",
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
            prototypes: ["item"]
    },
    "scroll of lightning bolt": {
        prototypes: ["scroll"],
        pickable: {
            weight: 0.1,
            onUseEffector: {
                destroyOnEffect: true,
                targetSelector: { method: Actors.TargetSelectionMethod.CLOSEST_ENEMY, range: 5 },
                effect: {
                    type: Actors.EffectType.INSTANT_HEALTH,
                    data: {
                        amount: -20,
                        successMessage: "A lightning bolt strikes [the actor1] with a loud thunder!\nThe damage is [value1] hit points."
                    }
                }
            },
        }
    },
    "scroll of fireball": {
        prototypes: ["scroll"],
        pickable: {
            weight: 0.1,
            onUseEffector: {
                destroyOnEffect: true,
                targetSelector: { method: Actors.TargetSelectionMethod.SELECTED_RANGE, range: 10, radius: 3 },
                message: "A fireball explodes, burning everything within 3 tiles.",
                effect: {
                    type: Actors.EffectType.INSTANT_HEALTH,
                    data: {
                        amount: -12,
                        successMessage: "[The actor1] get[s] burned for [value1] hit points."
                    }
                }
            },
        }
    },
    "scroll of confusion": {
        prototypes: ["scroll"],
        pickable: {
            weight: 0.1,
            onUseEffector: {
                destroyOnEffect: true,
                targetSelector: { method: Actors.TargetSelectionMethod.SELECTED_ACTOR, range: 5 },
                effect: {
                    type: Actors.EffectType.CONDITION,
                    data: {
                        condition: {
                            type: Actors.ConditionType.CONFUSED,
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
        prototypes: ["item"],
        activable: { type: Actors.ActivableType.TOGGLE, activateMessage: "[The actor1] is on.", deactivateMessage: "[The actor1] is off."  }
    },
    "pickableLight": {
        prototypes: ["light"],
        equipment: { slot: "left hand" },
    },
    "candle": {
        color: Constants.BONE_COLOR,
        prototypes: ["pickableLight"],
        pickable: { weight: 0.5 },
        light: {
            renderMode: Actors.LightRenderMode.MAX,
            color: Constants.CANDLE_LIGHT_COLOR, falloffType: Actors.LightFalloffType.NORMAL, range: 8,
            intensityVariationLength: 200, intensityVariationRange: 0.25, intensityVariationPattern: "noise"
        },
        destructible: {
            healthPoints: 160,
            deathMessage: "[The actor2's] candle has burnt away"
        },
        ai: {
            type: Actors.AiType.ITEM,
            walkTime: Actors.PLAYER_WALK_TIME,
            conditions: [{
                type: Actors.ConditionType.HEALTH_VARIATION,
                nbTurns: 0,
                amount: -1,
                noDisplay: true,
                onlyIfActive: true
            }]
        }
    },
    "torch": {
        color: Constants.WOOD_COLOR,
        prototypes: ["pickableLight"],
        pickable: { weight: 0.5 },
        light: {
            renderMode: Actors.LightRenderMode.MAX,
            color: Constants.TORCH_LIGHT_COLOR, falloffType: Actors.LightFalloffType.LINEAR, range: 9,
            intensityVariationLength: 300, intensityVariationRange: 0.15, intensityVariationPattern: "noise"
        },
        destructible: {
            healthPoints: 240,
            deathMessage: "[The actor2's] torch has burnt away"
        },
        ai: {
            type: Actors.AiType.ITEM,
            walkTime: Actors.PLAYER_WALK_TIME,
            conditions: [{
                type: Actors.ConditionType.HEALTH_VARIATION,
                nbTurns: 0,
                amount: -1,
                noDisplay: true,
                onlyIfActive: true
            }]
        }
    },
    "lantern": {
        color: Constants.WOOD_COLOR,
        prototypes: ["pickableLight"],
        pickable: { weight: 1 },
        light: {
            renderMode: Actors.LightRenderMode.MAX,
            color: Constants.TORCH_LIGHT_COLOR, falloffType: Actors.LightFalloffType.LINEAR, range: 12,
            intensityVariationLength: 500, intensityVariationRange: 0.1, intensityVariationPattern: "noise"
        },
        destructible: {
            healthPoints: 500,
            deathMessage: "[The actor2's] lantern is empty.",
            // same name to avoid item destruction
            corpseName: "lantern"
        },
        ai: {
            type: Actors.AiType.ITEM,
            walkTime: Actors.PLAYER_WALK_TIME,
            conditions: [{
                type: Actors.ConditionType.HEALTH_VARIATION,
                nbTurns: 0,
                amount: -1,
                noDisplay: true,
                onlyIfActive: true
            }]
        }
    },
    "wall torch": {
        color: Constants.WOOD_COLOR,
        prototypes: ["light"],
        wallActor: true,
        displayOutOfFov: true,
        light: {
            renderMode: Actors.LightRenderMode.MAX,
            color: Constants.TORCH_LIGHT_COLOR, falloffType: Actors.LightFalloffType.LINEAR, range: 18,
            intensityVariationLength: 300, intensityVariationRange: 0.15, intensityVariationPattern: "noise"
        },
        activable: { type: Actors.ActivableType.TOGGLE, activeByDefault: true }
    },
    "weapon": {
        prototypes: ["item"]
    },
    "blade": {
        prototypes: ["weapon"]
    },
    "short sword": {
        ch: "/",
        prototypes: ["blade"],
        color: Constants.STEEL_COLOR,
        pickable: { weight: 2,
        onThrowEffector: {
                destroyOnEffect: false,
                targetSelector: { method: Actors.TargetSelectionMethod.ACTOR_ON_CELL },
                effect: {
                    type: Actors.EffectType.INSTANT_HEALTH,
                    data: {
                        amount: -4,
                        successMessage: "The sword hits [the actor1] for [value1] hit points."
                    }
                }
            }
        },
        attacker: { attackTime: 4, hitPoints: 4 },
        equipment: { slot: "right hand" }
    },
    "longsword": {
        ch: "/",
        prototypes: ["blade"],
        color: Constants.STEEL_COLOR,
        pickable: { weight: 3,
        onThrowEffector: {
                destroyOnEffect: false,
                targetSelector: { method: Actors.TargetSelectionMethod.ACTOR_ON_CELL },
                effect: {
                    type: Actors.EffectType.INSTANT_HEALTH,
                    data: {
                        amount: -6,
                        successMessage: "The sword hits [the actor1] for [value1] hit points."
                    }
                }
            }
        },
        attacker: { attackTime: 5, hitPoints: 6 },
        equipment: { slot: "right hand" }
    },
    "greatsword": {
        ch: "/",
        prototypes: ["blade"],
        color: Constants.STEEL_COLOR,
        pickable: { weight: 4,
            onThrowEffector: {
                destroyOnEffect: false,
                targetSelector: { method: Actors.TargetSelectionMethod.ACTOR_ON_CELL },
                effect: {
                    type: Actors.EffectType.INSTANT_HEALTH,
                    data: {
                        amount: -10,
                        successMessage: "The sword hits [the actor1] for [value1] hit points."
                    }
                }
            }
        },
        attacker: { attackTime: 6, hitPoints: 10 },
        equipment: { slot: "hands" }
    },
    "shield": {
        ch: "[",
        prototypes: ["weapon"],
        pickable: { weight: 5,
            onThrowEffector: {
                destroyOnEffect: false,
                targetSelector: { method: Actors.TargetSelectionMethod.ACTOR_ON_CELL },
                effect: {
                    type: Actors.EffectType.CONDITION,
                    data: {
                        condition: {
                            type: Actors.ConditionType.STUNNED,
                            nbTurns: 2,
                        },
                        successMessage: "The shield hits [the actor1] and stuns [it]!"
                    }
                }
            }
        },
    },
    "wooden shield": {
        prototypes: ["shield"],
        color: Constants.WOOD_COLOR,
        equipment: { slot: "left hand", defense: 1 }
    },
    "iron shield": {
        prototypes: ["shield"],
        color: Constants.IRON_COLOR,
        equipment: { slot: "left hand", defense: 1.5 }
    },
    "projectile": {
        ch: "\\",
        prototypes: ["weapon"],
        equipment: { slot: "quiver" },
    },
    "arrow": {
        prototypes: ["projectile"]
    },
    "bone arrow": {
        color: Constants.BONE_COLOR,
        prototypes: ["arrow"],
        pickable: { weight: 0.1,
            onThrowEffector: {
                destroyOnEffect: false,
                targetSelector: { method: Actors.TargetSelectionMethod.ACTOR_ON_CELL },
                effect: {
                    type: Actors.EffectType.INSTANT_HEALTH,
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
        prototypes: ["arrow"],
        pickable: { weight: 0.1,
            onThrowEffector: {
                destroyOnEffect: false,
                targetSelector: { method: Actors.TargetSelectionMethod.ACTOR_ON_CELL },
                effect: {
                    type: Actors.EffectType.INSTANT_HEALTH,
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
        prototypes: ["projectile"],
        pickable: { weight: 0.1,
            onThrowEffector: {
                destroyOnEffect: false,
                targetSelector: { method: Actors.TargetSelectionMethod.ACTOR_ON_CELL },
                effect: {
                    type: Actors.EffectType.INSTANT_HEALTH,
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
        prototypes: ["weapon"],
        pickable: { weight: 2 },
    },
    "short bow": {
        prototypes: ["ranged"],
        equipment: { slot: "hands" },
        ranged: { damageCoef: 4, projectileType: "arrow", loadTime: 4, range: 15 }
    },
    "long bow": {
        prototypes: ["ranged"],
        equipment: { slot: "hands" },
        ranged: { damageCoef: 8, projectileType: "arrow", loadTime: 6, range: 30 }
    },
    "crossbow": {
        prototypes: ["ranged"],
        equipment: { slot: "right hand" },
        ranged: { damageCoef: 8, projectileType: "bolt", loadTime: 5, range: 10 }
    },
    "wand": {
        ch: "/",
        color: Constants.WOOD_COLOR,
        prototypes: ["weapon"],
        pickable: { weight: 0.5 },
        equipment: { slot: "right hand" }
    },
    "wand of frost": {
        prototypes: ["wand"],
        magic: {
            charges: 5,
            onFireEffect: {
                destroyOnEffect: false,
                targetSelector: { method: Actors.TargetSelectionMethod.SELECTED_ACTOR, range: 5 },
                message: "[The actor1] zap[s] [its] wand.",
                effect: {
                    type: Actors.EffectType.CONDITION,
                    data: {
                        condition: {
                            type: Actors.ConditionType.FROZEN,
                            nbTurns: 10,
                        },
                        successMessage: "[The actor1] [is] covered with frost."
                    }
                }
            }
        }
    },
    "staff": {
        ch: "/",
        color: Constants.WOOD_COLOR,
        prototypes: ["weapon"],
        pickable: { weight: 3 },
        equipment: { slot: "hands" }
    },
    "sunrod": {
        prototypes: ["staff"],
        light: {
            renderMode: Actors.LightRenderMode.ADDITIVE,
            color: Constants.SUNROD_LIGHT_COLOR, falloffType: Actors.LightFalloffType.LINEAR, range: 15,
            intensityVariationLength: 1300, intensityVariationRange: 0.15,
            intensityVariationPattern: "0000000111112222333445566677778888899999998888877776665544333222211111"
        },
        activable: { type: Actors.ActivableType.TOGGLE }
    },
    "staff of teleportation": {
        prototypes: ["staff"],
        magic: {
            charges: 5,
            onFireEffect: {
                destroyOnEffect: false,
                targetSelector: { method: Actors.TargetSelectionMethod.SELECTED_ACTOR, range: 5 },
                message: "[The actor1] zap[s] [its] staff.",
                effect: {
                    type: Actors.EffectType.TELEPORT,
                    data: { successMessage: "[The actor1] disappear[s] suddenly." }
                }
            }
        }
    },
    "staff of life detection": {
        prototypes: ["staff"],
        magic: {
            charges: 5,
            onFireEffect: {
                destroyOnEffect: false,
                targetSelector: { method: Actors.TargetSelectionMethod.WEARER },
                message: "[The actor1] zap[s] [its] staff.",
                effect: {
                    type: Actors.EffectType.CONDITION,
                    data: {
                        condition: {
                            type: Actors.ConditionType.DETECT_LIFE,
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
        prototypes: ["staff"],
        magic: {
            charges: 5,
            onFireEffect: {
                destroyOnEffect: false,
                targetSelector: { method: Actors.TargetSelectionMethod.WEARER },
                message: "[The actor1] zap[s] [its] staff.",
                effect: {
                    type: Actors.EffectType.MAP_REVEAL
                }
            }
        }
    },
    "key": {
        ch: "p",
        color: Constants.IRON_COLOR,
        prototypes: ["item"],
        pickable: { weight: 0.1 },
    },
    "door": {
        ch: "+",
        displayOutOfFov: true,
        blockWalk: true
    },
    "wooden door": {
        prototypes: ["door"],
        color: Constants.WOOD_COLOR,
        blockSight: true,
        activable: {  type: Actors.ActivableType.DOOR, seeThrough: false, activateMessage: "[The actor1] is open", deactivateMessage: "[The actor1] is closed." },
    },
    "iron portcullis": {
        prototypes: ["door"],
        color: Constants.IRON_COLOR,
        blockSight: false,
        activable: {  type: Actors.ActivableType.DOOR, seeThrough: true, activateMessage: "[The actor1] is open", deactivateMessage: "[The actor1] is closed." },
    },
    "stairs": {
        color: 0xFFFFFF,
        displayOutOfFov: true,
        plural: true
    },
    "stairs up": {
        ch: "<",
        prototypes: ["stairs"],
        activable: { type: Actors.ActivableType.SINGLE, activateMessage: "The stairs have collapsed. You can't go up anymore..."}
    },
    "stairs down": {
        ch: ">",
        prototypes: ["stairs"],
        activable: {  type: Actors.ActivableType.SINGLE,
            onActivateEffector: {
                effect: {
                    type: Actors.EffectType.EVENT,
                    data: {
                        eventType: EventType[EventType.CHANGE_STATUS],
                        eventData: GameStatus.NEXT_LEVEL
                    }
                },
                targetSelector: {
                    method: Actors.TargetSelectionMethod.WEARER
                },
                destroyOnEffect: false
            },
        }
    },
};

Actors.ActorFactory.init(actorDefs);
