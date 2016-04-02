/**
	Section: actors
*/
module Game {
    "use strict";
	/********************************************************************************
	 * Group: classes, types and factory
	 ********************************************************************************/
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

	/**
		Class: ActorFactory
		Built an actor.
	*/
    export class ActorFactory {
        private static seq: number = 0;
        private static unknownClasses: { [index: string]: boolean } = {};
		/**
			Function: create
			Create an actor of given type

			Parameters:
			type - the <ActorType>
			x - the actor x coordinate (default 0)
			y - the actor y coordinate (default 0)
		*/
        static create(type: ActorType): Actor {
            let name: string = ActorType[type].toLowerCase().replace(/_/g, " ");
            if (actorDefs[name]) {
                return ActorFactory.createActor(type, name, actorDefs[name]);
            }
            if (!ActorFactory.unknownClasses[name]) {
                log("WARN : unknown actor type " + ActorType[type], Constants.LOG_WARN_COLOR);
                ActorFactory.unknownClasses[name] = true;
            }
            return undefined;
        }

        private static createActor(type: ActorType, name: string, def: ActorDef) {
            let actor: Actor = type === ActorType.PLAYER ? new Player(name + "|" + ActorFactory.seq) : new Actor(name + "|" + ActorFactory.seq);
            ActorFactory.seq++;
            ActorFactory.populateActor(type, actor, def);
            actor.name = name;
            if (!actor.charCode) {
                log("ERROR : no character defined for actor type " + ActorType[type], Constants.LOG_CRIT_COLOR);
            }
            return actor;
        }

        private static populateActor(type: ActorType, actor: Actor, def: ActorDef) {
            if (def.classes) {
                for (let i: number = 0, len: number = def.classes.length; i < len; ++i) {
                    let className = def.classes[i];
                    if (actorDefs[className]) {
                        ActorFactory.populateActor(type, actor, actorDefs[className]);
                    } else if (!ActorFactory.unknownClasses[className]) {
                        log("WARN : unknown actor class " + className, Constants.LOG_WARN_COLOR);
                        ActorFactory.unknownClasses[className] = true;
                    }
                }
            }
            actor.init(name, def);
            if (def.pickable) {
                actor.pickable = new Pickable(def.pickable);
            }
            if (def.ai) {
                actor.ai = ActorFactory.createAi(actor, def.ai);
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
                        case ActivableType.NORMAL :
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
                default:
                    return undefined;
            }
        }

        private static createCondition(def: ConditionDef): Condition {
            return Condition.create(def);
        }

        private static createAi(owner: Actor, def: AiDef): Ai {
            let ai: Ai;
            switch (def.type) {
                case AiType.ITEM:
                    ai = new ItemAi(def.walkTime, owner);
                    break;
                case AiType.MONSTER:
                    ai = new MonsterAi(def.walkTime, owner);
                    break;
                case AiType.PLAYER:
                    ai = new PlayerAi(def.walkTime, owner);
                    break;
                default:
                    return undefined;
            }
            if (def.conditions) {
                for (let i: number = 0, len: number = def.conditions.length; i < len; ++i) {
                    let conditionDef: ConditionDef = def.conditions[i];
                    ai.addCondition(ActorFactory.createCondition(conditionDef));
                }
            }
            return ai;
        }

        static load(persister: Core.Persister) {
            ActorFactory.seq = persister.loadFromKey(Constants.PERSISTENCE_ACTORS_SEQ_KEY);
        }

        static save(persister: Core.Persister) {
            persister.saveToKey(Constants.PERSISTENCE_ACTORS_SEQ_KEY, ActorFactory.seq);
        }

        static deleteSavedGame(persister: Core.Persister) {
            persister.deleteKey(Constants.PERSISTENCE_ACTORS_SEQ_KEY);
        }

		/**
			Function: setLock
			Associate a door with a key to create a locked door that can only be opened by this key
		*/
        static setLock(door: Actor, key: Actor) {
            door.lock = new Lockable(key.id);
        }
    }
}
