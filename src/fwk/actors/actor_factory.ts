/**
	Section: actors
*/
import * as Core from "../core/main";
import * as Umbra from "../umbra/main";
import {Actor} from "./actor";
import {ActorDef, DestructibleDef, AttackerDef, ContainerDef, PickableDef, EquipmentDef,
    RangedDef, MagicDef, ActivableDef, DoorDef, EffectorDef, EventEffectDef, EffectDef, ActivableType, TargetSelectorDef,
    EffectType, ConditionEffectDef, InstantHealthEffectDef, TeleportEffectDef, ConditionDef, AiType, AiDef} from "./actor_def";
import {Destructible, Attacker, Activable, Container, Pickable, Equipment, Ranged, Magic, Lockable, Door, Lever} from "./actor_item";
import {Ai, XpHolder, ItemAi, MonsterAi, PlayerAi} from "./actor_creature";
import {Light} from "./actor_light";
import {Player, InventoryItemPicker} from "./actor_creature";
import {TilePicker, Effector, Effect, TargetSelector, ConditionEffect, InstantHealthEffect, MapRevealEffect, TeleportEffect, EventEffect} from "./actor_effect";
import {Condition} from "./actor_condition";
import {PERSISTENCE_ACTORS_SEQ_KEY} from "./base";

/********************************************************************************
 * Group: classes, types and factory
 ********************************************************************************/
/**
    Class: ActorFactory
    Built an actor.
*/
export class ActorFactory {
    private static seq: number = 0;
    private static unknownClasses: { [index: string]: boolean } = {};
    private static actorDefs: { [index: string]: ActorDef };
    public static init(actorDefs: { [index: string]: ActorDef }) {
        ActorFactory.actorDefs = actorDefs;
    }
    /**
        Function: create
        Create an actor of given type

        Parameters:
        type - the actor type name
        tilePicker - way for the actor to chose a tile
        inventoryPicker - way for the actor to chose an item in its inventory
    */
    static create(type: string, tilePicker?: TilePicker, inventoryPicker?: InventoryItemPicker): Actor {
        let name: string = type.toLowerCase().replace(/_/g, " ");
        if (ActorFactory.actorDefs[name]) {
            return ActorFactory.createActor(type, name, ActorFactory.actorDefs[name], tilePicker, inventoryPicker);
        }
        if (!ActorFactory.unknownClasses[name]) {
            Umbra.logger.warn("WARN : unknown actor type " + type);
            ActorFactory.unknownClasses[name] = true;
        }
        return undefined;
    }

    private static createActor(type: string, name: string, def: ActorDef, tilePicker: TilePicker, inventoryPicker: InventoryItemPicker) {
        // TODO : Player should be just an Actor
        let actor: Actor = type === "PLAYER" ? new Player(name + "|" + ActorFactory.seq) : new Actor(name + "|" + ActorFactory.seq);
        ActorFactory.seq++;
        ActorFactory.populateActor(type, actor, def, tilePicker, inventoryPicker);
        actor.name = name;
        if (!actor.charCode) {
            Umbra.logger.critical("ERROR : no character defined for actor type " + type);
        }
        return actor;
    }

    private static populateActor(type: string, actor: Actor, def: ActorDef, tilePicker: TilePicker, inventoryPicker: InventoryItemPicker) {
        if (def.prototypes) {
            for (let i: number = 0, len: number = def.prototypes.length; i < len; ++i) {
                let className = def.prototypes[i];
                if (ActorFactory.actorDefs[className]) {
                    ActorFactory.populateActor(type, actor, ActorFactory.actorDefs[className], tilePicker, inventoryPicker);
                } else if (!ActorFactory.unknownClasses[className]) {
                    Umbra.logger.warn("WARN : unknown actor class " + className);
                    ActorFactory.unknownClasses[className] = true;
                }
            }
        }
        actor.init(undefined, def);
        if (def.pickable) {
            actor.pickable = new Pickable(def.pickable);
        }
        if (def.ai) {
            actor.ai = ActorFactory.createAi(actor, def.ai, tilePicker, inventoryPicker);
        }
        if (def.attacker) {
            actor.attacker = new Attacker(def.attacker);
        }
        if (def.destructible) {
            actor.destructible = new Destructible(def.destructible);
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
            if ( actor.activable ) {
                actor.activable.init(def.activable);
            } else {
                switch (def.activable.type) {
                    case ActivableType.SINGLE :
                    case ActivableType.TOGGLE :
                        actor.activable = new Activable(def.activable);
                        break;
                    case ActivableType.DOOR :
                        actor.activable = new Door(<DoorDef>def.activable);
                        break;
                    case ActivableType.LEVER :
                        actor.activable = new Lever(def.activable);
                        break;
                }
            }
        }
    }

    public static createEffector(def: EffectorDef) {
        return new Effector(ActorFactory.createEffect(def.effect), ActorFactory.createTargetSelector(def.targetSelector), def.message, def.destroyOnEffect);
    }

    private static createTargetSelector(def: TargetSelectorDef) {
        return new TargetSelector(def);
    }

    private static createEffect(def: EffectDef) {
        switch (def.type) {
            case EffectType.CONDITION:
                let conditionData: ConditionEffectDef = <ConditionEffectDef>def.data;
                return new ConditionEffect(conditionData.condition, conditionData.successMessage);
            case EffectType.INSTANT_HEALTH:
                let instantHealthData: InstantHealthEffectDef = <InstantHealthEffectDef>def.data;
                return new InstantHealthEffect(instantHealthData);
            case EffectType.MAP_REVEAL:
                return new MapRevealEffect();
            case EffectType.TELEPORT:
                let teleportData: TeleportEffectDef = <TeleportEffectDef>def.data;
                return new TeleportEffect(teleportData.successMessage);
            case EffectType.EVENT :
                let eventData: EventEffectDef = <EventEffectDef>def.data;
                return new EventEffect(eventData);
            default:
                return undefined;
        }
    }

    private static createCondition(def: ConditionDef): Condition {
        return Condition.create(def);
    }

    private static createAi(owner: Actor, def: AiDef, tilePicker: TilePicker, inventoryPicker: InventoryItemPicker): Ai {
        let ai: Ai;
        switch (def.type) {
            case AiType.ITEM:
                ai = new ItemAi(def.walkTime);
                break;
            case AiType.MONSTER:
                ai = new MonsterAi(def.walkTime);
                break;
            case AiType.PLAYER:
                ai = new PlayerAi(def.walkTime, tilePicker, inventoryPicker);
                break;
            default:
                return undefined;
        }
        if (def.conditions) {
            for (let i: number = 0, len: number = def.conditions.length; i < len; ++i) {
                let conditionDef: ConditionDef = def.conditions[i];
                ai.addCondition(ActorFactory.createCondition(conditionDef), owner);
            }
        }
        return ai;
    }

    static load(persister: Core.Persister): Promise<void> {
        return new Promise<void>((resolve) => {
            persister.loadFromKey(PERSISTENCE_ACTORS_SEQ_KEY).then((value) => { ActorFactory.seq = value; resolve(); });
        });
    }

    static save(persister: Core.Persister) {
        persister.saveToKey(PERSISTENCE_ACTORS_SEQ_KEY, ActorFactory.seq);
    }

    static deleteSavedGame(persister: Core.Persister) {
        persister.deleteKey(PERSISTENCE_ACTORS_SEQ_KEY);
    }

    /**
        Function: setLock
        Associate a door with a key to create a locked door that can only be opened by this key
    */
    static setLock(door: Actor, key: Actor) {
        door.lock = new Lockable(key.id);
    }
}
