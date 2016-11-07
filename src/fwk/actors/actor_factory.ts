/**
 * Section: actors
 */
import * as Core from "../core/main";
import * as Yendor from "../yendor/main";
import * as Umbra from "../umbra/main";
import { Actor, IProbabilityMap } from "./actor";
import {
    IActorDef, IDoorDef, IEffectorDef, IEventEffectDef, IEffectDef,
    ActivableTypeEnum, ITargetSelectorDef, EffectTypeEnum, IConditionEffectDef, IInstantHealthEffectDef,
    ITeleportEffectDef, IConditionDef, AiTypeEnum, IAiDef,
} from "./actor_def";
import {
    Destructible, Attacker, Activable, Container, Pickable, Equipment, Ranged,
    Magic, Lockable, Door, Lever,
} from "./actor_item";
import { BaseAi, XpHolder, ItemAi, MonsterAi, PlayerAi } from "./actor_creature";
import { Light } from "./actor_light";
import { IInventoryItemPicker, ILootHandler } from "./actor_creature";
import {
    ITilePicker, Effector, TargetSelector, ConditionEffect, InstantHealthEffect, MapRevealEffect,
    TeleportEffect, EventEffect, IEffect,
} from "./actor_effect";
import { Condition } from "./actor_condition";
import { PERSISTENCE_ACTORS_SEQ_KEY } from "./base";

/**
 * =============================================================================
 * Group: classes, types and factory
 * =============================================================================
 */
/**
 * Class: ActorFactory
 * Built an actor.
 */
export class ActorFactory {

    public static registerBehaviorTree(tree: Yendor.BehaviorTree) {
        let nameHash: number = Core.crc32(tree.name);
        ActorFactory.btTrees[nameHash] = tree;
    }

    public static registerActorDef(actorDef: IActorDef) {
        ActorFactory.actorDefs[actorDef.name] = actorDef;
        ActorFactory.actorTypes.push(actorDef.name);
    }

    public static getActorDef(actorType: string): IActorDef {
        let def: IActorDef = ActorFactory.actorDefs[actorType];
        if (def === undefined) {
            Umbra.logger.warn("WARN: unknown actor type " + actorType);
        }
        return def;
    }

    public static getActorTypes(): string[] {
        return ActorFactory.actorTypes;
    }

    public static computeLevelProbabilities(probabilities: IProbabilityMap,
        level: number): { [index: string]: number } {
        let ret: { [index: string]: number } = {};
        for (let itemProb of probabilities.classProb) {
            if (!itemProb.clazz) {
                continue;
            }
            if (typeof (itemProb.prob) === "number") {
                ret[itemProb.clazz] = <number>itemProb.prob;
            } else {
                ret[itemProb.clazz] = ActorFactory.getValueForLevel(<number[][]>itemProb.prob, level);
            }
        }
        return ret;
    }

    public static createRandomActors(map: IProbabilityMap, level: number): Actor[] {
        let count: number = ActorFactory.getRandomCountFromMap(map);
        let result: Actor[] = [];
        let probMap: { [index: string]: number } = ActorFactory.computeLevelProbabilities(map, level);
        while (count > 0) {
            let clazz: string = <string>Actor.lootRng.getRandomChance(probMap);
            if (clazz && clazz !== "undefined") {
                let actor: Actor | undefined = this.createRandomActor(clazz);
                if (actor) {
                    result.push(actor);
                }
            }
            count--;
        }
        return result;
    }

    public static createRandomActor(clazz: string): Actor | undefined {
        let def: IActorDef = ActorFactory.getActorDef(clazz);
        if (!def) {
            Umbra.logger.warn("WARN : unknown actor type " + clazz);
            return undefined;
        } else {
            if (def.abstract) {
                clazz = ActorFactory.getRandomActorClass(clazz);
            }
            let actor: Actor | undefined = ActorFactory.create(clazz);
            if (actor) {
                actor.register();
            }
            return actor;
        }
    }

    /**
     * Function: create
     * Create an actor of given type
     * Parameters:
     * type - the actor type name
     * tilePicker - way for the actor to chose a tile
     * inventoryPicker - way for the actor to chose an item in its inventory
     */
    public static create(type: string, tilePicker?: ITilePicker, inventoryPicker?: IInventoryItemPicker,
        lootHandler?: ILootHandler): Actor | undefined {
        if (ActorFactory.actorDefs[type]) {
            return ActorFactory.createActor(ActorFactory.actorDefs[type], tilePicker,
                inventoryPicker, lootHandler);
        }
        if (!ActorFactory.unknownClasses[type]) {
            Umbra.logger.warn("WARN : unknown actor type " + type);
            ActorFactory.unknownClasses[type] = true;
        }
        return undefined;
    }

    public static createInContainer(container: Actor, types: string[]) {
        for (let type of types) {
            let actor: Actor | undefined = ActorFactory.create(type);
            if (actor) {
                actor.register();
                if (actor.pickable) {
                    actor.pickable.pick(actor, container, false);
                }
            }
        }
    }

    public static createEffector(def: IEffectorDef) {
        return new Effector(ActorFactory.createEffect(def.effect),
            ActorFactory.createTargetSelector(def.targetSelector), def.message, def.destroyOnEffect);
    }

    public static load(persister: Yendor.IPersister): Promise<void> {
        return new Promise<void>((resolve) => {
            persister.loadFromKey(PERSISTENCE_ACTORS_SEQ_KEY).then((value) => { ActorFactory.seq = value; resolve(); });
        });
    }

    public static save(persister: Yendor.IPersister) {
        persister.saveToKey(PERSISTENCE_ACTORS_SEQ_KEY, ActorFactory.seq);
    }

    public static deleteSavedGame(persister: Yendor.IPersister) {
        persister.deleteKey(PERSISTENCE_ACTORS_SEQ_KEY);
    }

    /**
     * Function: setLock
     * Associate a door with a key to create a locked door that can only be opened by this key
     */
    public static setLock(door: Actor, key: Actor) {
        door.lock = new Lockable(key.id);
    }

    public static getActorTypeName(type: string, count: number): string {
        let def: IActorDef = ActorFactory.getActorDef(type);
        if (!def) {
            Umbra.logger.error("Unknown actor type " + type);
            return "";
        }
        if (count === 1) {
            if (def.name.indexOf("[s]") !== -1) {
                return def.name.replace("[s]", "");
            } else if (def.name.indexOf("[es]") !== -1) {
                return def.name.replace("[es]", "");
            }
            return def.name;
        } else {
            if (def.name.indexOf("[s]") !== -1) {
                return def.name.replace("[s]", "s");
            } else if (def.name.indexOf("[es]") !== -1) {
                return def.name.replace("[es]", "es");
            }
            return def.pluralName === undefined ? def.name : def.pluralName;
        }
    }

    public static getBehaviorTree(name: string): Yendor.BehaviorTree {
        let nameHash: number = Core.crc32(name);
        return ActorFactory.btTrees[nameHash];
    }

    private static seq: number = 1;
    private static unknownClasses: { [index: string]: boolean } = {};
    private static actorDefs: { [index: string]: IActorDef } = {};
    private static actorTypes: string[] = [];
    private static btTrees: { [index: string]: Yendor.BehaviorTree } = {};

    /**
     * Function: getValueForDungeon
     * Get a value adapted to current dungeon level.
     * Parameters:
     * steps: array of (dungeon level, value) pairs
     */
    private static getValueForLevel(steps: number[][], level: number): number {
        let stepCount = steps.length;
        for (let step = stepCount - 1; step >= 0; --step) {
            if (level >= steps[step][0]) {
                return steps[step][1];
            }
        }
        return 0;
    }

    private static getRandomCountFromMap(map: IProbabilityMap): number {
        if (map.maxCount !== undefined) {
            return Actor.lootRng.getNumber(map.minCount || 0, map.maxCount);
        } else if (map.countProb !== undefined) {
            return <number>Actor.lootRng.getRandomChance(map.countProb);
        } else {
            return 0;
        }
    }

    /**
     * Return all concrete actor classes implementing given class
     */
    private static getConcreteActorClass(clazz: string, candidates?: string[]) {
        candidates = candidates || [];
        for (let type in ActorFactory.actorDefs) {
            if (ActorFactory.actorDefs.hasOwnProperty(type)) {
                let def: IActorDef = ActorFactory.actorDefs[type];
                if (def.prototypes && def.prototypes.indexOf(clazz) !== -1) {
                    if (def.abstract) {
                        ActorFactory.getConcreteActorClass(type, candidates);
                    } else {
                        candidates.push(type);
                    }
                }
            }
        }
        return candidates;
    }

    private static getRandomActorClass(clazz: string): string {
        let candidates: string[] = ActorFactory.getConcreteActorClass(clazz);
        let idx: number = Actor.lootRng.getNumber(0, candidates.length - 1);
        return candidates[idx];
    }

    private static createActor(def: IActorDef, tilePicker?: ITilePicker,
        inventoryPicker?: IInventoryItemPicker, lootHandler?: ILootHandler) {
        let actor: Actor = new Actor(def.name + "|" + ActorFactory.seq);
        ActorFactory.seq++;
        ActorFactory.populateActor(actor, def, tilePicker, inventoryPicker, lootHandler);
        actor.name = ActorFactory.getActorTypeName(def.name, 1);
        actor.pluralName = ActorFactory.getActorTypeName(def.name, 2);
        if (!actor.charCode) {
            Umbra.logger.critical("ERROR : no character defined for actor type " + def.name);
        }
        return actor;
    }

    private static populateActor(actor: Actor, def: IActorDef, tilePicker?: ITilePicker,
        inventoryPicker?: IInventoryItemPicker, lootHandler?: ILootHandler) {
        if (def.prototypes) {
            for (let className of def.prototypes) {
                if (ActorFactory.actorDefs[className]) {
                    ActorFactory.populateActor(actor, ActorFactory.actorDefs[className], tilePicker,
                        inventoryPicker, lootHandler);
                } else if (!ActorFactory.unknownClasses[className]) {
                    Umbra.logger.warn("WARN : unknown actor class " + className);
                    ActorFactory.unknownClasses[className] = true;
                }
            }
        }
        actor.init(def);
        if (def.pickable) {
            actor.pickable = new Pickable(def.pickable);
        }
        if (def.ai) {
            actor.ai = ActorFactory.createAi(actor, def.ai, tilePicker, inventoryPicker, lootHandler);
        }
        if (def.attacker) {
            actor.attacker = new Attacker(def.attacker);
        }
        if (def.destructible) {
            actor.destructible = new Destructible(def.destructible, actor.destructible);
        }
        if (def.light) {
            actor.light = new Light(def.light);
        }
        if (def.equipment) {
            actor.equipment = new Equipment(def.equipment);
        }
        if (def.ranged) {
            actor.ranged = new Ranged(def.ranged);
        }
        if (def.magic) {
            actor.magic = new Magic(def.magic);
        }
        if (def.xpHolder) {
            actor.xpHolder = new XpHolder(def.xpHolder);
        }
        if (def.container) {
            actor.container = new Container(def.container, actor.ai);
        }
        if (def.activable) {
            if (actor.activable) {
                actor.activable.init(def.activable);
            } else {
                switch (def.activable.type) {
                    case ActivableTypeEnum.SINGLE:
                    case ActivableTypeEnum.TOGGLE:
                        actor.activable = new Activable(def.activable);
                        break;
                    case ActivableTypeEnum.DOOR:
                        actor.activable = new Door(<IDoorDef>def.activable);
                        break;
                    case ActivableTypeEnum.LEVER:
                        actor.activable = new Lever(def.activable);
                        break;
                    default: break;
                }
            }
        }
    }

    private static createTargetSelector(def: ITargetSelectorDef) {
        return new TargetSelector(def);
    }

    private static createEffect(def: IEffectDef): IEffect {
        switch (def.type) {
            case EffectTypeEnum.CONDITION:
                let conditionData: IConditionEffectDef = <IConditionEffectDef>def;
                return new ConditionEffect(conditionData, conditionData.successMessage);
            case EffectTypeEnum.INSTANT_HEALTH:
                let instantHealthData: IInstantHealthEffectDef = <IInstantHealthEffectDef>def;
                return new InstantHealthEffect(instantHealthData);
            case EffectTypeEnum.MAP_REVEAL:
                return new MapRevealEffect();
            case EffectTypeEnum.TELEPORT:
                let teleportData: ITeleportEffectDef = <ITeleportEffectDef>def;
                return new TeleportEffect(teleportData.successMessage);
            case EffectTypeEnum.EVENT:
            default:
                let eventData: IEventEffectDef = <IEventEffectDef>def;
                return new EventEffect(eventData);
        }
    }

    private static createCondition(def: IConditionDef): Condition {
        return Condition.create(def);
    }

    private static createAi(owner: Actor, def: IAiDef, tilePicker?: ITilePicker, inventoryPicker?: IInventoryItemPicker,
        lootHandler?: ILootHandler): BaseAi {
        let ai: BaseAi;
        switch (def.type) {
            case AiTypeEnum.ITEM:
                ai = new ItemAi(def.walkTime);
                break;
            case AiTypeEnum.MONSTER:
                ai = new MonsterAi(def.walkTime, owner.ai);
                break;
            case AiTypeEnum.PLAYER:
            default:
                ai = new PlayerAi(def.walkTime, tilePicker, inventoryPicker, lootHandler);
                break;
        }
        if (def.conditions) {
            for (let conditionDef of def.conditions) {
                ai.addCondition(ActorFactory.createCondition(conditionDef), owner);
            }
        }
        if (def.treeName) {
            ai.behaviorTree = ActorFactory.getBehaviorTree(def.treeName);
        }
        return ai;
    }
}
