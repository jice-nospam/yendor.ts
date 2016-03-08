/*
	Section: actors
*/
module Game {
	"use strict";
	/********************************************************************************
	 * Group: classes, types and factory
	 ********************************************************************************/
    export type ActorClass  =
        "creature" |
            "beast" | 
            "human" |
        "potion" |
        "key" |
        "scroll" |
        "weapon" |
            "blade" |
            "shield" | 
            "ranged" | 
            "staff" |
            "projectile" |
                "arrow" |
                "bolt";
     
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
		LIGHTNING_BOLT_SCROLL,
		FIREBALL_SCROLL,
		CONFUSION_SCROLL,
		// weapon
		// 		blades
		SHORT_SWORD,
		LONG_SWORD,
		GREAT_SWORD,
		// 		shield
		WOODEN_SHIELD,
		IRON_SHIELD,
		// 		ranged
		SHORT_BOW,
		LONG_BOW,
		CROSSBOW,
		// 		staffs, wands and rods
		FROST_WAND,
		TELEPORT_STAFF,
		LIFE_DETECT_STAFF,
		MAP_REVEAL_STAFF,
		// 		projectile
		// 			arrow	
		BONE_ARROW,
		IRON_ARROW,
		// 			bolt
		BOLT,
		// miscellaneous
		STAIR_UP,
		STAIR_DOWN,
		WOODEN_DOOR,
		IRON_PORTCULLIS,
		KEY,
        
        ACTOR_TYPE_COUNT
	};

	interface BeastParam {
		hp: number;
		attack: number;
		defense: number;
		xp: number;
		walkTime: number;
		// really big creatures block fov
		transparent: boolean;
	}

	interface BladeParam {
		damages: number;
		attackTime: number;
		twoHanded: boolean;
		weight: number;
	}

	interface RangedParam {
		damages: number;
		projectileTypeName: ActorClass;
		loadTime: number;
		twoHanded: boolean;
		range: number;
	}

	interface ConditionParam {
		condType?: ConditionType;
		additionalArgs?: ConditionAdditionalParam;
		condMessage?: string;
		nbTurns?: number;
	}

	interface StaffParam {
		maxCharges: number;
		fireEffect?: Effect;
		fireTargetSelectionMethod: TargetSelectionMethod;
		fireMessage?: string;
		weight: number;
		twoHanded: boolean;
		range?: number;
	}

	interface StaffConditionParam extends ConditionParam, StaffParam {
	}

	interface PotionParam {
		useMessage: string;
		throwMessage: string;
	}

	interface InstantHealthPotionParam extends PotionParam {
		amount: number;
		useFailMessage: string;
		throwFailMessage: string;
	}

	interface ConditionPotionParam extends ConditionParam, PotionParam {
	}

	interface DoorParam {
		seeThrough: boolean;
		color: Core.Color;
		keyId?: ActorId;
	}

	interface ShieldParam {
		defense: number;
		color: Core.Color;
	}

	interface ProjectileParam {
		damages: number;
		projectileTypeName: ActorClass;
		color: Core.Color;
	}

	/*
		Class: ActorFactory
		Built an actor.
	*/
	export class ActorFactory {
		private static seq: number = 0;
		static load(persister: Persister) {
			ActorFactory.seq = persister.loadFromKey(Constants.PERSISTENCE_ACTORS_SEQ_KEY);
		}

		static save(persister: Persister) {
			persister.saveToKey(Constants.PERSISTENCE_ACTORS_SEQ_KEY, ActorFactory.seq);
		}

		static deleteSavedGame(persister: Persister) {
			persister.deleteKey(Constants.PERSISTENCE_ACTORS_SEQ_KEY);
		}

		private static builders: { [index: string]: (x: number, y: number) => Actor } = {
			// creature
			// 		beast
			GOBLIN: (x: number, y: number) => { return ActorFactory.createBeast(x, y, "g", "goblin", "goblin corpse", 0x3F7F3F,
				{ hp: 3, attack: 1, defense: 0, xp: 10, walkTime: 4, transparent: true } ); },
			ORC: (x: number, y: number) => { return ActorFactory.createBeast(x, y, "o", "orc", "dead orc", 0x3F7F3F,
				{ hp: 9, attack: 2, defense: 0, xp: 35, walkTime: 5, transparent: true } ); },
			TROLL: (x: number, y: number) => { return ActorFactory.createBeast(x, y, "T", "troll", "troll carcass", 0x007F00,
				{ hp: 15, attack: 3, defense: 1, xp: 100, walkTime: 6, transparent: false } ); },
			// 		human
			PLAYER: (x: number, y: number) => { return ActorFactory.createPlayer(x, y); },
			// potion
			HEALTH_POTION: (x: number, y: number) => {
				return ActorFactory.createInstantHealthPotion(x, y, "health potion",
					{amount: 5,
					useMessage: "[The actor1] drink[s] the health potion and regain[s] [value1] hit points.",
					useFailMessage: "[The actor1] drink[s] the health potion but it has no effect",
					throwMessage: "The potion explodes on [the actor1], healing [it] for [value1] hit points.",
					throwFailMessage: "The potion explodes on [the actor1] but it has no effect" });
			},
			REGENERATION_POTION: (x: number, y: number) => {
				return	ActorFactory.createConditionPotion(x, y, "regeneration potion", {
					nbTurns: 20, additionalArgs: {amount: 10},
					condType: ConditionType.REGENERATION,
					useMessage: "[The actor1] drink[s] the regeneration potion and feel[s]\nthe life flowing through [it].",
					throwMessage: "The potion explodes on [the actor1].\nLife is flowing through [it]."} );
			},
			// scroll
			LIGHTNING_BOLT_SCROLL: (x: number, y: number) => { return ActorFactory.createLightningBoltScroll(x, y, 5, 20); },
			FIREBALL_SCROLL: (x: number, y: number) => { return ActorFactory.createFireballScroll(x, y, 10, 3, 12); },
			CONFUSION_SCROLL: (x: number, y: number) => { return ActorFactory.createConfusionScroll(x, y, 5, 12); },
			// weapon
			// 		blade
			SHORT_SWORD: (x: number, y: number) => { return ActorFactory.createBlade(x, y, "short sword",
				{ damages: 4, attackTime: 4, twoHanded: false, weight: 2 } ); },
			LONG_SWORD: (x: number, y: number) => { return ActorFactory.createBlade(x, y, "longsword",
				{ damages: 6, attackTime: 5, twoHanded: false, weight: 3 } ); },
			GREAT_SWORD: (x: number, y: number) => { return ActorFactory.createBlade(x, y, "greatsword",
				{ damages: 10, attackTime: 6, twoHanded: true, weight: 4 } ); },
			// 		shield
			WOODEN_SHIELD: (x: number, y: number) => { return ActorFactory.createShield(x, y, "wooden shield",
				{ defense: 1, color: Constants.WOOD_COLOR } ); },
			IRON_SHIELD: (x: number, y: number) => { return ActorFactory.createShield(x, y, "iron shield",
				{ defense: 1.5, color: Constants.IRON_COLOR } ); },
			// 		ranged
			SHORT_BOW: (x: number, y: number) => { return ActorFactory.createRanged(x, y, "short bow",
				{ damages: 4, projectileTypeName: "arrow", loadTime: 4, twoHanded: true, range: 15 } ); },
			LONG_BOW: (x: number, y: number) => { return ActorFactory.createRanged(x, y, "long bow",
				{ damages: 8, projectileTypeName: "arrow", loadTime: 6, twoHanded: true, range: 30 } ); },
			CROSSBOW: (x: number, y: number) => { return ActorFactory.createRanged(x, y, "crossbow",
				{ damages: 8, projectileTypeName: "bolt", loadTime: 5, twoHanded: false, range: 10 } ); },
			//      staff
			FROST_WAND: (x: number, y: number) => { return ActorFactory.createConditionStaff(x, y, "wand of frost",
				{	maxCharges: 5, fireTargetSelectionMethod: TargetSelectionMethod.SELECTED_ACTOR,
					weight: 0.5, twoHanded: false, fireMessage: "[The actor1] zap[s] [its] wand of frost.",
					condType: ConditionType.FROZEN, nbTurns: 10, condMessage: "[The actor1] [is] covered with frost.",
					range: 5
				} ); },
			TELEPORT_STAFF: (x: number, y: number) => { return ActorFactory.createStaff(x, y, "staff of teleportation",
				{	maxCharges: 5, fireTargetSelectionMethod: TargetSelectionMethod.SELECTED_ACTOR,
					weight: 3, twoHanded: true, fireEffect: new TeleportEffect("[The actor1] disappear[s] suddenly."),
					range: 5 } ); },
			LIFE_DETECT_STAFF: (x: number, y: number) => { return ActorFactory.createConditionStaff(x, y, "staff of life detection",
				{	maxCharges: 5, fireTargetSelectionMethod: TargetSelectionMethod.ACTOR_ON_CELL,
					weight: 3, twoHanded: true, additionalArgs: {range: 15},
					condType: ConditionType.DETECT_LIFE, nbTurns: 10, condMessage: "[The actor1] [is] aware of life around [it]."
				} ); },
			MAP_REVEAL_STAFF: (x: number, y: number) => { return ActorFactory.createStaff(x, y, "staff of mapping",
				{	maxCharges: 5, fireTargetSelectionMethod: TargetSelectionMethod.ACTOR_ON_CELL,
					weight: 3, twoHanded: true, fireEffect: new MapRevealEffect() } ); },
			// 		projectile
			// 			arrow
			BONE_ARROW: (x: number, y: number) => { return ActorFactory.createProjectile(x, y, "bone arrow",
				{ damages: 1, projectileTypeName: "arrow", color: Constants.BONE_COLOR } ); },
			IRON_ARROW: (x: number, y: number) => { return ActorFactory.createProjectile(x, y, "iron arrow",
				{ damages: 1.25, projectileTypeName: "arrow", color: Constants.WOOD_COLOR } ); },
			// 			bolt
			BOLT: (x: number, y: number) => { return ActorFactory.createProjectile(x, y, "bolt",
				{ damages: 0.5, projectileTypeName: "bolt", color: Constants.IRON_COLOR } ); },
			// miscellaneous (under root class)
			STAIR_UP: (x: number, y: number) => { return ActorFactory.createStairs(x, y, "<", "up"); },
			STAIR_DOWN: (x: number, y: number) => { return ActorFactory.createStairs(x, y, ">", "down"); },
			WOODEN_DOOR: (x: number, y: number) => { return ActorFactory.createDoor(x, y, "wooden door",
				{ seeThrough: false, color: Constants.WOOD_COLOR } ); },
			IRON_PORTCULLIS: (x: number, y: number) => { return ActorFactory.createDoor(x, y, "iron portcullis",
				{ seeThrough: true, color: Constants.IRON_COLOR } ); },
			KEY: (x: number, y: number) => {
				return ActorFactory.createPickable(x, y, "key", "p", ["key"], Constants.IRON_COLOR, 0.2);
			}
		};
		/*
			Function: create
			Create an actor of given type

			Parameters:
			type - the <ActorType>
			x - the actor x coordinate (default 0)
			y - the actor y coordinate (default 0)
		*/
		static create(type: ActorType, x: number = 0, y: number = 0): Actor {
			var builder: (x: number, y: number) => Actor = ActorFactory.builders[ ActorType[type] ];
			var actor: Actor;
			if ( ! builder ) {
				log("ERROR : unknown actor type " + type, Constants.LOG_CRIT_COLOR);
			} else {
				actor = builder(x, y);
			}
			return actor;
		}

		/*
			Function: setLock
			Associate a door with a key to create a locked door that can only be opened by this key
		*/
		static setLock(door: Actor, key: Actor) {
			door.lock = new Lockable(key.id);
		}

		// generic
		private static createPickable(x: number, y: number, name: string, ch: string, type: ActorClass[],
			col: Core.Color, weight: number, singular: boolean = true) {
			var actor: Actor = new Actor(name + "|" + ActorFactory.seq);
			ActorFactory.seq++;
			actor.init(x, y, ch, name, col, type, singular);
			actor.pickable = new Pickable(weight, false);
			return actor;
		}

		// potions
		private static createEffectPotion(x: number, y: number, name: string, onUseEffector: Effector, onThrowEffector?: Effector): Actor {
			var effectPotion = this.createPickable(x, y, name, "!", ["potion"], 0x800080, 0.5, true);
			if ( onUseEffector ) {
				effectPotion.pickable.setOnUseEffector(onUseEffector);
			}
			if (onThrowEffector) {
				effectPotion.pickable.setOnThrowEffector(onThrowEffector);
			}
			return effectPotion;
		}

		private static createConditionPotion(x: number, y: number, name: string, param: ConditionPotionParam) {
			return ActorFactory.createEffectPotion(x, y, name,
				new Effector(new ConditionEffect(param.condType, param.nbTurns,
					param.useMessage, param.additionalArgs),
					new TargetSelector( TargetSelectionMethod.ACTOR_ON_CELL ), undefined, true),
				new Effector(new ConditionEffect(param.condType, param.nbTurns,
					param.throwMessage, param.additionalArgs),
					new TargetSelector( TargetSelectionMethod.ACTOR_ON_CELL ), undefined, true)
				);
		}

		private static createInstantHealthPotion(x: number, y: number, name: string, param: InstantHealthPotionParam): Actor {
			return ActorFactory.createEffectPotion(x, y, name,
				new Effector(new InstantHealthEffect(param.amount, param.useMessage, param.useFailMessage),
					new TargetSelector( TargetSelectionMethod.ACTOR_ON_CELL ), undefined, true),
				new Effector(new InstantHealthEffect(param.amount, param.throwMessage, param.throwFailMessage),
					new TargetSelector( TargetSelectionMethod.ACTOR_ON_CELL ), undefined, true)
				);
		}

		// scrolls
		private static createLightningBoltScroll(x: number, y: number, range: number, damages: number): Actor {
			var lightningBolt = this.createPickable(x, y, "scroll of lightning bolt", "#", ["scroll"], Constants.PAPER_COLOR, 0.1);
			lightningBolt.pickable.setOnUseEffect(new InstantHealthEffect(-damages,
				"A lightning bolt strikes [the actor1] with a loud thunder!\nThe damage is [value1] hit points."),
				new TargetSelector( TargetSelectionMethod.CLOSEST_ENEMY, range), undefined, true);
			return lightningBolt;
		}

		private static createFireballScroll(x: number, y: number, range: number, radius: number, damages: number): Actor {
			var fireball = this.createPickable(x, y, "scroll of fireball", "#", ["scroll"], Constants.PAPER_COLOR, 0.1);
			fireball.pickable.setOnUseEffect(new InstantHealthEffect(-damages,
				"[The actor1] get[s] burned for [value1] hit points."),
				new TargetSelector( TargetSelectionMethod.SELECTED_RANGE, range, radius),
				"A fireball explodes, burning everything within " + radius + " tiles.", true);
			return fireball;
		}

		private static createConfusionScroll(x: number, y: number, range: number, nbTurns: number): Actor {
			var confusionScroll = this.createPickable(x, y, "scroll of confusion", "#", ["scroll"], Constants.PAPER_COLOR, 0.1);
			confusionScroll.pickable.setOnUseEffect(new ConditionEffect(ConditionType.CONFUSED, nbTurns,
				"[The actor1's] eyes look vacant,\nas [it] start[s] to stumble around!"),
				new TargetSelector( TargetSelectionMethod.SELECTED_ACTOR, range), undefined, true);
			return confusionScroll;
		}

		// weapons
		private static createBlade(x: number, y: number, name: string, swordParam: BladeParam): Actor {
			var sword = this.createPickable(x, y, name, "/", ["weapon","blade"], Constants.STEEL_COLOR, swordParam.weight);
			sword.pickable.setOnThrowEffect(new InstantHealthEffect(-swordParam.damages,
				"The sword hits [the actor1] for [value1] hit points."),
				new TargetSelector( TargetSelectionMethod.ACTOR_ON_CELL ));
			sword.attacker = new Attacker(swordParam.damages, swordParam.attackTime);
			sword.equipment = new Equipment(swordParam.twoHanded ? Constants.SLOT_BOTH_HANDS : Constants.SLOT_RIGHT_HAND);
			return sword;
		}

		private static createRanged(x: number, y: number, name: string, rangedParam: RangedParam): Actor {
			var bow = this.createPickable(x, y, name, ")", ["weapon","ranged"], Constants.WOOD_COLOR, 2);
			bow.equipment = new Equipment(rangedParam.twoHanded ? Constants.SLOT_BOTH_HANDS : Constants.SLOT_RIGHT_HAND);
			bow.ranged = new Ranged(rangedParam.damages, rangedParam.projectileTypeName,
				rangedParam.loadTime, rangedParam.range);
			return bow;
		}

		private static createStaff(x: number, y: number, name: string, staffParam: StaffParam): Actor {
			var staff = this.createPickable(x, y, name, "/", ["weapon","staff"], 0xF0E020, staffParam.weight);
			staff.equipment = new Equipment(staffParam.twoHanded ? Constants.SLOT_BOTH_HANDS : Constants.SLOT_RIGHT_HAND);
			staff.magic = new Magic(staffParam.maxCharges);
			staff.magic.setFireEffector(staffParam.fireEffect, new TargetSelector(staffParam.fireTargetSelectionMethod,
				staffParam.range),	staffParam.fireMessage);
			return staff;
		}

		private static createConditionStaff(x: number, y: number, name: string, staffParam: StaffConditionParam): Actor {
			staffParam.fireEffect = new ConditionEffect(staffParam.condType, staffParam.nbTurns, staffParam.condMessage, staffParam.additionalArgs);
			return ActorFactory.createStaff(x, y, name, staffParam);
		}

		private static createProjectile(x: number, y: number, name: string, projectileParam: ProjectileParam): Actor {
			var projectile = this.createPickable(x, y, name, "\\", ["weapon","projectile",projectileParam.projectileTypeName], projectileParam.color, 0.1);
			projectile.pickable.setOnThrowEffect(new InstantHealthEffect(-projectileParam.damages,
				"The " + name + " hits [the actor1] for [value1] points."),
				new TargetSelector( TargetSelectionMethod.ACTOR_ON_CELL));
			projectile.equipment = new Equipment(Constants.SLOT_QUIVER);
			return projectile;
		}

		private static createShield(x: number, y: number, name: string, shieldParam: ShieldParam): Actor {
			var shield = this.createPickable(x, y, name, "[", ["weapon","shield"], shieldParam.color, 5);
			shield.pickable.setOnThrowEffect(new ConditionEffect(ConditionType.STUNNED, 2,
				"The shield hits [the actor1] and stuns [it]!"),
				new TargetSelector( TargetSelectionMethod.ACTOR_ON_CELL));
			shield.equipment = new Equipment(Constants.SLOT_LEFT_HAND, shieldParam.defense);
			return shield;
		}

		// miscellaneous
		private static createStairs(x: number, y: number, character: string, direction: string): Actor {
			var stairs: Actor = new Actor("stairs " + direction + "|" + ActorFactory.seq);
			ActorFactory.seq++;
			stairs.init(x, y, character, "stairs " + direction, 0xFFFFFF, undefined, false);
			stairs.fovOnly = false;
			return stairs;
		}

		private static createDoor(x: number, y: number, name: string, doorParam: DoorParam): Actor {
			var door: Actor = new Actor(name + "|" + ActorFactory.seq);
			ActorFactory.seq++;
			door.init(x, y, "+", name, doorParam.color, undefined, true);
			door.door = new Door(doorParam.seeThrough);
			door.fovOnly = false;
			door.blocks = true;
			door.transparent = doorParam.seeThrough;
			door.lever = new Lever(LeverAction.OPEN_CLOSE_DOOR, door.id);
			return door;
		}

		/*
			creature factories
		*/
		private static createBeast(x: number, y: number, character: string, name: string, corpseName: string, color: Core.Color,
			beastParam: BeastParam): Actor {
			var beast: Actor = new Actor(name + "|" + ActorFactory.seq);
			ActorFactory.seq++;
			beast.init(x, y, character, name, color, ["creature","beast"], true);
			beast.destructible = new MonsterDestructible(beastParam.hp, beastParam.defense, corpseName);
			beast.attacker = new Attacker(beastParam.attack, beastParam.walkTime);
			beast.ai = new MonsterAi(beastParam.walkTime);
			beast.blocks = true;
			beast.destructible.xp = beastParam.xp;
			beast.transparent = beastParam.transparent;
			return beast;
		}

		private static createPlayer(x: number, y: number): Player {
			var player = new Player("player|" + ActorFactory.seq);
			ActorFactory.seq++;
			player.init(x, y, "@", "player", 0xFFFFFF);
			return player;
		}
	}
}
