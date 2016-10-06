
import {ACTOR_TYPES} from "./config_actors";
import * as Actors from "../fwk/actors/main";
import * as Constants from "./base";
import {IBspDungeonConfig} from "../fwk/map/map_build_dungeon_bsp";

let itemProbabilities: Actors.IProbabilityMap = {
    classProb: [
        { clazz: ACTOR_TYPES.BONE_ARROW, prob : 5},
        { clazz: ACTOR_TYPES.IRON_ARROW, prob : 5},
        { clazz: ACTOR_TYPES.BOLT, prob : 5},
        { clazz: ACTOR_TYPES.SHORT_BOW, prob : 1},
        { clazz: ACTOR_TYPES.LONG_BOW, prob : [[5, 1]] },
        { clazz: ACTOR_TYPES.CROSSBOW, prob : 1},
        { clazz: ACTOR_TYPES.SHORT_SWORD, prob : [[4, 1], [12, 0]] },
        { clazz: ACTOR_TYPES.WOODEN_SHIELD, prob : [[2, 1], [12, 0]] },
        { clazz: ACTOR_TYPES.LONGSWORD, prob : [[6, 1]] },
        { clazz: ACTOR_TYPES.IRON_SHIELD, prob : [[7, 1]] },
        { clazz: ACTOR_TYPES.GREATSWORD, prob : [[8, 1]] },
        { clazz: ACTOR_TYPES.CANDLE, prob : 10 },
        { clazz: ACTOR_TYPES.OIL_FLASK, prob : 5 },
        { clazz: ACTOR_TYPES.TORCH, prob : 5 },
    ],
    countProb: {
        0: 50,
        1: 40,
        2: 10,
    },
};

let lootProbabilities: Actors.IProbabilityMap = {
    classProb: [
        { clazz: ACTOR_TYPES.HEALTH_POTION, prob : [[0, 20], [5, 15]] },
        { clazz: ACTOR_TYPES.REGENERATION_POTION, prob : [[0, 20], [5, 15]] },
        { clazz: ACTOR_TYPES.SCROLL_OF_LIGHTNING_BOLT, prob : [[3, 10]] },
        { clazz: ACTOR_TYPES.SCROLL_OF_FIREBALL, prob : 7},
        { clazz: ACTOR_TYPES.SCROLL_OF_CONFUSION, prob : 7},
        { clazz: ACTOR_TYPES.SHORT_BOW, prob : 1},
        { clazz: ACTOR_TYPES.LONG_BOW, prob : [[5, 1]] },
        { clazz: ACTOR_TYPES.CROSSBOW, prob : 1},
        { clazz: ACTOR_TYPES.SHORT_SWORD, prob : [[4, 1], [12, 0]] },
        { clazz: ACTOR_TYPES.WAND_OF_FROST, prob : 1},
        { clazz: ACTOR_TYPES.STAFF_OF_TELEPORTATION, prob : 1},
        { clazz: ACTOR_TYPES.STAFF_OF_LIFE_DETECTION, prob : 1},
        { clazz: ACTOR_TYPES.STAFF_OF_MAPPING, prob : 1},
        { clazz: ACTOR_TYPES.WOODEN_SHIELD, prob : [[2, 1], [12, 0]] },
        { clazz: ACTOR_TYPES.LONGSWORD, prob : [[6, 1]] },
        { clazz: ACTOR_TYPES.IRON_SHIELD, prob : [[7, 1]] },
        { clazz: ACTOR_TYPES.GREATSWORD, prob : [[8, 1]] },
        { clazz: ACTOR_TYPES.LANTERN, prob : 1},
        { clazz: ACTOR_TYPES.SUNROD, prob : 1},
    ],
    maxCount: 4,
    minCount: 1,
};

let creatureProbabilities: Actors.IProbabilityMap = {
    classProb: [
        { clazz: ACTOR_TYPES.GOBLIN, prob: 60},
        { clazz: ACTOR_TYPES.ORC, prob: 30},
        { clazz: ACTOR_TYPES.TROLL, prob: [[3, 10], [5, 20], [7, 30]]},
    ],
    maxCount: 2,
};

let doorProbabilities: Actors.IProbabilityMap = {
    classProb: [
        { clazz: ACTOR_TYPES.WOODEN_DOOR, prob: 80},
        { clazz: ACTOR_TYPES.IRON_PORTCULLIS, prob: 20},
    ],
};

let wallLightProbabilities: Actors.IProbabilityMap = {
    classProb: [
        { clazz: ACTOR_TYPES.WALL_TORCH, prob: 1},
    ],
};

let keyProbabilities: Actors.IProbabilityMap = {
    classProb: [
        { clazz: ACTOR_TYPES.KEY, prob: 1},
    ],
};

export let dungeonConfig: IBspDungeonConfig = {
    creatureProbabilities: creatureProbabilities,
    doorProbabilities: doorProbabilities,
    itemProbabilities: itemProbabilities,
    keyProbabilities: keyProbabilities,
    lootContainerType: ACTOR_TYPES.STATIC_CONTAINER,
    lootProbabilities: lootProbabilities,
    maxTorches: Constants.DUNGEON_MAX_TORCHES,
    minTorches: Constants.DUNGEON_MIN_TORCHES,
    roomMinSize: Constants.ROOM_MIN_SIZE,
    wallLightProbabilities: wallLightProbabilities,
};
