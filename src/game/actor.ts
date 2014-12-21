/*
	Section: actors
*/
module Game {
	"use strict";

	export class ActorManager {
		private static _instance: ActorManager = new ActorManager();
		static get instance() { return ActorManager._instance; }

		private player: Player;
		private stairsUp: Actor;
		private stairsDown: Actor;
		private actors: Actor[];
		private corpses: Actor[];
		private items: Actor[];

		getPlayer() : Player {
			return this.player;
		}

		addCreature( actor: Actor ) {
			this.actors.push(actor);
		}

		addItem( actor: Actor ) {
			this.items.push(actor);
		}

		getCreatures(): Actor[] {
			return this.actors;
		}

		getItems(): Actor[] {
			return this.items;
		}

		getCorpses(): Actor[] {
			return this.corpses;
		}

		getStairsUp(): Actor {
			return this.stairsUp;
		}

		getStairsDown(): Actor {
			return this.stairsDown;
		}

		clear() {
			this.actors = [];
			this.corpses = [];
			this.items = [];
		}

		private renderActorList(actors: Actor[], map: Map) {
			var nbActors: number = actors.length;
			for (var i: number = 0; i < nbActors; i++) {
				var actor: Actor = actors[i];
				if ( map.shouldRenderActor(actor) ) {
					actor.render();
				}
			}
		}

		renderActors(map: Map) {
			this.renderActorList(this.corpses, map);
			this.renderActorList(this.items, map);
			this.renderActorList(this.actors, map);
		}

		isPlayerDead(): boolean {
			return this.player.destructible.isDead();
		}

		/*
			Function: updateActors
			Triggers actors' A.I. during a new game turn.
			Moves the dead actors from the actor list to the corpse list.
		*/
		updateActors(map: Map) {
			var nbActors: number = this.actors.length;
			for (var i = 1; i < nbActors; i++) {
				var actor: Actor = this.actors[i];
				actor.update( map );
				if ( actor.destructible && actor.destructible.isDead() ) {
					this.actors.splice(i, 1);
					i--;
					nbActors--;
					this.corpses.push(actor);
				}
			}
		}

		removeItem(item: Actor) {
			var idx: number = this.items.indexOf(item);
			if ( idx !== -1 ) {
				this.items.splice(idx, 1);
			}
		}

		/*
			Function: createStairs
			Create the actors for up and down stairs. The position is not important, actors will be placed by the dungeon builder.
		*/
		createStairs() {
			this.stairsUp = Actor.createStairs("<", "up");
			this.stairsDown = Actor.createStairs(">", "down");
			this.items.push(this.stairsUp);
			this.items.push(this.stairsDown);
		}

		createPlayer() {
			this.player = Actor.createPlayer();
			this.actors.push(this.player);
		}

		load(persister: Persister) {
			this.actors = persister.loadFromKey(Constants.PERSISTENCE_ACTORS_KEY);
			this.player = <Player>this.actors[0];
			this.items = persister.loadFromKey(Constants.PERSISTENCE_ITEMS_KEY);
			this.stairsUp = this.items[0];
			this.stairsDown = this.items[1];
			this.corpses = persister.loadFromKey(Constants.PERSISTENCE_CORPSES_KEY);
		}

		save(persister: Persister) {
			persister.saveToKey(Constants.PERSISTENCE_ACTORS_KEY, this.actors);
			persister.saveToKey(Constants.PERSISTENCE_ITEMS_KEY, this.items);
			persister.saveToKey(Constants.PERSISTENCE_CORPSES_KEY, this.corpses);
		}

		deleteSavedGame(persister: Persister) {
			persister.deleteKey(Constants.PERSISTENCE_ACTORS_KEY);
			persister.deleteKey(Constants.PERSISTENCE_ITEMS_KEY);
			persister.deleteKey(Constants.PERSISTENCE_CORPSES_KEY);
		}
		/*
			Function: findClosestActor

			In the `actors` array, find the closest actor (except the player) from position `pos` within `range`.
			If range is 0, no range limitation.
		*/
		findClosestActor( pos: Yendor.Position, range: number, actors: Actor[] ) : Actor {
			var bestDistance: number = 1E8;
			var closestActor: Actor = undefined;
			var player: Actor = this.getPlayer();
			actors.forEach(function(actor: Actor) {
				if ( actor !== player ) {
					var distance: number = Yendor.Position.distance(pos, actor);
					if ( distance < bestDistance && (distance < range || range === 0) ) {
						bestDistance = distance;
						closestActor = actor;
					}
				}
			});
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
		findActorsOnCell( pos: Yendor.Position, actors: Actor[]) : Actor[] {
			var actorsOnCell: Actor[] = [];
			var nbActors: number = actors.length;
			for (var i: number = 0; i < nbActors; i++) {
				var actor: Actor = actors[i];
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
		findActorsInRange( pos: Yendor.Position, range: number, actors: Actor[]): Actor[] {
			var actorsInRange: Actor[] = [];
			var nbActors: number = actors.length;
			for (var i: number = 0; i < nbActors; i++) {
				var actor: Actor = actors[i];
				if (Yendor.Position.distance(pos, actor) <= range ) {
					actorsInRange.push( actor );
				}
			}
			return actorsInRange;
		}
	}

	/********************************************************************************
	 * Group: combat
	 ********************************************************************************/

	/*
		Class: Destructible
		Something that can take damages and heal/repair.
	*/
	export class Destructible implements Persistent {
		className: string;
		private _maxHp: number;
		private _defense: number;
		private _hp: number;
		private _corpseName: string;
		private _xp: number = 0;
		/*
			Constructor: constructor

			Parameters:
			_maxHp - initial amount of health points
			_defense - when attacked, how much hit points are deflected
			_corpseName - new name of the actor when its health points reach 0
		*/
		constructor(_maxHp: number = 0, _defense: number = 0, _corpseName: string = "") {
			this.className = "Destructible";
			this._hp = _maxHp;
			this._maxHp = _maxHp;
			this._defense = _defense;
			this._corpseName = _corpseName;
		}

		get hp() { return this._hp; }
		set hp(newValue: number) { this._hp = newValue; }

		get xp() { return this._xp; }
		set xp(newValue: number) { this._xp = newValue; }

		get maxHp() { return this._maxHp; }

		get defense() { return this._defense; }
		set defense(newValue: number) { this._defense = newValue; }

		isDead(): boolean {
			return this._hp <= 0;
		}

		public computeRealDefense(owner: Actor): number {
			var realDefense = this.defense;
			if ( owner.container ) {
				// add bonus from equipped items
				var n: number = owner.container.size();
				for ( var i: number = 0; i < n; i++) {
					var item: Actor = owner.container.get(i);
					if ( item.equipment && item.equipment.isEquipped() ) {
						realDefense += item.equipment.getDefenseBonus();
					}
				}
			}
			return realDefense;
		}

		/*
			Function: takeDamage
			Deals damages to this actor. If health points reach 0, call the die function.

			Parameters:
			owner - the actor owning this Destructible
			damage - amount of damages to deal

			Returns:
			the actual amount of damage taken
		*/
		takeDamage(owner: Actor, damage: number): number {
			damage -= this.computeRealDefense(owner);
			if ( damage > 0 ) {
				this._hp -= damage;
				if ( this.isDead() ) {
					this._hp = 0;
					this.die(owner);
				}
			} else {
				damage = 0;
			}
			return damage;
		}

		/*
			Function: heal
			Recover some health points

			Parameters:
			amount - amount of health points to recover

			Returns:
			the actual amount of health points recovered
		*/
		heal(amount: number): number {
			this._hp += amount;
			if ( this._hp > this._maxHp ) {
				amount -= this._hp - this._maxHp;
				this._hp = this._maxHp;
			}
			return amount;
		}

		/*
			Function: die
			Turn this actor into a corpse

			Parameters:
			owner - the actor owning this Destructible
		*/
		die(owner: Actor) {
			owner.ch = "%";
			owner.col = Constants.CORPSE_COLOR;
			owner.name = this._corpseName;
			owner.blocks = false;
		}
	}

	/*
		Class: Attacker
		An actor that can deal damages to another one
	*/
	export class Attacker implements Persistent {
		className: string;
		private _power: number;
		/*
			Constructor: constructor

			Parameters:
			_power : amount of damages given
		*/
		constructor(_power: number = 0) {
			this.className = "Attacker";
			this._power = _power;
		}

		/*
			Property: power
			Amount of damages given
		*/
		get power() { return this._power; }
		set power(newValue: number) { this._power = newValue; }

		public computeRealPower(owner: Actor): number {
			var realPower = this.power;
			if ( owner && owner.container ) {
				// add bonus from equipped items
				var n: number = owner.container.size();
				for ( var i: number = 0; i < n; i++) {
					var item: Actor = owner.container.get(i);
					if ( item.equipment && item.equipment.isEquipped() ) {
						realPower += item.equipment.getPowerBonus();
					}
				}
			}
			return realPower;
		}

		/*
			Function: attack
			Deal damages to another actor

			Parameters:
			owner - the actor owning this Attacker
			target - the actor being attacked
		*/
		attack(owner: Actor, target: Actor) {
			if ( target.destructible && ! target.destructible.isDead() ) {
				var realPower: number = this.computeRealPower(owner);
				var damage = realPower - target.destructible.computeRealDefense(target);
				var msg: string = "[The actor1] attack[s] [the actor2]";
				var msgColor: string;
				if ( damage >= target.destructible.hp ) {
					msg += " and kill[s] [it2] !";
					msgColor = "orange";
				} else if ( damage > 0 ) {
					msg += " for " + damage + " hit points.";
					msgColor = "orange";
				} else {
					msg += " but it has no effect!";
				}
				log(transformMessage(msg, owner, target), msgColor);
				target.destructible.takeDamage(target, realPower);
			}
		}
	}

	/********************************************************************************
	 * Group: inventory
	 ********************************************************************************/
	 /*
	 	Class: Container
	 	An actor that can contain other actors :
	 	- creatures with inventory
	 	- chests, barrels, ...
	 */
	 export class Container implements Persistent {
		className: string;
	 	private _capacity: number;
	 	private actors: Actor[] = [];

	 	/*
	 		Constructor: constructor

	 		Parameters:
	 		_capacity - this container's maximum number of items
	 	*/
	 	constructor(_capacity: number = 0) {
			this.className = "Container";
	 		this._capacity = _capacity;
	 	}

	 	get capacity(): number { return this._capacity; }
	 	set capacity(newValue: number) {this._capacity = newValue; }
	 	size(): number { return this.actors.length; }

	 	get(index: number) : Actor {
	 		return this.actors[index];
	 	}

	 	getFromSlot(slot: string): Actor {
	 		var n: number = this.size();
	 		for ( var i: number = 0; i < n; i++) {
	 			var actor: Actor = this.get(i);
	 			if ( actor.equipment && actor.equipment.isEquipped() && actor.equipment.getSlot() === slot ) {
	 				return actor;
	 			}
	 		}
	 		return undefined;
	 	}

	 	isSlotEmpty(slot: string): boolean {
	 		if ( this.getFromSlot(slot)) {
	 			return false;
	 		}
	 		if ( slot === Constants.SLOT_RIGHT_HAND || slot === Constants.SLOT_LEFT_HAND ) {
	 			if ( this.getFromSlot(Constants.SLOT_BOTH_HANDS)) {
	 				return false;
	 			}
	 		} else if ( slot === Constants.SLOT_BOTH_HANDS ) {
	 			if ( this.getFromSlot(Constants.SLOT_LEFT_HAND) || this.getFromSlot(Constants.SLOT_RIGHT_HAND) ) {
	 				return false;
	 			}
	 		}
	 		return true;
	 	}

	 	/*
	 		Function: add
	 		add a new actor in this container

	 		Parameters:
	 		actor - the actor to add

	 		Returns:
	 		false if the operation failed because the container is full
	 	*/
	 	add(actor: Actor) {
	 		if ( this.actors.length >= this._capacity ) {
	 			return false;
	 		}
	 		this.actors.push( actor );
	 		return true;
	 	}

	 	/*
	 		Function: remove
	 		remove an actor from this container

	 		Parameters:
	 		actor - the actor to remove
	 	*/
	 	remove(actor: Actor) {
	 		var idx: number = this.actors.indexOf(actor);
	 		if ( idx !== -1 ) {
	 			this.actors.splice(idx, 1);
	 		}
	 	}
	}

	/********************************************************************************
	 * Group: actors
	 ********************************************************************************/

	export class Actor extends Yendor.Position implements Persistent {
		className: string;
		private _ch: string;
		private _name: string;
		private _col: Yendor.Color;

		private _destructible: Destructible;
		private _attacker: Attacker;
		private _ai: Ai;
		private _pickable: Pickable;
		private _container: Container;
		private _equipment: Equipment;

		private _blocks: boolean = false;
		private _fovOnly: boolean = true;
		private _singular: boolean = true;

		constructor() {
			super();
			this.className = "Actor";
		}

		init(_x: number = 0, _y: number = 0, _ch: string = "", _name: string = "", _col: Yendor.Color = "", singular: boolean = true) {
			this.moveTo(_x, _y);
			this._ch = _ch;
			this._name = _name;
			this._col = _col;
			this._singular = singular;
		}

		get ch() { return this._ch; }
		set ch(newValue: string) { this._ch = newValue[0]; }

		get col() { return this._col; }
		set col(newValue: Yendor.Color) { this._col = newValue; }

		get name() { return this._name; }
		set name(newValue: string) { this._name = newValue; }

		isSingular(): boolean {
			return this._singular;
		}

		isStackable(): boolean {
			return ! this.destructible && (! this.equipment || ! this.equipment.isEquipped());
		}

		isBlocking(): boolean {
			return this._blocks;
		}
		set blocks(newValue: boolean) { this._blocks = newValue; }

		isFovOnly(): boolean {
			return this._fovOnly;
		}
		set fovOnly(newValue: boolean) { this._fovOnly = newValue; }

		get destructible() { return this._destructible; }
		set destructible(newValue: Destructible) { this._destructible = newValue; }

		get attacker() { return this._attacker; }
		set attacker(newValue: Attacker) { this._attacker = newValue; }

		get ai() { return this._ai; }
		set ai(newValue: Ai) { this._ai = newValue; }

		get pickable() {return this._pickable; }
		set pickable(newValue: Pickable) { this._pickable = newValue; }

		get container() {return this._container; }
		set container(newValue: Container) {this._container = newValue; }

		get equipment() {return this._equipment; }
		set equipment(newValue: Equipment) {this._equipment = newValue; }

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

		getVerbEnd(): string {
			return this.isSingular() ? "s" : "";
		}

		getDescription(): string {
			var desc = this.name;
			if ( this._equipment && this._equipment.isEquipped()) {
				desc += " (on " + this._equipment.getSlot() + ")";
			}
			if ( this._ai ) {
				var condDesc: string = this._ai.getConditionDescription();
				if ( condDesc ) {
					desc += " (" + condDesc + ")";
				}
			}
			return desc;
		}

		update(map: Map) {
			if ( this._ai ) {
				this._ai.update(this, map);
			}
		}

		render() {
			root.setChar( this.x, this.y, this._ch );
			root.fore[this.x][this.y] = this._col;
		}

		/********************************************************************************
		 * Group: actor factories
		 ********************************************************************************/

		/*
			item factories
		*/

		// potions
		static createHealthPotion(x: number, y: number, amount: number): Actor {
			var healthPotion = new Actor();
			healthPotion.init(x, y, "!", "health potion", "#800080", true);
			healthPotion.pickable = new Pickable();
			healthPotion.pickable.setOnUseEffect(new InstantHealthEffect(amount,
				"[The actor1] drink[s] the health potion and regain[s] " + amount + " hit points.",
				"[The actor1] drink[s] the health potion but it has no effect"),
				new TargetSelector( TargetSelectionMethod.ACTOR_ON_CELL ));
			healthPotion.pickable.setOnThrowEffect(new InstantHealthEffect(amount,
				"The potion explodes on [the actor1], healing [it] for " + amount + " hit points.",
				"The potion explodes on [the actor1] but it has no effect"),
				new TargetSelector( TargetSelectionMethod.ACTOR_ON_CELL ));
			return healthPotion;
		}

		// scrolls
		static createLightningBoltScroll(x: number, y: number, range: number, damages: number): Actor {
			var lightningBolt = new Actor();
			lightningBolt.init(x, y, "#", "scroll of lightning bolt", "#FFFF3F", true);
			lightningBolt.pickable = new Pickable();
			lightningBolt.pickable.setOnUseEffect(new InstantHealthEffect(-damages,
				"A lightning bolt strikes [the actor1] with a loud thunder!\nThe damage is " + damages + " hit points."),
				new TargetSelector( TargetSelectionMethod.CLOSEST_ENEMY, range));
			return lightningBolt;
		}

		static createFireballScroll(x: number, y: number, range: number, damages: number): Actor {
			var fireball = new Actor();
			fireball.init(x, y, "#", "scroll of fireball", "#FFFF3F", true);
			fireball.pickable = new Pickable();
			fireball.pickable.setOnUseEffect(new InstantHealthEffect(-damages,
				"[The actor1] get[s] burned for " + damages + " hit points."),
				new TargetSelector( TargetSelectionMethod.SELECTED_RANGE, range),
				"A fireball explodes, burning everything within " + range + " tiles.");
			return fireball;
		}

		static createConfusionScroll(x: number, y: number, range: number, nbTurns: number): Actor {
			var confusionScroll = new Actor();
			confusionScroll.init(x, y, "#", "scroll of confusion", "#FFFF3F", true);
			confusionScroll.pickable = new Pickable();
			confusionScroll.pickable.setOnUseEffect(new ConditionEffect(ConditionType.CONFUSED, nbTurns,
				"[The actor1's] eyes look vacant,\nas [it] start[s] to stumble around!"),
				new TargetSelector( TargetSelectionMethod.SELECTED_ACTOR, range));
			return confusionScroll;
		}

		// weapons
		static createSword(x: number, y: number, name: string, damages: number, twoHanded: boolean = false): Actor {
			var sword = new Actor();
			sword.init(x, y, "/", name, "#F0F0F0", true);
			sword.pickable = new Pickable();
			sword.pickable.setOnThrowEffect(new InstantHealthEffect(-damages,
				"The sword hits [the actor1] for " + damages + " hit points."),
				new TargetSelector( TargetSelectionMethod.ACTOR_ON_CELL ));

			sword.equipment = new Equipment(twoHanded ? Constants.SLOT_BOTH_HANDS : Constants.SLOT_RIGHT_HAND, damages);
			return sword;
		}

		static createShield(x: number, y: number, name: string, defense: number): Actor {
			var shield = new Actor();
			shield.init(x, y, "[", name, "#F0F0F0", true);
			shield.pickable = new Pickable();
			shield.pickable.setOnThrowEffect(new ConditionEffect(ConditionType.STUNNED, 5,
				"The shield hits [the actor1] and stuns [it]!"),
				new TargetSelector( TargetSelectionMethod.ACTOR_ON_CELL));
			shield.equipment = new Equipment(Constants.SLOT_LEFT_HAND, 0, defense);
			return shield;
		}

		// miscellaneous
		static createStairs(character: string, direction: string): Actor {
			var stairs: Actor = new Actor();
			stairs.init(0, 0, character, "stairs " + direction, "#FFFFFF", false);
			stairs.fovOnly = false;
			return stairs;
		}

		/*
			creature factories
		*/
		static createBeast(x: number, y: number, character: string, name: string, corpseName: string, color: string,
			hp: number, attack: number, defense: number, xp: number): Actor {
			var beast: Actor = new Actor();
			beast.init(x, y, character, name, color, true);
			beast.destructible = new MonsterDestructible(hp, defense, corpseName);
			beast.attacker = new Attacker(attack);
			beast.ai = new MonsterAi();
			beast.blocks = true;
			beast.destructible.xp = xp;
			return beast;
		}

		static createPlayer(): Player {
			var player = new Player();
			player.init(0, 0, "@", "player", "#FFFFFF");
			return player;
		}
	}
}
