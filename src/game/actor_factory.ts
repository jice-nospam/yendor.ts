/*
	Section: actors
*/
module Game {
    "use strict";
	/********************************************************************************
	 * Group: classes, types and factory
	 ********************************************************************************/
	/*
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
        // potion
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
        // miscellaneous
        STAIR_UP,
        STAIR_DOWN,
        WOODEN_DOOR,
        IRON_PORTCULLIS,
        KEY,

        ACTOR_TYPE_COUNT
    };

	/*
		Class: ActorFactory
		Built an actor.
	*/
    export class ActorFactory {
        private static seq: number = 0;
		/*
			Function: create
			Create an actor of given type

			Parameters:
			type - the <ActorType>
			x - the actor x coordinate (default 0)
			y - the actor y coordinate (default 0)
		*/
        static create(type: ActorType, x: number = 0, y: number = 0): Actor {
            var name: string = ActorType[type].toLowerCase().replace(/_/g, " ");
            if (actorDefs[name]) {
                return ActorFactory.createActor(type, x, y, name, actorDefs[name]);
            }
            log("ERROR : unknown actor type " + ActorType[type], Constants.LOG_CRIT_COLOR);
            return undefined;
        }

        private static createActor(type: ActorType, x: number, y: number, name: string, def: ActorDef) {
            var actor: Actor = type === ActorType.PLAYER ? new Player(name + "|" + ActorFactory.seq) : new Actor(name + "|" + ActorFactory.seq);
            ActorFactory.seq++;
            if (def.classes) {
                for (var i: number = 0, len: number = def.classes.length; i < len; ++i) {
                    var className = def.classes[i];
                    if (actorDefs[className]) {
                        ActorFactory.populateActor(type, actor, actorDefs[className]);
                    }
                }
            }
            ActorFactory.populateActor(type, actor, def);
            actor.name = name;
            actor.moveTo(x, y);
            return actor;
        }

        private static populateActor(type: ActorType,actor: Actor, def: ActorDef) {
            actor.init(def.ch, name, def.color, def.classes, def.plural,
                def.blockWalk, def.blockSight, def.displayOutOfFov);
            if (def.pickable) {
                actor.pickable = new Pickable(def.pickable);
            }
            if (def.ai) {
                actor.ai = ActorFactory.createAi(def.ai);
            }
            if (def.attacker) {
                actor.attacker = new Attacker(def.attacker);
            }
            if (def.destructible) {
                actor.destructible = new Destructible(def.destructible);
            }
            if (def.light) {
                actor.light = new Light(def.light);
                if ( type != ActorType.PLAYER ) {
                    actor.light.enable(actor);
                }
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
            if (def.door) {
                actor.door = new Door(def.door);
            }
            if (def.lever) {
                actor.lever = new Lever(def.lever, actor.id);
            }
            if ( def.xpHolder) {
                actor.xpHolder = new XpHolder(def.xpHolder);
            }
            if ( def.container) {
                actor.container = new Container(def.container, actor.ai);
            }
        }

        public static createEffector(def: EffectorDef) {
            return new Effector(ActorFactory.createEffect(def.effect), ActorFactory.createTargetSelector(def.targetSelector), def.message, def.destroyOnEffect);
        }

        private static createTargetSelector(def: TargetSelectorDef) {
            return new TargetSelector(def.method, def.range, def.radius);
        }

        private static createEffect(def: EffectDef) {
            switch (def.type) {
                case EffectType.CONDITION:
                    var conditionData: ConditionEffectDef = <ConditionEffectDef>def.data;
                    return new ConditionEffect(conditionData.type, conditionData.nbTurns, conditionData.successMessage, conditionData.additionalArgs);
                case EffectType.INSTANT_HEALTH:
                    var instantHealthData: InstantHealthEffectDef = <InstantHealthEffectDef>def.data;
                    return new InstantHealthEffect(instantHealthData.amount, instantHealthData.successMessage, instantHealthData.failureMessage);
                case EffectType.MAP_REVEAL:
                    return new MapRevealEffect();
                case EffectType.TELEPORT:
                    var teleportData: TeleportEffectDef = <TeleportEffectDef>def.data;
                    return new TeleportEffect(teleportData.successMessage);
                default:
                    return undefined;
            }
        }

        private static createAi(def: AiDef): Ai {
            switch (def.type) {
                case AiType.MONSTER:
                    return new MonsterAi(def.walkTime);
                case AiType.PLAYER:
                    return new PlayerAi(def.walkTime);
                default:
                    return undefined;
            }
        }

        static load(persister: Persister) {
            ActorFactory.seq = persister.loadFromKey(Constants.PERSISTENCE_ACTORS_SEQ_KEY);
        }

        static save(persister: Persister) {
            persister.saveToKey(Constants.PERSISTENCE_ACTORS_SEQ_KEY, ActorFactory.seq);
        }

        static deleteSavedGame(persister: Persister) {
            persister.deleteKey(Constants.PERSISTENCE_ACTORS_SEQ_KEY);
        }

		/*
			Function: setLock
			Associate a door with a key to create a locked door that can only be opened by this key
		*/
        static setLock(door: Actor, key: Actor) {
            door.lock = new Lockable(key.id);
        }
    }
}
