
import {ActorType} from "./config_actors";
import * as Map from "../fwk/map/main";

export let itemProbabilities: Map.ActorProbabilityMap = {};
itemProbabilities[ActorType[ActorType.HEALTH_POTION]] = [[0, 20], [5, 15]];
itemProbabilities[ActorType[ActorType.REGENERATION_POTION]] = [[0, 20], [5, 15]];
itemProbabilities[ActorType[ActorType.SCROLL_OF_LIGHTNING_BOLT]] = [[3, 10]];
itemProbabilities[ActorType[ActorType.SCROLL_OF_FIREBALL]] = 7;
itemProbabilities[ActorType[ActorType.SCROLL_OF_CONFUSION]] = 7;
itemProbabilities[ActorType[ActorType.BONE_ARROW]] = 5;
itemProbabilities[ActorType[ActorType.IRON_ARROW]] = 5;
itemProbabilities[ActorType[ActorType.BOLT]] = 5;
itemProbabilities[ActorType[ActorType.SHORT_BOW]] = 1;
itemProbabilities[ActorType[ActorType.LONG_BOW]] = [[5, 1]];
itemProbabilities[ActorType[ActorType.CROSSBOW]] = 1;
itemProbabilities[ActorType[ActorType.SHORT_SWORD]] = [[4, 1], [12, 0]];
itemProbabilities[ActorType[ActorType.WAND_OF_FROST]] = 1;
itemProbabilities[ActorType[ActorType.STAFF_OF_TELEPORTATION]] = 1;
itemProbabilities[ActorType[ActorType.STAFF_OF_LIFE_DETECTION]] = 1;
itemProbabilities[ActorType[ActorType.STAFF_OF_MAPPING]] = 1;
itemProbabilities[ActorType[ActorType.WOODEN_SHIELD]] = [[2, 1], [12, 0]];
itemProbabilities[ActorType[ActorType.LONGSWORD]] = [[6, 1]];
itemProbabilities[ActorType[ActorType.IRON_SHIELD]] = [[7, 1]];
itemProbabilities[ActorType[ActorType.GREATSWORD]] = [[8, 1]];
itemProbabilities[ActorType[ActorType.CANDLE]] = 10;
itemProbabilities[ActorType[ActorType.OIL_FLASK]] = 5;
itemProbabilities[ActorType[ActorType.TORCH]] = 5;
itemProbabilities[ActorType[ActorType.LANTERN]] = 1;
itemProbabilities[ActorType[ActorType.SUNROD]] = 1;

export let creatureProbabilities: Map.ActorProbabilityMap = {};
creatureProbabilities[ActorType[ActorType.GOBLIN]] = 60;
creatureProbabilities[ActorType[ActorType.ORC]] = 30;
creatureProbabilities[ActorType[ActorType.TROLL]] = [[3, 10], [5, 20], [7, 30]];

export let doorProbabilities: Map.ActorProbabilityMap = {};
doorProbabilities[ActorType[ActorType.WOODEN_DOOR]] = 80;
doorProbabilities[ActorType[ActorType.IRON_PORTCULLIS]] = 20;

export let wallLightProbabilities: Map.ActorProbabilityMap = {};
wallLightProbabilities[ActorType[ActorType.WALL_TORCH]] = 1;

export let keyProbabilities: Map.ActorProbabilityMap = {};
keyProbabilities[ActorType[ActorType.KEY]] = 1;
