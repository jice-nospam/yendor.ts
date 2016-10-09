/**
 * Section: actors
 */
import * as Actors from "../fwk/actors/main";
import {
    GameStatus,
    BONE_COLOR,
    CANDLE_LIGHT_COLOR,
    DARK_WOOD_COLOR,
    EVENT_CHANGE_STATUS,
    GOLD_COLOR,
    HEALTH_POTION_COLOR,
    IRON_COLOR,
    NOLIGHT_COLOR,
    OIL_FLASK_COLOR,
    PAPER_COLOR,
    STEEL_COLOR,
    SUNROD_LIGHT_COLOR,
    TORCH_LIGHT_COLOR,
    WOOD_COLOR,
    XP_BASE_LEVEL,
    XP_NEW_LEVEL,
} from "./base";

/**
 * Const: ACTOR_TYPES
 * name of all the actor types existing in the game.
 */
export const ACTOR_TYPES = {
    CREATURE: "creature[s]",
        HUMANOID: "humanoid[s]",
            GOBLIN: "goblin[s]",
            ORC: "orc[s]",
            TROLL: "troll[s]",
            HUMAN: "human[s]",
                PLAYER: "player",
    MAGIC: "magic",
    ITEM: "item[s]",
        FLASK: "flask[s]",
            OIL_FLASK: "oil flask[s]",
        MONEY: "money",
            GOLD_PIECE: "gold piece[s]",
        CONTAINER: "container[s]",
            STATIC_CONTAINER: "static container[s]",
                SMALL_CHEST: "small chest[s]",
                CHEST: "chest[s]",
                CRATE: "crate[s]",
                BARREL: "barrel[s]",
            PICKABLE_CONTAINER: "pickable container[s]",
                POUCH: "pouch[es]",
                BAG: "bag[s]",
                SATCHEL: "satchel[s]",
                PACK: "pack[s]",
                MAP_CASE: "map case[s]",
                KEY_RING: "key ring[s]",
        POTION: "potion[s]",
            HEALTH_POTION: "health potion[s]",
            REGENERATION_POTION: "regeneration potion[s]",
        SCROLL: "scroll[s]",
            SCROLL_OF_LIGHTNING_BOLT: "scroll[s] of lighting bolt",
            SCROLL_OF_FIREBALL: "scroll[s] of fireball",
            SCROLL_OF_CONFUSION: "scroll[s] of confusion",
        WEAPON: "weapon[s]",
            BLADE: "blade[s]",
                KNIFE: "knife[s]",
                SHORT_SWORD: "short sword[s]",
                LONGSWORD: "longsword[s]",
                GREATSWORD: "greatsword[s]",
            SHIELD: "shield[s]",
                WOODEN_SHIELD: "wooden shield[s]",
                IRON_SHIELD: "iron shield[s]",
            RANGED: "ranged",
                SHORT_BOW: "short bow[s]",
                LONG_BOW: "long bow[s]",
                CROSSBOW: "crossbow[s]",
            WAND: "wand[s]",
                WAND_OF_FROST: "wand[s] of frost",
            STAFF: "staff[s]",
                STAFF_OF_TELEPORTATION: "staff[s] of teleportation",
                STAFF_OF_LIFE_DETECTION: "staff[s] of life detection",
                STAFF_OF_MAPPING: "staff[s] of mapping",
                SUNROD: "sunrod[s]",
        PROJECTILE: "projectile[s]",
            ARROW: "arrow[s]",
                BONE_ARROW: "bone arrow[s]",
                IRON_ARROW: "iron arrow[s]",
            BOLT: "bolt[s]",
        LIGHT: "light[s]",
            PICKABLE_LIGHT: "pickable light[s]",
                CONSUMABLE_LIGHT: "consumable light[s]",
                    CANDLE: "candle[s]",
                    TORCH: "torch[es]",
                REFILLABLE_LIGHT: "refillable light[s]",
                    LANTERN: "lantern[s]",
        KEY: "key[s]",
    DEVICE: "device[s]",
        WALL_TORCH: "wall torch[es]",
        STAIRS: "stairs",
            STAIRS_UP: "stairs up",
            STAIRS_DOWN: "stairs down",
        DOOR: "door[s]",
            WOODEN_DOOR: "wooden door[s]",
            IRON_PORTCULLIS: "iron portcullis[es]",
};

// ================================== creatures ==================================
Actors.ActorFactory.registerActorDef({
    abstract: true,
    name: ACTOR_TYPES.CREATURE,
    blockWalk: true,
    destructible: {
        corpseChar: "%",
        qualifiers: ["almost dead", "badly wounded", "wounded", "lightly wounded", ""],
    },
});

Actors.ActorFactory.registerActorDef({
    abstract: true,
    name: ACTOR_TYPES.HUMANOID,
    container: {
        capacity: 20,
        slots: [Actors.SLOT_LEFT_HAND, Actors.SLOT_RIGHT_HAND, Actors.SLOT_BOTH_HANDS],
    },
    prototypes: [ACTOR_TYPES.CREATURE],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.GOBLIN,
    ai: { type: Actors.AiTypeEnum.MONSTER, walkTime: 4 },
    attacker: { attackTime: 4, hitPoints: 1 },
    ch: "g",
    color: 0x3F7F3F,
    destructible: { corpseName: "goblin corpse", defense: 0, healthPoints: 3,
        loot: { classProb: [
            { clazz: ACTOR_TYPES.GOLD_PIECE, prob: 1},
            { clazz: ACTOR_TYPES.TORCH, prob: 1},
            { clazz: undefined, prob: 3},
        ]},
        xp: 10,
    },
    prototypes: [ACTOR_TYPES.HUMANOID],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.ORC,
    ai: { type: Actors.AiTypeEnum.MONSTER, walkTime: 5 },
    attacker: { attackTime: 5, hitPoints: 2 },
    ch: "o",
    color: 0x3F7F3F,
    destructible: {
        corpseName: "dead orc",
        defense: 0,
        healthPoints: 9,
        loot: {
            classProb: [
                { clazz: ACTOR_TYPES.GOLD_PIECE, prob: 1},
                { clazz: ACTOR_TYPES.TORCH, prob: 1},
                { clazz: ACTOR_TYPES.POTION, prob: 1},
            ],
            countProb: {0: 30, 1: 50, 2: 20},
        },
        xp: 35,
    },
    prototypes: [ACTOR_TYPES.HUMANOID],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.TROLL,
    ai: { type: Actors.AiTypeEnum.MONSTER, walkTime: 6 },
    attacker: { attackTime: 6, hitPoints: 3 },
    blockSight: true,
    ch: "T",
    color: 0x007F00,
    destructible: {
        corpseName: "troll carcass",
        defense: 1,
        healthPoints: 15,
        loot: {
            classProb: [
                { clazz: ACTOR_TYPES.GOLD_PIECE, prob: 1},
                { clazz: ACTOR_TYPES.TORCH, prob: 1},
                { clazz: ACTOR_TYPES.POTION, prob: 1},
            ],
            countProb: {0: 15, 1: 60, 2: 25},
        },
        xp: 100,
    },
    prototypes: [ACTOR_TYPES.HUMANOID],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.HUMAN,
    abstract: true,
    ch: "@",
    container: { capacity: 20, slots: [Actors.SLOT_LEFT_HAND, Actors.SLOT_RIGHT_HAND,
        Actors.SLOT_BOTH_HANDS, Actors.SLOT_QUIVER] },
    prototypes: [ACTOR_TYPES.HUMANOID],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.PLAYER,
    ai: { type: Actors.AiTypeEnum.PLAYER, walkTime: Actors.PLAYER_WALK_TIME},
    attacker: { attackTime: Actors.PLAYER_WALK_TIME, hitPoints: 2 },
    blockWalk: false,
    color: 0xFFFFFF,
    destructible: { corpseName: "your cadaver", defense: 0, healthPoints: 30 },
    light: {color: NOLIGHT_COLOR,
        falloffType: Actors.LightFalloffTypeEnum.NORMAL, range: 3,
        renderMode: Actors.LightRenderModeEnum.MAX },
    prototypes: [ACTOR_TYPES.HUMAN],
    xpHolder: {baseLevel: XP_BASE_LEVEL, newLevel: XP_NEW_LEVEL},
});
// ================================== items  ==================================
Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.ITEM,
    abstract: true,
});
Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.FLASK,
    abstract: true,
    ch: "!",
    containerQualifier: true,
    prototypes: [ACTOR_TYPES.ITEM],
});
Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.OIL_FLASK,
    color: OIL_FLASK_COLOR,
    pickable: {
        onUseEffector: {
            destroyOnEffect: true,
            effect: {
                amount: 200,
                canResurrect: true,
                failureMessage: "The lantern is already full.",
                successMessage: "[The actor2] refill[s2] [its2] lantern.",
                type: Actors.EffectTypeEnum.INSTANT_HEALTH,
            },
            targetSelector: {
                actorType: ACTOR_TYPES.LANTERN,
                method: Actors.TargetSelectionMethodEnum.WEARER_INVENTORY,
            },
        },
        weight: 1,
    },
    prototypes: [ACTOR_TYPES.FLASK],
});
// ================================== money ==================================
Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.MONEY,
    abstract: true,
    ch: "$",
    containerQualifier: true,
    pickable: {weight: 0.05},
    plural: true,
    prototypes: [ACTOR_TYPES.ITEM],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.GOLD_PIECE,
    color: GOLD_COLOR,
    plural: false,
    prototypes: [ACTOR_TYPES.MONEY],
});

// ================================== containers ==================================
Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.CONTAINER,
    abstract: true,
    ch: "]",
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.STATIC_CONTAINER,
    abstract: true,
    color: DARK_WOOD_COLOR,
    prototypes: [ACTOR_TYPES.CONTAINER, ACTOR_TYPES.DEVICE],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.SMALL_CHEST,
    container: {capacity: 5},
    prototypes: [ACTOR_TYPES.STATIC_CONTAINER],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.CHEST,
    container: {capacity: 15},
    prototypes: [ACTOR_TYPES.STATIC_CONTAINER],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.CRATE,
    container: {capacity: 20},
    prototypes: [ACTOR_TYPES.STATIC_CONTAINER],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.BARREL,
    container: {capacity: 30},
    prototypes: [ACTOR_TYPES.STATIC_CONTAINER],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.PICKABLE_CONTAINER,
    abstract: true,
    color: WOOD_COLOR,
    pickable: {weight: 0.2},
    prototypes: [ACTOR_TYPES.CONTAINER, ACTOR_TYPES.ITEM],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.POUCH,
    container: { capacity: 2},
    prototypes: [ACTOR_TYPES.PICKABLE_CONTAINER],
});
Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.BAG,
    container: { capacity: 5},
    prototypes: [ACTOR_TYPES.PICKABLE_CONTAINER],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.SATCHEL,
    container: { capacity: 10},
    prototypes: [ACTOR_TYPES.PICKABLE_CONTAINER],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.PACK,
    container: { capacity: 40},
    prototypes: [ACTOR_TYPES.PICKABLE_CONTAINER],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.KEY_RING,
    container: { capacity: 5, filter: [ACTOR_TYPES.KEY]},
    prototypes: [ACTOR_TYPES.PICKABLE_CONTAINER],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.MAP_CASE,
    container: { capacity: 5, filter: [ACTOR_TYPES.SCROLL]},
    prototypes: [ACTOR_TYPES.PICKABLE_CONTAINER],
});

// ================================== potions ==================================
Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.POTION,
    abstract: true,
    containerQualifier: true,
    prototypes: [ACTOR_TYPES.FLASK],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.HEALTH_POTION,
    color: HEALTH_POTION_COLOR,
    pickable: {
        destroyedWhenThrown: true,
        onThrowEffector: {
            destroyOnEffect: true,
            effect: {
                amount: 3,
                failureMessage: "The potion explodes on [the actor1] but it has no effect",
                successMessage: "The potion explodes on [the actor1], healing [it] for [value1] hit points.",
                type: Actors.EffectTypeEnum.INSTANT_HEALTH,
            },
            targetSelector: { method: Actors.TargetSelectionMethodEnum.SELECTED_RANGE, radius: 1 },
        },
        onUseEffector: {
            destroyOnEffect: true,
            effect: {
                amount: 5,
                failureMessage: "[The actor1] drink[s] the health potion but it has no effect",
                successMessage: "[The actor1] drink[s] the health potion and regain[s] [value1] hit points.",
                type: Actors.EffectTypeEnum.INSTANT_HEALTH,
            },
            targetSelector: { method: Actors.TargetSelectionMethodEnum.WEARER },
        },
        weight: 0.5,
    },
    prototypes: [ACTOR_TYPES.POTION],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.REGENERATION_POTION,
    color: HEALTH_POTION_COLOR,
    pickable: {
        destroyedWhenThrown: true,
        onThrowEffector: {
            destroyOnEffect: true,
            effect: {
                condition: {
                    amount: 6,
                    name: "regeneration",
                    nbTurns: 12,
                    type: Actors.ConditionTypeEnum.HEALTH_VARIATION,
                },
                successMessage: "The potion explodes on [the actor1].\nLife is flowing through [it].",
                type: Actors.EffectTypeEnum.CONDITION,
            },
            targetSelector: { method: Actors.TargetSelectionMethodEnum.SELECTED_RANGE, radius: 1 },
        },
        onUseEffector: {
            destroyOnEffect: true,
            effect: {
                condition: {
                    amount: 10,
                    name: "regeneration",
                    nbTurns: 20,
                    type: Actors.ConditionTypeEnum.HEALTH_VARIATION,
                },
                successMessage: "[The actor1] drink[s] the regeneration potion and feel[s]\n"
                    + "the life flowing through [it].",
                type: Actors.EffectTypeEnum.CONDITION,
            },
            targetSelector: { method: Actors.TargetSelectionMethodEnum.WEARER },
        },
        weight: 0.5,
    },
    prototypes: [ACTOR_TYPES.POTION],
});

// ================================== scrolls ==================================
Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.SCROLL,
    abstract: true,
    ch: "#",
    color: PAPER_COLOR,
    containerQualifier: true,
    prototypes: [ACTOR_TYPES.ITEM],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.SCROLL_OF_LIGHTNING_BOLT,
    pickable: {
        onUseEffector: {
            destroyOnEffect: true,
            effect: {
                amount: -20,
                successMessage: "A lightning bolt strikes [the actor1] with a loud thunder!\n" +
                    "The damage is [value1] hit points.",
                type: Actors.EffectTypeEnum.INSTANT_HEALTH,
            },
            targetSelector: { method: Actors.TargetSelectionMethodEnum.CLOSEST_ENEMY, range: 5 },
        },
        weight: 0.1,
    },
    prototypes: [ACTOR_TYPES.SCROLL],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.SCROLL_OF_FIREBALL,
    pickable: {
        onUseEffector: {
            destroyOnEffect: true,
            effect: {
                amount: -12,
                successMessage: "[The actor1] get[s] burned for [value1] hit points.",
                type: Actors.EffectTypeEnum.INSTANT_HEALTH,
            },
            message: "A fireball explodes, burning everything within 3 tiles.",
            targetSelector: {
                method: Actors.TargetSelectionMethodEnum.SELECTED_RANGE,
                radius: 3,
                range: 10,
             },
        },
        weight: 0.1,
    },
    prototypes: [ACTOR_TYPES.SCROLL],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.SCROLL_OF_CONFUSION,
    pickable: {
        onUseEffector: {
            destroyOnEffect: true,
            effect: {
                condition: {
                    nbTurns: 12,
                    type: Actors.ConditionTypeEnum.CONFUSED,
                    noCorpse: true,
                },
                successMessage: "[The actor1's] eyes look vacant,\nas [it] start[s] to stumble around!",
                type: Actors.EffectTypeEnum.CONDITION,
            },
            targetSelector: { method: Actors.TargetSelectionMethodEnum.SELECTED_ACTOR, range: 5 },
        },
        weight: 0.1,
    },
    prototypes: [ACTOR_TYPES.SCROLL],
});

// ================================== lights ==================================
Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.LIGHT,
    abstract: true,
    activable: {
        activateMessage: "[The actor1] is on.",
        deactivateMessage: "[The actor1] is off.",
        type: Actors.ActivableTypeEnum.TOGGLE,
    },
    ch: "/",
    containerQualifier: true,
    prototypes: [ACTOR_TYPES.ITEM],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.PICKABLE_LIGHT,
    abstract: true,
    equipment: {
        slots: [Actors.SLOT_LEFT_HAND, Actors.SLOT_RIGHT_HAND],
    },
    prototypes: [ACTOR_TYPES.LIGHT],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.CONSUMABLE_LIGHT,
    abstract: true,
    destructible: {
        qualifiers: ["burnt out", "almost burnt out", "half burnt", "slightly burnt", ""],
    },
    prototypes: [ACTOR_TYPES.PICKABLE_LIGHT],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.CANDLE,
    ai: {
        conditions: [{
            amount: -1,
            nbTurns: 0,
            noDisplay: true,
            onlyIfActive: true,
            type: Actors.ConditionTypeEnum.HEALTH_VARIATION,
        }],
        type: Actors.AiTypeEnum.ITEM,
        walkTime: Actors.PLAYER_WALK_TIME,
    },
    color: BONE_COLOR,
    destructible: {
        deathMessage: "[The actor2's] candle has burnt away",
        healthPoints: 160,
    },
    light: {
        color: CANDLE_LIGHT_COLOR,
        falloffType: Actors.LightFalloffTypeEnum.NORMAL,
        intensityVariationLength: 200,
        intensityVariationPattern: "noise",
        intensityVariationRange: 0.25,
        range: 8,
        renderMode: Actors.LightRenderModeEnum.MAX,
    },
    pickable: { weight: 0.5 },
    prototypes: [ACTOR_TYPES.CONSUMABLE_LIGHT],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.TORCH,
    ai: {
        conditions: [{
            amount: -1,
            nbTurns: 0,
            noDisplay: true,
            onlyIfActive: true,
            type: Actors.ConditionTypeEnum.HEALTH_VARIATION,
        }],
        type: Actors.AiTypeEnum.ITEM,
        walkTime: Actors.PLAYER_WALK_TIME,
    },
    color: WOOD_COLOR,
    destructible: {
        deathMessage: "[The actor2's] torch has burnt away",
        healthPoints: 240,
    },
    light: {
        color: TORCH_LIGHT_COLOR,
        falloffType: Actors.LightFalloffTypeEnum.LINEAR,
        intensityVariationLength: 300,
        intensityVariationPattern: "noise",
        intensityVariationRange: 0.15,
        range: 9,
        renderMode: Actors.LightRenderModeEnum.MAX,
    },
    pickable: { weight: 0.5 },
    prototypes: [ACTOR_TYPES.CONSUMABLE_LIGHT],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.REFILLABLE_LIGHT,
    abstract: true,
    destructible: {
        qualifiers: ["empty", "almost empty", "half empty", "", ""],
    },
    prototypes: [ACTOR_TYPES.PICKABLE_LIGHT],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.LANTERN,
    ai: {
        conditions: [{
            amount: -1,
            nbTurns: 0,
            noDisplay: true,
            onlyIfActive: true,
            type: Actors.ConditionTypeEnum.HEALTH_VARIATION,
        }],
        type: Actors.AiTypeEnum.ITEM,
        walkTime: Actors.PLAYER_WALK_TIME,
    },
    color: WOOD_COLOR,
    destructible: {
        corpseName: "empty lantern",
        deathMessage: "[The actor2's] lantern is empty.",
        healthPoints: 500,
    },
    light: {
        color: TORCH_LIGHT_COLOR,
        falloffType: Actors.LightFalloffTypeEnum.LINEAR,
        intensityVariationLength: 500,
        intensityVariationPattern: "noise",
        intensityVariationRange: 0.1,
        range: 12,
        renderMode: Actors.LightRenderModeEnum.MAX,
    },
    pickable: { weight: 1 },
    prototypes: [ACTOR_TYPES.REFILLABLE_LIGHT],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.WALL_TORCH,
    activable: {
        activateMessage: "[The actor1] is on.",
        activeByDefault: true,
        deactivateMessage: "[The actor1] is off.",
        type: Actors.ActivableTypeEnum.TOGGLE,
    },
    color: WOOD_COLOR,
    displayOutOfFov: true,
    light: {
        color: TORCH_LIGHT_COLOR,
        falloffType: Actors.LightFalloffTypeEnum.LINEAR,
        intensityVariationLength: 300,
        intensityVariationPattern: "noise",
        intensityVariationRange: 0.15,
        range: 18,
        renderMode: Actors.LightRenderModeEnum.MAX,
    },
    prototypes: [ACTOR_TYPES.LIGHT],
    wallActor: true,
});

// ================================== weapons ==================================
Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.WEAPON,
    abstract: true,
    containerQualifier: true,
    prototypes: [ACTOR_TYPES.ITEM],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.BLADE,
    abstract: true,
    ch: "/",
    color: STEEL_COLOR,
    containerQualifier: true,
    prototypes: [ACTOR_TYPES.WEAPON],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.KNIFE,
    attacker: { attackTime: 3, hitPoints: 3 },
    equipment: { slots: [Actors.SLOT_RIGHT_HAND] },
    pickable: {
        onThrowEffector: {
            destroyOnEffect: false,
            effect: {
                amount: -1,
                successMessage: "The sword hits [the actor1] for [value1] hit points.",
                type: Actors.EffectTypeEnum.INSTANT_HEALTH,
            },
            targetSelector: { method: Actors.TargetSelectionMethodEnum.ACTOR_ON_CELL },
        },
        weight: 0.5,
    },
    prototypes: [ACTOR_TYPES.BLADE],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.SHORT_SWORD,
    attacker: { attackTime: 4, hitPoints: 4 },
    equipment: { slots: [Actors.SLOT_RIGHT_HAND] },
    pickable: {
        onThrowEffector: {
            destroyOnEffect: false,
            effect: {
                amount: -4,
                successMessage: "The sword hits [the actor1] for [value1] hit points.",
                type: Actors.EffectTypeEnum.INSTANT_HEALTH,
            },
            targetSelector: { method: Actors.TargetSelectionMethodEnum.ACTOR_ON_CELL },
        },
        weight: 2,
    },
    prototypes: [ACTOR_TYPES.BLADE],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.LONGSWORD,
    attacker: { attackTime: 5, hitPoints: 6 },
    equipment: { slots: [Actors.SLOT_RIGHT_HAND] },
    pickable: {
        onThrowEffector: {
            destroyOnEffect: false,
            effect: {
                amount: -6,
                successMessage: "The sword hits [the actor1] for [value1] hit points.",
                type: Actors.EffectTypeEnum.INSTANT_HEALTH,
            },
            targetSelector: { method: Actors.TargetSelectionMethodEnum.ACTOR_ON_CELL },
        },
        weight: 3,
    },
    prototypes: [ACTOR_TYPES.BLADE],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.GREATSWORD,
    attacker: { attackTime: 6, hitPoints: 10 },
    equipment: { slots: [Actors.SLOT_BOTH_HANDS] },
    pickable: {
        onThrowEffector: {
            destroyOnEffect: false,
            effect: {
                amount: -10,
                successMessage: "The sword hits [the actor1] for [value1] hit points.",
                type: Actors.EffectTypeEnum.INSTANT_HEALTH,
            },
            targetSelector: { method: Actors.TargetSelectionMethodEnum.ACTOR_ON_CELL },
        },
        weight: 4,
    },
    prototypes: [ACTOR_TYPES.BLADE],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.SHIELD,
    abstract: true,
    ch: "[",
    containerQualifier: true,
    pickable: {
        onThrowEffector: {
            destroyOnEffect: false,
            effect: {
                condition: {
                    nbTurns: 2,
                    type: Actors.ConditionTypeEnum.STUNNED,
                    noCorpse: true,
                },
                successMessage: "The shield hits [the actor1] and stuns [it]!",
                type: Actors.EffectTypeEnum.CONDITION,
            },
            targetSelector: { method: Actors.TargetSelectionMethodEnum.ACTOR_ON_CELL },
        },
        weight: 5,
    },
    prototypes: [ACTOR_TYPES.WEAPON],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.WOODEN_SHIELD,
    color: WOOD_COLOR,
    equipment: {
        defense: 1,
        slots: [Actors.SLOT_LEFT_HAND],
    },
    prototypes: [ACTOR_TYPES.SHIELD],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.IRON_SHIELD,
    color: IRON_COLOR,
    equipment: {
        defense: 1.5,
        slots: [Actors.SLOT_LEFT_HAND],
    },
    prototypes: [ACTOR_TYPES.SHIELD],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.PROJECTILE,
    abstract: true,
    ch: "\\",
    containerQualifier: true,
    equipment: { slots: [Actors.SLOT_QUIVER] },
    prototypes: [ACTOR_TYPES.WEAPON],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.ARROW,
    abstract: true,
    containerQualifier: true,
    prototypes: [ACTOR_TYPES.PROJECTILE],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.BONE_ARROW,
    color: BONE_COLOR,
    pickable: {
        onThrowEffector: {
            destroyOnEffect: false,
            effect: {
                amount: -1,
                successMessage: "The arrow hits [the actor1] for [value1] points.",
                type: Actors.EffectTypeEnum.INSTANT_HEALTH,
                singleActor: true,
            },
            targetSelector: { method: Actors.TargetSelectionMethodEnum.ACTOR_ON_CELL },
        },
        weight: 0.1,
    },
    prototypes: [ACTOR_TYPES.ARROW],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.IRON_ARROW,
    color: WOOD_COLOR,
    pickable: {
        onThrowEffector: {
            destroyOnEffect: false,
            effect: {
                amount: -1.25,
                successMessage: "The arrow hits [the actor1] for [value1] points.",
                type: Actors.EffectTypeEnum.INSTANT_HEALTH,
                singleActor: true,
            },
            targetSelector: { method: Actors.TargetSelectionMethodEnum.ACTOR_ON_CELL },
        },
        weight: 0.1,
    },
    prototypes: [ACTOR_TYPES.ARROW],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.BOLT,
    color: IRON_COLOR,
    pickable: {
        onThrowEffector: {
            destroyOnEffect: false,
            effect: {
                amount: -0.5,
                successMessage: "The bolt hits [the actor1] for [value1] points.",
                type: Actors.EffectTypeEnum.INSTANT_HEALTH,
                singleActor: true,
            },
            targetSelector: { method: Actors.TargetSelectionMethodEnum.ACTOR_ON_CELL },
        },
        weight: 0.1,
    },
    prototypes: [ACTOR_TYPES.PROJECTILE],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.RANGED,
    abstract: true,
    ch: ")",
    color: WOOD_COLOR,
    pickable: { weight: 2 },
    prototypes: [ACTOR_TYPES.WEAPON],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.SHORT_BOW,
    equipment: { slots: [Actors.SLOT_BOTH_HANDS] },
    prototypes: [ACTOR_TYPES.RANGED],
    ranged: {
        damageCoef: 4,
        loadTime: 4,
        projectileType: ACTOR_TYPES.ARROW,
        range: 15,
     },
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.LONG_BOW,
    equipment: { slots: [Actors.SLOT_BOTH_HANDS] },
    prototypes: [ACTOR_TYPES.RANGED],
    ranged: {
        damageCoef: 8,
        loadTime: 6,
        projectileType: ACTOR_TYPES.ARROW,
        range: 30,
     },
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.CROSSBOW,
    equipment: { slots: [Actors.SLOT_RIGHT_HAND] },
    prototypes: [ACTOR_TYPES.RANGED],
    ranged: {
        damageCoef: 8,
        loadTime: 5,
        projectileType: ACTOR_TYPES.BOLT,
        range: 10,
     },
});

// ================================== staffs and wands ==================================
Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.MAGIC,
    abstract: true,
});
Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.WAND,
    abstract: true,
    ch: "/",
    color: WOOD_COLOR,
    containerQualifier: true,
    equipment: { slots: [Actors.SLOT_RIGHT_HAND] },
    pickable: { weight: 0.5 },
    prototypes: [ACTOR_TYPES.WEAPON],
});
Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.WAND_OF_FROST,
    magic: {
        charges: 5,
        onFireEffect: {
            destroyOnEffect: false,
            effect: {
                condition: {
                    nbTurns: 10,
                    type: Actors.ConditionTypeEnum.FROZEN,
                    noDisplay: true,
                },
                successMessage: "[The actor1] [is] covered with frost.",
                type: Actors.EffectTypeEnum.CONDITION,
            },
            message: "[The actor1] zap[s] [its] wand.",
            targetSelector: { method: Actors.TargetSelectionMethodEnum.SELECTED_ACTOR, range: 5 },
        },
    },
    prototypes: [ACTOR_TYPES.WAND],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.STAFF,
    abstract: true,
    ch: "/",
    color: WOOD_COLOR,
    containerQualifier: true,
    equipment: { slots: [Actors.SLOT_RIGHT_HAND, Actors.SLOT_LEFT_HAND] },
    pickable: { weight: 3 },
    prototypes: [ACTOR_TYPES.WEAPON],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.SUNROD,
    activable: { type: Actors.ActivableTypeEnum.TOGGLE },
    light: {
        color: SUNROD_LIGHT_COLOR,
        falloffType: Actors.LightFalloffTypeEnum.LINEAR,
        intensityVariationLength: 1300,
        intensityVariationPattern: "0000000111112222333445566677778888899999998888877776665544333222211111",
        intensityVariationRange: 0.15,
        range: 15,
        renderMode: Actors.LightRenderModeEnum.ADDITIVE,
    },
    prototypes: [ACTOR_TYPES.STAFF, ACTOR_TYPES.MAGIC],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.STAFF_OF_TELEPORTATION,
    magic: {
        charges: 5,
        onFireEffect: {
            destroyOnEffect: false,
            effect: {
                successMessage: "[The actor1] disappear[s] suddenly.",
                type: Actors.EffectTypeEnum.TELEPORT,
                singleActor: true,
            },
            message: "[The actor1] zap[s] [its] staff.",
            targetSelector: { method: Actors.TargetSelectionMethodEnum.SELECTED_ACTOR, range: 5 },
        },
    },
    prototypes: [ACTOR_TYPES.STAFF, ACTOR_TYPES.MAGIC],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.STAFF_OF_LIFE_DETECTION,
    magic: {
        charges: 5,
        onFireEffect: {
            destroyOnEffect: false,
            effect: {
                condition: {
                    nbTurns: 30,
                    range: 15,
                    type: Actors.ConditionTypeEnum.DETECT_LIFE,
                },
                successMessage: "[The actor1] [is] aware of life around [it].",
                type: Actors.EffectTypeEnum.CONDITION,
            },
            message: "[The actor1] zap[s] [its] staff.",
            targetSelector: { method: Actors.TargetSelectionMethodEnum.WEARER },
        },
    },
    prototypes: [ACTOR_TYPES.STAFF, ACTOR_TYPES.MAGIC],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.STAFF_OF_MAPPING,
    magic: {
        charges: 5,
        onFireEffect: {
            destroyOnEffect: false,
            effect: {
                type: Actors.EffectTypeEnum.MAP_REVEAL,
            },
            message: "[The actor1] zap[s] [its] staff.",
            targetSelector: { method: Actors.TargetSelectionMethodEnum.WEARER },
        },
    },
    prototypes: [ACTOR_TYPES.STAFF, ACTOR_TYPES.MAGIC],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.KEY,
    ch: "p",
    color: IRON_COLOR,
    pickable: { weight: 0.1 },
    prototypes: [ACTOR_TYPES.ITEM],
});

// ================================== dungeons devices ==================================
Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.DEVICE,
    abstract: true,
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.DOOR,
    abstract: true,
    blockWalk: true,
    ch: "+",
    displayOutOfFov: true,
    prototypes: [ACTOR_TYPES.DEVICE],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.WOODEN_DOOR,
    activable: <Actors.IDoorDef> {
        activateMessage: "[The actor1] is open",
        deactivateMessage: "[The actor1] is closed.",
        seeThrough: false,
        type: Actors.ActivableTypeEnum.DOOR,
    },
    blockSight: true,
    color: WOOD_COLOR,
    prototypes: [ACTOR_TYPES.DOOR],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.IRON_PORTCULLIS,
    activable: <Actors.IDoorDef> {
        activateMessage: "[The actor1] is open",
        deactivateMessage: "[The actor1] is closed.",
        seeThrough: true,
        type: Actors.ActivableTypeEnum.DOOR,
    },
    blockSight: false,
    color: IRON_COLOR,
    prototypes: [ACTOR_TYPES.DOOR],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.STAIRS,
    abstract: true,
    color: 0xFFFFFF,
    displayOutOfFov: true,
    plural: true,
    prototypes: [ACTOR_TYPES.DEVICE],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.STAIRS_UP,
    activable: {
        activateMessage: "The stairs have collapsed. You can't go up anymore...",
        type: Actors.ActivableTypeEnum.SINGLE,
    },
    ch: "<",
    prototypes: [ACTOR_TYPES.STAIRS],
});

Actors.ActorFactory.registerActorDef({
    name: ACTOR_TYPES.STAIRS_DOWN,
    activable: {
        onActivateEffector: {
            destroyOnEffect: false,
            effect: {
                eventData: GameStatus.NEXT_LEVEL,
                eventType: EVENT_CHANGE_STATUS,
                type: Actors.EffectTypeEnum.EVENT,
            },
            targetSelector: {
                method: Actors.TargetSelectionMethodEnum.WEARER,
            },
        },
        type: Actors.ActivableTypeEnum.SINGLE,
    },
    ch: ">",
    prototypes: [ACTOR_TYPES.STAIRS],
});
