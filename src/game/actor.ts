/*
	Section: actors
*/
module Game {
	"use strict";
	/********************************************************************************
	 * Group: classes, types and factory
	 ********************************************************************************/

	/*
		class: ActorClass
		This stores a class hierarchy for all actors in the game.
		ActorClass.getRoot() is the root class that encompasses all actors.
		Current class hierarchy is :
		> root
		>    creature
		>        beast
		>        human
		>    potion
		>    scroll
		>    weapon
		>        blade
		>        shield
		>        ranged
		>        staff
		>        projectile
		>        	arrow
		>        	bolt
	*/
	export class ActorClass implements Persistent {
		className: string;
		_name: string;
		father: ActorClass;
		private static actorTypes: ActorClass[] = [];
		private static rootClass: ActorClass = new ActorClass("root");
		/*
			constructor
			To be used internally only. Typescript does not allow private constructors yet. Classes must be built using <buildClassHierarchy>.
		*/
		constructor(name: string, father?: ActorClass) {
			this.className = "ActorClass";
			this._name = name;
			this.father = father ? father : ActorClass.rootClass;
			ActorClass.actorTypes.push(this);
		}

		get name() { return this._name; }

		static getRoot(): ActorClass {
			return ActorClass.rootClass;
		}

		/*
			Function: getActorClass
			Returns: the ActorClass with given name or undefined if unknown
		*/
		static getActorClass(name: string): ActorClass {
			var n: number = ActorClass.actorTypes.length;
			for ( var i = 0; i < n; ++i ) {
				if ( ActorClass.actorTypes[i]._name === name ) {
					return ActorClass.actorTypes[i];
				}
			}
			return undefined;
		}

		/*
			Function: buildClassHierarchy
			Create a hierarchy of actor classes and return the last class.
			For example buildClassHierarchy("weapon|blade|sword") will return a "sword" actor class, 
			creating every class in the hierarchy that doesn't exist yet.

			Parameters:
				classes - list of class names separated with a pipe "|"
			Returns:
				the last class of the list, creating missing classes in the hierarchy
		*/
		static buildClassHierarchy(classes: string): ActorClass {
			var classArray: string[] = classes.split("|");
			var n: number = classArray.length;
			var currentClass: ActorClass = ActorClass.rootClass;
			for ( var i = 0; i < n; ++i ) {
				var newClass = ActorClass.getActorClass(classArray[i]);
				if (!newClass) {
					newClass = new ActorClass(classArray[i], currentClass);
				}
				currentClass = newClass;
			}
			return currentClass;
		}

		/*
			Function: isA
			Return true if this is a type
		*/
		isA(type: ActorClass): boolean {
			if ( this._name === type._name ) {
				return true;
			}
			if ( ! this.father || this.father._name === ActorClass.rootClass._name ) {
				return false;
			}
			return this.father.isA(type);
		}
	}

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
		// miscellaneous (under root class)
		STAIR_UP,
		STAIR_DOWN,
		WOODEN_DOOR,
		IRON_PORTCULLIS,
		KEY,
		LAST_ACTOR_TYPE
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
		projectileTypeName: string;
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
		color: Yendor.Color;
		keyId?: ActorId;
	}

	interface ShieldParam {
		defense: number;
		color: Yendor.Color;
	}

	interface ProjectileParam {
		damages: number;
		projectileTypeName: string;
		color: Yendor.Color;
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
				{ defense: 2, color: Constants.IRON_COLOR } ); },
			// 		ranged
			SHORT_BOW: (x: number, y: number) => { return ActorFactory.createRanged(x, y, "short bow",
				{ damages: 3, projectileTypeName: "arrow", loadTime: 4, twoHanded: true, range: 15 } ); },
			LONG_BOW: (x: number, y: number) => { return ActorFactory.createRanged(x, y, "long bow",
				{ damages: 6, projectileTypeName: "arrow", loadTime: 6, twoHanded: true, range: 30 } ); },
			CROSSBOW: (x: number, y: number) => { return ActorFactory.createRanged(x, y, "crossbow",
				{ damages: 4, projectileTypeName: "bolt", loadTime: 5, twoHanded: false, range: 10 } ); },
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
				{ damages: 1, projectileTypeName: "bolt", color: Constants.IRON_COLOR } ); },
			// miscellaneous (under root class)
			STAIR_UP: (x: number, y: number) => { return ActorFactory.createStairs(x, y, "<", "up"); },
			STAIR_DOWN: (x: number, y: number) => { return ActorFactory.createStairs(x, y, ">", "down"); },
			WOODEN_DOOR: (x: number, y: number) => { return ActorFactory.createDoor(x, y, "wooden door",
				{ seeThrough: false, color: Constants.WOOD_COLOR } ); },
			IRON_PORTCULLIS: (x: number, y: number) => { return ActorFactory.createDoor(x, y, "iron portcullis",
				{ seeThrough: true, color: Constants.IRON_COLOR } ); },
			KEY: (x: number, y: number) => {
				return ActorFactory.createPickable(x, y, "key", "p", Constants.IRON_COLOR, 0.2);
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
				log("ERROR : unknown actor type " + type, 0xFF0000);
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
		private static createPickable(x: number, y: number, name: string, ch: string,
			col: Yendor.Color, weight: number, singular: boolean = true) {
			var actor: Actor = new Actor(name + "|" + ActorFactory.seq);
			ActorFactory.seq++;
			actor.init(x, y, ch, name, undefined, col, singular);
			actor.pickable = new Pickable(weight, false);
			return actor;
		}

		// potions
		private static createEffectPotion(x: number, y: number, name: string, onUseEffector: Effector, onThrowEffector?: Effector): Actor {
			var effectPotion = new Actor(name + "|" + ActorFactory.seq);
			ActorFactory.seq++;
			effectPotion.init(x, y, "!", name, "potion", 0x800080, true);
			effectPotion.pickable = new Pickable(0.5, true);
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
			var lightningBolt = new Actor("scroll of lightning bolt|" + ActorFactory.seq);
			ActorFactory.seq++;
			lightningBolt.init(x, y, "#", "scroll of lightning bolt", "scroll", Constants.PAPER_COLOR, true);
			lightningBolt.pickable = new Pickable(0.1);
			lightningBolt.pickable.setOnUseEffect(new InstantHealthEffect(-damages,
				"A lightning bolt strikes [the actor1] with a loud thunder!\nThe damage is [value1] hit points."),
				new TargetSelector( TargetSelectionMethod.CLOSEST_ENEMY, range), undefined, true);
			return lightningBolt;
		}

		private static createFireballScroll(x: number, y: number, range: number, radius: number, damages: number): Actor {
			var fireball = new Actor("scroll of fireball|" + ActorFactory.seq);
			ActorFactory.seq++;
			fireball.init(x, y, "#", "scroll of fireball", "scroll", Constants.PAPER_COLOR, true);
			fireball.pickable = new Pickable(0.1);
			fireball.pickable.setOnUseEffect(new InstantHealthEffect(-damages,
				"[The actor1] get[s] burned for [value1] hit points."),
				new TargetSelector( TargetSelectionMethod.SELECTED_RANGE, range, radius),
				"A fireball explodes, burning everything within " + radius + " tiles.", true);
			return fireball;
		}

		private static createConfusionScroll(x: number, y: number, range: number, nbTurns: number): Actor {
			var confusionScroll = new Actor("scroll of confusion|" + ActorFactory.seq);
			ActorFactory.seq++;
			confusionScroll.init(x, y, "#", "scroll of confusion", "scroll", Constants.PAPER_COLOR, true);
			confusionScroll.pickable = new Pickable(0.1);
			confusionScroll.pickable.setOnUseEffect(new ConditionEffect(ConditionType.CONFUSED, nbTurns,
				"[The actor1's] eyes look vacant,\nas [it] start[s] to stumble around!"),
				new TargetSelector( TargetSelectionMethod.SELECTED_ACTOR, range), undefined, true);
			return confusionScroll;
		}

		// weapons
		private static createBlade(x: number, y: number, name: string, swordParam: BladeParam): Actor {
			var sword = new Actor(name + "|" + ActorFactory.seq);
			ActorFactory.seq++;
			sword.init(x, y, "/", name, "weapon|blade", Constants.STEEL_COLOR, true);
			sword.pickable = new Pickable(swordParam.weight);
			sword.pickable.setOnThrowEffect(new InstantHealthEffect(-swordParam.damages,
				"The sword hits [the actor1] for [value1] hit points."),
				new TargetSelector( TargetSelectionMethod.ACTOR_ON_CELL ));
			sword.attacker = new Attacker(swordParam.damages, swordParam.attackTime);
			sword.equipment = new Equipment(swordParam.twoHanded ? Constants.SLOT_BOTH_HANDS : Constants.SLOT_RIGHT_HAND);
			return sword;
		}

		private static createRanged(x: number, y: number, name: string, rangedParam: RangedParam): Actor {
			var bow = new Actor(name + "|" + ActorFactory.seq);
			ActorFactory.seq++;
			bow.init(x, y, ")", name, "weapon|ranged", Constants.WOOD_COLOR, true);
			bow.pickable = new Pickable(2);
			bow.equipment = new Equipment(rangedParam.twoHanded ? Constants.SLOT_BOTH_HANDS : Constants.SLOT_RIGHT_HAND);
			bow.ranged = new Ranged(rangedParam.damages, rangedParam.projectileTypeName,
				rangedParam.loadTime, rangedParam.range);
			return bow;
		}

		private static createStaff(x: number, y: number, name: string, staffParam: StaffParam): Actor {
			var staff = new Actor(name + "|" + ActorFactory.seq);
			ActorFactory.seq++;
			staff.init(x, y, "/", name, "weapon|staff", 0xF0E020, true);
			staff.pickable = new Pickable(staffParam.weight);
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
			var projectile = new Actor(name + "|" + ActorFactory.seq);
			ActorFactory.seq++;
			projectile.init(x, y, "\\", name, "weapon|projectile|" + projectileParam.projectileTypeName, projectileParam.color, true);
			projectile.pickable = new Pickable(0.1);
			projectile.pickable.setOnThrowEffect(new InstantHealthEffect(-projectileParam.damages,
				"The " + name + " hits [the actor1] for [value1] points."),
				new TargetSelector( TargetSelectionMethod.ACTOR_ON_CELL));
			projectile.equipment = new Equipment(Constants.SLOT_QUIVER);
			return projectile;
		}

		private static createShield(x: number, y: number, name: string, shieldParam: ShieldParam): Actor {
			var shield = new Actor(name + "|" + ActorFactory.seq);
			ActorFactory.seq++;
			shield.init(x, y, "[", name, "weapon|shield", shieldParam.color, true);
			shield.pickable = new Pickable(5);
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
			stairs.init(x, y, character, "stairs " + direction, undefined, 0xFFFFFF, false);
			stairs.fovOnly = false;
			return stairs;
		}

		private static createDoor(x: number, y: number, name: string, doorParam: DoorParam): Actor {
			var door: Actor = new Actor(name + "|" + ActorFactory.seq);
			ActorFactory.seq++;
			door.init(x, y, "+", name, undefined, doorParam.color, true);
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
		private static createBeast(x: number, y: number, character: string, name: string, corpseName: string, color: Yendor.Color,
			beastParam: BeastParam): Actor {
			var beast: Actor = new Actor(name + "|" + ActorFactory.seq);
			ActorFactory.seq++;
			beast.init(x, y, character, name, "creature|beast", color, true);
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

	/*
		Type: ActorId
		The CRC32 hashed value of the actor's readable id.
	*/
	export type ActorId = number;

	export interface ActorProcessor {
		(actor: Actor): void;
	}

	export interface ActorFilter {
		(actor: Actor): boolean;
	}

	/*
		Class: ActorManager
		Stores all the actors in the game.
	*/
	export class ActorManager {
		private playerId: ActorId;
		private stairsUpId: ActorId;
		private stairsDownId: ActorId;
		private creatureIds: ActorId[];
		private corpseIds: ActorId[];
		private updatingCorpseIds: ActorId[];
		private itemIds: ActorId[];
		private scheduler: Yendor.Scheduler = new Yendor.Scheduler();
		private actors: {[index: number]: Actor} = {};

		getPlayer() : Player {
			return <Player>this.actors[this.playerId];
		}

		getActor(id: ActorId) {
			return this.actors[id];
		}

		map(actorProcessor: ActorProcessor) {
			for (var index in this.actors) {
				if ( this.actors.hasOwnProperty(index) ) {
					actorProcessor(this.actors[index]);
				}
			}
		}

		filter(actorFilter: ActorFilter): Actor[] {
			var selectedActors: Actor[] = [];
			for (var index in this.actors) {
				if ( this.actors.hasOwnProperty(index) && actorFilter(this.actors[index])) {
					selectedActors.push(this.actors[index]);
				}
			}
			return selectedActors;
		}

		registerActor(actor: Actor) {
			if ( Yendor.urlParams[Constants.URL_PARAM_DEBUG] ) {
				console.log("new actor " + actor.readableId + "[" + actor.id.toString(16) + "]");
			}
			this.actors[actor.id] = actor;
		}

		addCreature( actor: Actor ) {
			this.creatureIds.push(actor.id);
			this.scheduler.add(actor);
			// possibly set the map transparency
			actor.moveTo(actor.x, actor.y);
		}

		addItem( actor: Actor ) {
			this.itemIds.push(actor.id);
			// possibly set the map transparency
			actor.moveTo(actor.x, actor.y);
		}

		getCreatureIds(): ActorId[] {
			return this.creatureIds;
		}

		getItemIds(): ActorId[] {
			return this.itemIds;
		}

		getCorpseIds(): ActorId[] {
			return this.corpseIds;
		}

		getStairsUp(): Actor {
			return this.actors[this.stairsUpId];
		}

		getStairsDown(): Actor {
			return this.actors[this.stairsDownId];
		}

		destroyActor(actorId: ActorId) {
			this.actors[actorId] = undefined;
			var idList: ActorId[] = this.creatureIds;
			var index: number = idList.indexOf(actorId);
			if ( index !== -1 ) {
				idList.splice(index, 1);
			}
			idList = this.itemIds;
			index = idList.indexOf(actorId);
			if ( index !== -1 ) {
				idList.splice(index, 1);
			}
			idList = this.corpseIds;
			index = idList.indexOf(actorId);
			if ( index !== -1 ) {
				idList.splice(index, 1);
			}
			idList = this.updatingCorpseIds;
			index = idList.indexOf(actorId);
			if ( index !== -1 ) {
				idList.splice(index, 1);
			}
		}

		clear() {
			// remove all actors but the player
			if (this.creatureIds) {
				this.creatureIds.forEach((actorId: ActorId) => {
					if ( actorId !== this.playerId ) {
						this.actors[actorId] = undefined;
					}
				});
				this.itemIds.forEach((actorId: ActorId) => { this.actors[actorId] = undefined; });
				this.corpseIds.forEach((actorId: ActorId) => { this.actors[actorId] = undefined; });
				this.updatingCorpseIds.forEach((actorId: ActorId) => { this.actors[actorId] = undefined; });
			}
			// TODO remove creature inventory items when creatures have inventory
			this.creatureIds = [];
			this.corpseIds = [];
			this.updatingCorpseIds = [];
			this.itemIds = [];
			this.scheduler.clear();
		}

		private renderActorList(actorIds: ActorId[], root: Yendor.Console) {
			var nbActors: number = actorIds.length;
			for (var i: number = 0; i < nbActors; i++) {
				var actor: Actor = this.actors[actorIds[i]];
				if ( Engine.instance.map.shouldRenderActor(actor) ) {
					actor.render(root);
				}
			}
		}

		renderActors(root: Yendor.Console) {
			this.renderActorList(this.corpseIds, root);
			this.renderActorList(this.itemIds, root);
			this.renderActorList(this.creatureIds, root);
		}

		isPlayerDead(): boolean {
			return this.getPlayer().destructible.isDead();
		}

		/*
			Function: updateActors
			Triggers actors' A.I. during a new game turn.
			Moves the dead actors from the actor list to the corpse list.
		*/
		updateActors() {
			var player: Actor = this.getPlayer();
			var oldPlayerX: number = player.x;
			var oldPlayerY: number = player.y;
			this.scheduler.run();
			this.moveDeadToCorpse();
			this.updateCorpses();
			if ( player.x !== oldPlayerX || player.y !== oldPlayerY) {
				// the player moved. Recompute the field of view
				Engine.instance.map.computeFov(player.x, player.y, Constants.FOV_RADIUS);
			}
		}

		private moveDeadToCorpse() {
			for ( var i: number = 0, len: number = this.creatureIds.length; i < len; ++i) {
				var actor: Actor = this.actors[this.creatureIds[i]];
				if ( actor.destructible && actor.destructible.isDead() ) {
					// actor is dead. move it to corpse list
					// note that corpses must still be updated until they have no active conditions
					// for example, to make it possible for corpses to unfreeze.
					if (! actor.ai.hasActiveConditions()) {
						this.scheduler.remove(actor);
					} else {
						this.updatingCorpseIds.push(actor.id);
					}
					this.creatureIds.splice( i, 1);
					i--;
					len--;
					this.corpseIds.push(actor.id);
				}
			}
		}

		private updateCorpses() {
			for ( var i: number = 0, len: number = this.updatingCorpseIds.length; i < len; ++i) {
				var actor: Actor = this.actors[this.updatingCorpseIds[i]];
				if ( ! actor.ai.hasActiveConditions()) {
					this.scheduler.remove(actor);
					this.updatingCorpseIds.splice(i, 1);
					i--;
					len--;
				}
			}
		}

		resume() {
			this.scheduler.resume();
		}

		pause() {
			if (! this.isPaused()) {
				Engine.instance.saveGame();
			}
			this.scheduler.pause();
		}

		isPaused() {
			return this.scheduler.isPaused();
		}

		removeItem(itemId: ActorId) {
			var idx: number = this.itemIds.indexOf(itemId);
			if ( idx !== -1 ) {
				this.itemIds.splice(idx, 1);
			}
		}

		/*
			Function: createStairs
			Create the actors for up and down stairs. The position is not important, actors will be placed by the dungeon builder.
		*/
		createStairs() {
			this.stairsUpId = ActorFactory.create(ActorType.STAIR_UP).id;
			this.stairsDownId = ActorFactory.create(ActorType.STAIR_DOWN).id;
			this.itemIds.push(this.stairsUpId);
			this.itemIds.push(this.stairsDownId);
		}

		createPlayer() {
			var player: Actor = ActorFactory.create(ActorType.PLAYER);
			this.playerId = player.id;
			this.addCreature(player);
		}

		load(persister: Persister) {
			this.actors = persister.loadFromKey(Constants.PERSISTENCE_ACTORS_KEY);
			this.creatureIds = persister.loadFromKey(Constants.PERSISTENCE_CREATURE_IDS_KEY);
			for ( var i: number = 0, len: number = this.creatureIds.length; i < len; ++i ) {
				this.scheduler.add(this.actors[this.creatureIds[i]]);
			}
			this.playerId = this.creatureIds[0];
			this.itemIds = persister.loadFromKey(Constants.PERSISTENCE_ITEM_IDS_KEY);
			this.stairsUpId = this.itemIds[0];
			this.stairsDownId = this.itemIds[1];
			this.corpseIds = persister.loadFromKey(Constants.PERSISTENCE_CORPSE_IDS_KEY);
			this.updatingCorpseIds = persister.loadFromKey(Constants.PERSISTENCE_UPDATING_CORPSE_IDS_KEY);
		}

		save(persister: Persister) {
			persister.saveToKey(Constants.PERSISTENCE_ACTORS_KEY, this.actors);
			persister.saveToKey(Constants.PERSISTENCE_CREATURE_IDS_KEY, this.creatureIds);
			persister.saveToKey(Constants.PERSISTENCE_ITEM_IDS_KEY, this.itemIds);
			persister.saveToKey(Constants.PERSISTENCE_CORPSE_IDS_KEY, this.corpseIds);
			persister.saveToKey(Constants.PERSISTENCE_UPDATING_CORPSE_IDS_KEY, this.updatingCorpseIds);
		}

		deleteSavedGame(persister: Persister) {
			persister.deleteKey(Constants.PERSISTENCE_ACTORS_KEY);
			persister.deleteKey(Constants.PERSISTENCE_CREATURE_IDS_KEY);
			persister.deleteKey(Constants.PERSISTENCE_ITEM_IDS_KEY);
			persister.deleteKey(Constants.PERSISTENCE_CORPSE_IDS_KEY);
			persister.deleteKey(Constants.PERSISTENCE_UPDATING_CORPSE_IDS_KEY);
		}
		/*
			Function: findClosestActor

			In the `actors` array, find the closest actor (except the player) from position `pos` within `range`.
			If range is 0, no range limitation.
		*/
		findClosestActor( pos: Yendor.Position, range: number, actorIds: ActorId[] ) : Actor {
			var bestDistance: number = 1E8;
			var closestActor: Actor = undefined;
			var nbActors: number = actorIds.length;
			for (var i: number = 0; i < nbActors; i++) {
				var actorId: ActorId = actorIds[i];
				if ( actorId !== this.playerId ) {
					var actor: Actor = this.actors[actorId];
					var distance: number = Yendor.Position.distance(pos, actor);
					if ( distance < bestDistance && (distance < range || range === 0) ) {
						bestDistance = distance;
						closestActor = actor;
					}
				}
			}
			return closestActor;
		}

		/*
			Function: findActorsOnCell

			Parameters:
			pos - a position on the map
			actors - the list of actors to scan (either actors, corpses or items)

			Returns:
			an array containing all the living actors on the cell

		*/
		findActorsOnCell( pos: Yendor.Position, actorIds: ActorId[]) : Actor[] {
			var actorsOnCell: Actor[] = [];
			var nbActors: number = actorIds.length;
			for (var i: number = 0; i < nbActors; i++) {
				var actor: Actor = this.actors[actorIds[i]];
				if ( actor.x === pos.x && actor.y === pos.y ) {
					actorsOnCell.push(actor);
				}
			}
			return actorsOnCell;
		}

		/*
			Function: findActorsInRange
			Returns all actor near a position

			Parameters:
			pos - a position on the map
			range - maximum distance from position
			actors - actor array to look up

			Returns:
			an actor array containing all actor within range
		*/
		findActorsInRange( pos: Yendor.Position, range: number, actorIds: ActorId[]): Actor[] {
			var actorsInRange: Actor[] = [];
			var nbActors: number = actorIds.length;
			for (var i: number = 0; i < nbActors; i++) {
				var actor: Actor = this.actors[actorIds[i]];
				if (Yendor.Position.distance(pos, actor) <= range ) {
					actorsInRange.push( actor );
				}
			}
			return actorsInRange;
		}

		/*
			Function: findAdjacentLever
			Return the first adjacent item having the lever feature

			Parameters:
			pos - a position on the map
		*/
		findAdjacentLever( pos: Yendor.Position ): Actor {
			var adjacentCells: Yendor.Position[] = pos.getAdjacentCells(Engine.instance.map.width, Engine.instance.map.height);
			var len: number = adjacentCells.length;
			// scan all 8 adjacent cells
			for ( var i: number = 0; i < len; ++i) {
				if ( !Engine.instance.map.isWall(adjacentCells[i].x, adjacentCells[i].y)) {
					var items: Actor[] = this.findActorsOnCell(adjacentCells[i], this.itemIds);
					for ( var j: number = 0, jlen: number = items.length; j < jlen; ++j) {
						if ( items[j].lever ) {
							return items[j];
						}
					}
				}
			}
			return undefined;
		}
	}

	/********************************************************************************
	 * Group: actors
	 ********************************************************************************/

	export enum ActorFeatureType {
		// can be destroyed/killed
		DESTRUCTIBLE,
		// can deal damages
		ATTACKER,
		// updates itself
		AI,
		// can be picked (put inside a container actor)
		PICKABLE,
		// can contain other actors
		CONTAINER,
		// can be equipped on a slot
		EQUIPMENT,
		// can throw away some type of actors
		RANGED,
		// has magic properties
		MAGIC,
		// can be open/closed. Can be combined with a lockable
		DOOR,
		// can be triggered by pressing E when standing on an adjacent cell
		LEVER,
		// can be locked/unlocked
		LOCKABLE,
	}

	export interface ActorFeature extends Persistent {
	}

	 /*
	 	Class: Actor
	 	The base class for all actors.
	 	Actor shouldn't hold references to other Actors, else there might be cyclic dependencies which
	 	keep the json serializer from working. Instead, hold ActorId and use ActorManager.getActor()
	 */
	export class Actor extends Yendor.Position implements Persistent, Yendor.TimedEntity {
		className: string;
		private _id: ActorId;
		private _readableId: string;
		private _type: ActorClass;
		// the ascii code of the symbol representing this actor on the map
		private _ch: number;
		// the name to be used by mouse look or the inventory screen
		name: string;
		// the color associated with this actor's symbol
		col: Yendor.Color;

		private features: { [index: number]: ActorFeature} = {};

		// whether you can walk on the tile where this actor is
		blocks: boolean = false;
		// whether light goes through this actor
		transparent: boolean = true;
		// whether you can see this actor only if it's in your field of view
		fovOnly: boolean = true;
		// whether this actor name is singular (you can write "a <name>")
		private _singular: boolean = true;

		get id() { return this._id; }
		get readableId() { return this._readableId; }

		constructor(readableId?: string) {
			super();
			this.className = "Actor";
			if (readableId) {
				// readableId is undefined when loading a game
				this._readableId = readableId;
				this._id = Yendor.crc32(readableId);
				Engine.instance.actorManager.registerActor(this);
			}
		}

		init(_x: number = 0, _y: number = 0, _ch: string = "", _name: string = "", types: string = "",
			col: Yendor.Color = "", singular: boolean = true) {
			this.moveTo(_x, _y);
			this._ch = _ch.charCodeAt(0);
			this.name = _name;
			this.col = col;
			this._singular = singular;
			this._type = types ? ActorClass.buildClassHierarchy(types) : ActorClass.getRoot();
		}

		moveTo(x: number, y: number) {
			if (! this.transparent) {
				Engine.instance.map.setTransparent(this.x, this.y, true);
				super.moveTo(x, y);
				Engine.instance.map.setTransparent(this.x, this.y, false);
			} else {
				super.moveTo(x, y);
			}
		}

		get waitTime() { return this.ai ? this.ai.waitTime : undefined ; }
		set waitTime(newValue: number) {
			if (this.ai) {
				this.ai.waitTime = newValue;
			}
		}

		isA(type: ActorClass): boolean {
			return this._type.isA(type);
		}

		get ch() { return String.fromCharCode(this._ch); }
		set ch(newValue: string) { this._ch = newValue.charCodeAt(0); }

		isSingular(): boolean {
			return this._singular;
		}

		isStackable(): boolean {
			return ! this.destructible && (! this.equipment || ! this.equipment.isEquipped() || this.equipment.getSlot() === Constants.SLOT_QUIVER);
		}

		// feature getters & setters
		get destructible(): Destructible { return <Destructible>this.features[ActorFeatureType.DESTRUCTIBLE]; }
		set destructible(newValue: Destructible) { this.features[ActorFeatureType.DESTRUCTIBLE] = newValue; }

		get attacker(): Attacker { return <Attacker>this.features[ActorFeatureType.ATTACKER]; }
		set attacker(newValue: Attacker) { this.features[ActorFeatureType.ATTACKER] = newValue; }

		get ai(): Ai { return <Ai>this.features[ActorFeatureType.AI]; }
		set ai(newValue: Ai) { this.features[ActorFeatureType.AI] = newValue; }

		get pickable(): Pickable {return <Pickable>this.features[ActorFeatureType.PICKABLE]; }
		set pickable(newValue: Pickable) { this.features[ActorFeatureType.PICKABLE] = newValue; }

		get container(): Container {return <Container>this.features[ActorFeatureType.CONTAINER]; }
		set container(newValue: Container) {this.features[ActorFeatureType.CONTAINER] = newValue; }

		get equipment(): Equipment {return <Equipment>this.features[ActorFeatureType.EQUIPMENT]; }
		set equipment(newValue: Equipment) {this.features[ActorFeatureType.EQUIPMENT] = newValue; }

		get ranged(): Ranged { return <Ranged>this.features[ActorFeatureType.RANGED]; }
		set ranged(newValue: Ranged) { this.features[ActorFeatureType.RANGED] = newValue; }

		get magic(): Magic { return <Magic>this.features[ActorFeatureType.MAGIC]; }
		set magic(newValue: Magic) { this.features[ActorFeatureType.MAGIC] = newValue; }

		get door(): Door { return <Door>this.features[ActorFeatureType.DOOR]; }
		set door(newValue: Door) { this.features[ActorFeatureType.DOOR] = newValue; }

		get lock(): Lockable { return <Lockable>this.features[ActorFeatureType.LOCKABLE]; }
		set lock(newValue: Lockable) { this.features[ActorFeatureType.LOCKABLE] = newValue; }

		get lever(): Lever { return <Lever>this.features[ActorFeatureType.LEVER]; }
		set lever(newValue: Lever) { this.features[ActorFeatureType.LEVER] = newValue; }

		/*
			Function: getaname
			Returns " a <name>" or " an <name>" or " <name>"
		*/
		getaname(): string {
			if ( !this.isSingular() ) {
				return " " + this.name;
			}
			var article: string = ("aeiou".indexOf(this.name[0]) !== -1 ? " an " : " a ");
			return article + this.name;
		}

		/*
			Function: getAname
			Returns "A <name>" or "An <name>" or "<name>"
		*/
		getAname(): string {
			if ( !this.isSingular() ) {
				return this.name;
			}
			var article: string = ("aeiou".indexOf(this.name[0]) !== -1 ? "An " : "A ");
			return article + this.name;
		}

		/*
			Function: getAname
			Returns "There's a <name>" or "There's an <name>" or "There are <name>"
		*/
		getTheresaname(): string {
			var verb = this.isSingular() ? "'s" : " are";
			return "There" + verb + this.getaname();
		}

		/*
			Function: getAname
			Returns " the <name>"
		*/
		getthename(): string {
			return " the " + this.name;
		}

		/*
			Function: getAname
			Returns "The <name>"
		*/
		getThename(): string {
			return "The " + this.name;
		}

		/*
			Function: getAname
			Returns "The <name>'s "
		*/
		getThenames(): string {
			return this.getThename() + "'s ";
		}

		/*
			Function: getAname
			Returns " the <name>'s "
		*/
		getthenames(): string {
			return this.getthename() + "'s ";
		}

		getits(): string {
			return " its ";
		}

		getit(): string {
			return " it";
		}

		getis(): string {
			return this.isSingular() ? " is" : " are";
		}

		getVerbEnd(): string {
			return this.isSingular() ? "s" : "";
		}

		getDescription(): string {
			var desc = this.name;
			if ( this.equipment && this.equipment.isEquipped()) {
				desc += " (on " + this.equipment.getSlot() + ")";
			}
			if ( this.ai ) {
				var condDesc: string = this.ai.getConditionDescription();
				if ( condDesc ) {
					desc += " (" + condDesc + ")";
				}
			}
			return desc;
		}

		update() {
			if ( this.ai ) {
				this.ai.update(this);
			}
		}

		render(root: Yendor.Console) {
			root.text[this.x][this.y] = this._ch;
			root.fore[this.x][this.y] = this.col;
		}

		/*
			Function: postLoad
			json.stringify cannot handle cyclic dependencies so we have to rebuild them here
		*/
		postLoad() {
			// rebuild container -> listener backlinks
			if ( this.ai && this.container ) {
				this.container.setListener(this.ai);
			}
		}

	}
}
