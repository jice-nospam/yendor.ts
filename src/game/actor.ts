/*
	Section: actors
*/
module Game {
	"use strict";

	export interface ActorManager {
		getPlayer() : Actor;
		addCreature( actor: Actor );
		addItem( actor: Actor );
		getCreatures() : Actor[];
		getCorpses() : Actor[];
		getItems() : Actor[];
		findActorsOnCell( pos: Yendor.Position, actors: Actor[]): Actor[];
		findClosestActor( pos: Yendor.Position, range: number, actors: Actor[] ) : Actor;
		findActorsInRange( pos: Yendor.Position, range: number, actors: Actor[]): Actor[];
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
		/*
			Constructor: constructor

			Parameters:
			_maxHp - initial amount of health points
			_defense - when attacked, how much hit points are deflected
			_corpseName - new name of the actor when its health points reach 0
		*/
		constructor(_maxHp: number, _defense: number, _corpseName: string) {
			this.className = "Destructible";
			this._hp = _maxHp;
			this._maxHp = _maxHp;
			this._defense = _defense;
			this._corpseName = _corpseName;
		}

		get hp() { return this._hp; }
		set hp(newValue: number) { this._hp = newValue; }

		get maxHp() { return this._maxHp; }

		get defense() { return this._defense; }
		set defense(newValue: number) { this._defense = newValue; }

		isDead(): boolean {
			return this._hp <= 0;
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
			damage -= this._defense;
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

		// Persistent interface
		load(jsonData: any): boolean {
			this._hp = jsonData._hp;
			this._maxHp = jsonData._maxHp;
			this._defense = jsonData._defense;
			this._corpseName = jsonData._corpseName;
			return true;
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
		constructor(_power: number) {
			this.className = "Attacker";
			this._power = _power;
		}

		/*
			Property: power
			Amount of damages given
		*/
		get power() { return this._power; }
		set power(newValue: number) { this._power = newValue; }

		/*
			Function: attack
			Deal damages to another actor

			Parameters:
			owner - the actor owning this Attacker
			target - the actor being attacked
		*/
		attack(owner: Actor, target: Actor) {
			if ( target.destructible && ! target.destructible.isDead() ) {
				var damage = this._power - target.destructible.defense;
				if ( damage >= target.destructible.hp ) {
					log( owner.name + " attacks " + target.name + " and kill it !", "orange");
					target.destructible.takeDamage(target, this._power);
				} else if ( damage > 0 ) {
					log( owner.name + " attacks " + target.name + " for " + damage + " hit points.", "orange");
					target.destructible.takeDamage(target, this._power);
				} else {
					log( owner.name + " attacks " + target.name + " but it has no effect!");
				}
			}
		}

		// Persistent interface
		load(jsonData: any): boolean {
			this._power = jsonData._power;
			return true;
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
	 	constructor(_capacity: number) {
	 		this.className = "Container";
	 		this._capacity = _capacity;
	 	}

	 	get capacity(): number { return this._capacity; }
	 	set capacity(newValue: number) {this._capacity = newValue; }
	 	size(): number { return this.actors.length; }

	 	get(index: number) : Actor {
	 		return this.actors[index];
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

		// Persistent interface
		load(jsonData: any): boolean {
			this._capacity = jsonData._capacity;
			for (var i: number = 0; i < jsonData.actors.length; i++) {
				var actorData: any = jsonData.actors[i];
				var actor: Actor = Object.create(window[actorData.className].prototype);
				actor.load(actorData);
				this.actors.push(actor);
			}
			return true;
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
		private _blocks: boolean = true;
		private _pickable: Pickable;
		private _container: Container;

		constructor(_x: number, _y: number, _ch: string, _name: string, _col: Yendor.Color) {
			super(_x, _y);
			this.className = "Actor";
			this._ch = _ch;
			this._name = _name;
			this._col = _col;
		}

		get ch() { return this._ch; }
		set ch(newValue: string) { this._ch = newValue[0]; }

		get col() { return this._col; }
		set col(newValue: Yendor.Color) { this._col = newValue; }

		get name() { return this._name; }
		set name(newValue: string) { this._name = newValue; }

		isBlocking(): boolean {
			return this._blocks;
		}
		set blocks(newValue: boolean) { this._blocks = newValue; }

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

		update(map: Map, actorManager: ActorManager) {
			if ( this._ai ) {
				this._ai.update(this, map, actorManager);
			}
		}

		render() {
			root.setChar( this.x, this.y, this._ch );
			root.fore[this.x][this.y] = this._col;
		}

		// persistent interface
		load(jsonData: any): boolean {
			this.x = jsonData._x;
			this.y = jsonData._y;
			this._ch = jsonData._ch;
			this._name = jsonData._name;
			this._col = jsonData._col;
			this._blocks = jsonData._blocks;
			if ( jsonData._destructible ) {
				this._destructible = new Destructible(0, 0, "");
				this._destructible.load(jsonData._destructible);
			}
			if ( jsonData._attacker ) {
				this._attacker = new Attacker(0);
				this._attacker.load(jsonData._attacker);
			}
			if ( jsonData._ai ) {
				this._ai = new MonsterAi();
				this._ai.load(jsonData._ai);
			}
			if ( jsonData._pickable ) {
				this._pickable = new Pickable(undefined);
				this._pickable.load(jsonData._pickable);
			}
			if ( jsonData._container ) {
				this._container = new Container(0);
				this._container.load(jsonData._container);
			}
			return true;
		}
	}
}
