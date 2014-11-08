/*
	Section: actors
*/
module Game {
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
	export class Destructible {
		private _hp: number;
		/*
			Constructor: constructor

			Parameters:
			_maxHp - initial amount of health points
			_defense - when attacked, how much hit points are deflected
			_corpseName - new name of the actor when its health points reach 0
		*/
		constructor(private _maxHp: number, private _defense: number, private _corpseName: string) {
			this._hp = _maxHp;
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
	}

	/*
		Class: MonsterDestructible
		Contains an overloaded die function that logs the monsters death
	*/
	export class MonsterDestructible extends Destructible {
		die(owner: Actor) {
			log(owner.name + " is dead");
			super.die(owner);
		}
	}

	/*
		Class: PlayerDestructible
		Contains an overloaded die function to notify the Engine about the player's death
	*/
	export class PlayerDestructible extends Destructible {
		die(owner: Actor) {
			log("You died!", "red");
			super.die(owner);
			EventBus.getInstance().publishEvent(new Event<GameStatus>( EventType.CHANGE_STATUS, GameStatus.DEFEAT ));
		}
	}

	/*
		Class: Attacker
		An actor that can deal damages to another one
	*/
	export class Attacker {
		/*
			Constructor: constructor

			Parameters:
			_power : amount of damages given
		*/
		constructor( private _power: number) {}

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
	}

	/********************************************************************************
	 * Group: articifial intelligence
	 ********************************************************************************/

	/*
		Class: Ai
		Owned by self-updating actors
	*/
	export class Ai {
		update(owner: Actor, map: Map, actorManager: ActorManager) {}
	}

	/*
		Class: PlayerAi
		Handles player input. Determin in a new game turn must be started.
	*/
	export class PlayerAi extends Ai implements EventListener {
		private first: boolean = true;
		private keyCode: number = 0;
		private keyChar: string;
		constructor() {
			super();
			EventBus.getInstance().registerListener(this, EventType.KEY_PRESSED);
		}

		/*
			Function: processEvent
			Stores the keyCode from KEY_PRESSED event so that <update> can use it.

			Parameters:
			event - the KEY_PRESSED <Event>
		*/
		processEvent(event: Event<any>) {
			if ( event.type === EventType.KEY_PRESSED ) {
				this.keyCode = event.data.keyCode;
				this.keyChar = event.data.key;
			} else {
				this.keyCode = 0;
				this.keyChar = undefined;
			}
		}

		/*
			Function: update
			Updates the player, eventually sends a CHANGE_STATUS event if a new turn has started.

			Parameters:
			owner - the actor owning this PlayerAi (obviously, the player)
			actorManager - the main actor manager used to check it there are monsters nearby.
		*/
		update(owner: Actor, map: Map, actorManager: ActorManager) {
			// don't update a dead actor
			if ( owner.destructible && owner.destructible.isDead()) {
				return;
			}
			// check movement keys
			var dx : number = 0;
			var dy : number = 0;
			switch (this.keyCode) {
				case KeyEvent.DOM_VK_LEFT: dx = -1; break;
				case KeyEvent.DOM_VK_RIGHT: dx = 1; break;
				case KeyEvent.DOM_VK_UP: dy = -1; break;
				case KeyEvent.DOM_VK_DOWN: dy = 1; break;
				default : this.handleActionKey(owner, map, actorManager); break;
			}
			if ( dx !== 0 || dy !== 0 )  {
				// the player moved or try to move. New game turn
				EventBus.getInstance().publishEvent(new Event<GameStatus>(EventType.CHANGE_STATUS, GameStatus.NEW_TURN));
				// move to the target cell or attack if there's a creature
				if ( this.moveOrAttack(owner, owner.x + dx, owner.y + dy, map, actorManager) ) {
					// the player actually move. Recompute the field of view
					map.computeFov(owner.x, owner.y, Constants.FOV_RADIUS);
				}
			} else if (this.first) {
				// first game frame : compute the field of view
				map.computeFov(owner.x, owner.y, Constants.FOV_RADIUS);
				this.first = false;
			}
		}

		private handleActionKey(owner: Actor, map: Map, actorManager: ActorManager) {
			if ( this.keyChar === "g" ) {
				this.pickupItem(owner, map, actorManager);
			}
		}

		private pickupItem(owner: Actor, map: Map, actorManager: ActorManager) {
			var found: boolean = false;
			EventBus.getInstance().publishEvent(new Event<GameStatus>(EventType.CHANGE_STATUS, GameStatus.NEW_TURN));
			actorManager.getItems().some(function(item) {
				if ( item.pickable && item.x === owner.x && item.y === owner.y ) {
					found = true;
					if ( item.pickable.pick(item, owner)) {
						log("You pick the " + item.name + ".");
					} else {
						log("Your inventory is full.");
					}
					return true;
				} else {
					return false;
				}
			});
			if (! found) {
				log("There's nothing to pick here.");
			}
		}

		/*
			Function: moveOrAttack
			Try to move the player to a new map call. if there's a living creature on this map cell, attack it.

			Parameters:
			owner - the actor owning this Attacker (the player)
			x - the destination cell x coordinate
			y - the destination cell y coordinate
			map - the game map, used to check for wall collisions
			actorManager - used to check for living actors

			Returns:
			true if the player actually moved to the new cell
		*/
		private moveOrAttack(owner: Actor, x: number, y: number, map: Map, actorManager: ActorManager): boolean {
			// cannot move or attack a wall! 
			if ( map.isWall(x, y)) {
				return false;
			}
			// check for living monsters on the destination cell
			var cellPos: Yendor.Position = new Yendor.Position(x, y);
			var actors: Actor[] = actorManager.findActorsOnCell(cellPos, actorManager.getCreatures());
			for (var i = 0; i < actors.length; i++) {
				var actor: Actor = actors[i];
				if ( actor.destructible && ! actor.destructible.isDead() ) {
					// attack the first living actor found on the cell
					owner.attacker.attack( owner, actor );
					return false;
				}
			}
			// no living actor. Log exising corpses and items
			actorManager.findActorsOnCell(cellPos, actorManager.getCorpses()).forEach(function(actor) {
				log("There's a " + actor.name + " here");
			});
			actorManager.findActorsOnCell(cellPos, actorManager.getItems()).forEach(function(actor) {
				log("There's a " + actor.name + " here");
			});
			// move the player
			owner.x = x;
			owner.y = y;
			return true;
		}
	}

	/*
		Class: MonsterAi
		NPC monsters articial intelligence. Attacks the player when he is at melee range, 
		else moves towards him using scent tracking.
	*/
	export class MonsterAi extends Ai {
		/*
			Function: update

			Parameters:
			owner - the actor owning this MonsterAi (the monster)
			map - the game map (used to check player line of sight)
			actorManager - used to get the player actor
		*/
		update(owner: Actor, map: Map, actorManager: ActorManager) {
			// don't update a dead monster
			if ( owner.destructible && owner.destructible.isDead()) {
				return;
			}
			// attack the player when at melee range, else try to track his scent
			this.moveOrAttack(owner, actorManager.getPlayer().x, actorManager.getPlayer().y,
				map, actorManager);
		}

		/*
			Function: moveOrAttack
			If the player is at range, attack him. If in sight, move towards him, else try to track his scent.

			Parameters:
			owner - the actor owning this MonsterAi (the monster)
			x - the destination cell x coordinate
			y - the destination cell y coordinate
			map - the game map. Used to check if player is in sight
			actorManager - used to get the player actor
		*/
		private moveOrAttack(owner: Actor, x: number, y: number, map: Map, actorManager: ActorManager) {
			var dx: number = x - owner.x;
			var dy: number = y - owner.y;
			// compute distance from player
			var distance: number = Math.sqrt(dx * dx + dy * dy);
			if ( distance < 2 ) {
				// at melee range. Attack !
				if ( owner.attacker ) {
					owner.attacker.attack(owner, actorManager.getPlayer());
				}
			} else if ( map.isInFov(owner.x, owner.y) ) {
				// not at melee range, but in sight. Move towards him
				dx = Math.round(dx / distance);
				dy = Math.round(dy / distance);
				this.move(owner, dx, dy, map, actorManager);
			} else {
				// player not in range. Use scent tracking
				this.trackScent(owner, map, actorManager);
			}
		}

		/*
			Function: move
			Move to a destination cell, avoiding potential obstacles (walls, other creatures)

			Parameters:
			owner - the actor owning this MonsterAi (the monster)
			dx - horizontal direction
			dy - vertical direction
			map - the game map (to check if a cell is walkable)
			actorManager - to check blocking actors
		*/
		private move(owner: Actor, dx: number, dy: number, map: Map, actorManager: ActorManager) {
			// compute the unitary move vector
			var stepdx: number = dx > 0 ? 1 : -1;
			var stepdy: number = dy > 0 ? 1 : -1;
			if ( map.canWalk(owner.x + stepdx, owner.y + stepdy, actorManager)) {
				// can walk
				owner.x += stepdx;
				owner.y += stepdy;
			} else if ( map.canWalk(owner.x + stepdx, owner.y, actorManager)) {
				// horizontal slide
				owner.x += stepdx;
			} else if ( map.canWalk(owner.x, owner.y + stepdy, actorManager)) {
				// vertical slide
				owner.y += stepdy;
			}
		}

		private static TDX: number[] = [-1, 0, 1, -1, 1, -1, 0, 1];
		private static TDY: number[] = [-1, -1, -1, 0, 0, 1, 1, 1];

		/*
			Function: findHighestScentCellIndex
			Find the adjacent cell with the highest scent value

			Parameters:
			owner - the actor owning this MonsterAi (the monster)
			map - the game map, used to skip wall cells from the search

			Returns:
			the cell index :
			- 0 : north-west
			- 1 : north
			- 2 : north-east
			- 3 : west
			- 4 : east
			- 5 : south-west
			- 6 : south
			- 7 : south-east
			- or -1 if no adjacent cell has scent.
		*/
		private findHighestScentCellIndex(owner: Actor, map: Map): number {
			var bestScentLevel: number = 0;
			var bestCellIndex: number = -1;
			// scan all 8 adjacent cells
			for ( var i: number = 0; i < 8; i++) {
				var cellx = owner.x + MonsterAi.TDX[i];
				var celly = owner.y + MonsterAi.TDY[i];
				if ( !map.isWall(cellx, celly)) {
					// not a wall, check if scent is higher
					var scentAmount = map.getScent(cellx, celly);
					if ( scentAmount > map.currentScentValue - Constants.SCENT_THRESHOLD
						&& scentAmount > bestScentLevel ) {
						// scent is higher. New candidate
						bestScentLevel = scentAmount;
						bestCellIndex = i;
					}
				}
			}
			return bestCellIndex;
		}

		/*
			Function: trackScent
			Move towards the adjacent cell with the highest scent value
		*/
		private trackScent(owner: Actor, map: Map, actorManager: ActorManager) {
			// get the adjacent cell with the highest scent value
			var bestCellIndex: number = this.findHighestScentCellIndex(owner, map);
			if ( bestCellIndex !== -1 ) {
				// found. try to move 
				this.move(owner, MonsterAi.TDX[bestCellIndex], MonsterAi.TDY[bestCellIndex], map, actorManager);
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
	 export class Container {
	 	private actors: Actor[] = [];

	 	/*
	 		Constructor: constructor

	 		Parameters:
	 		_capaticty - this container's maximum number of items
	 	*/
	 	constructor( private _capaticty: number) {}

	 	get capacity(): number { return this._capaticty; }
	 	set capacity(newValue: number) {this._capaticty = newValue; }
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
	 		if ( this.actors.length >= this._capaticty ) {
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

	/*
		Enum: TargetSelectionMethod
		Define how we select the actors that are impacted by an effect.
		The wearer is the actor triggering the effect (by using an item or casting a spell)

		WEARER - the actor using the item or casting the spell
		WEARER_CLOSEST_ENEMY - the closest enemy 
		SELECTED_ACTOR - an actor manually selected
		WEARER_RANGE - all actors close to the wearer
		SELECTED_RANGE - all actors close to a manually selected position
	*/
	export enum TargetSelectionMethod {
		WEARER,
		WEARER_CLOSEST_ENEMY,
		SELECTED_ACTOR,
		WEARER_RANGE,
		SELECTED_RANGE
	}

	/*
		Class: TargetSelector
		Various ways to select actors
	*/
	export class TargetSelector {
		/*
			Constructor: constructor

			Parameters:
			_method - the target selection method
			_range - for methods requiring a range
		*/
		constructor(private _method: TargetSelectionMethod, private _range: number = 0) {}

		/*
			Property: method
			The target selection method (read-only)
		*/
		get method() { return this._method; }

		/*
			Property: range
			The selection range (read-only)
		*/
		get range() { return this._range; }

		/*
			Function: selectTargets
			Return all the actors matching the selection criteria

			Parameters:
			owner - the actor owning the effect (the magic item or the scroll)
			wearer - the actor using the item
			actorManager -
		*/
		selectTargets(owner: Actor, wearer: Actor, actorManager: ActorManager,
			applyEffects: (owner: Actor, wearer: Actor, actors: Actor[]) => void) {
			var selectedTargets: Actor[] = [];
			switch (this._method) {
				case TargetSelectionMethod.WEARER :
					selectedTargets.push(wearer);
				break;
				case TargetSelectionMethod.WEARER_CLOSEST_ENEMY :
					var actor = actorManager.findClosestActor(wearer, this.range, actorManager.getCreatures());
					if ( actor ) {
						selectedTargets.push(actor);
					}
				break;
			// TODO
			//	case TargetSelectionMethod.SELECTED_ACTOR : return selectActor(wearer, actorManager); break;
			//	case TargetSelectionMethod.WEARER_RANGE : return selectCloseEnemies(wearer, actorManager); break;
				case TargetSelectionMethod.SELECTED_RANGE :
					log("Left-click a target tile for the fireball,\nor right-click to cancel.");
					var theRange = this.range;
					EventBus.getInstance().publishEvent(new Event<TilePickerListener>(EventType.PICK_TILE,
						function(pos: Yendor.Position) {
							var actors: Actor[] = actorManager.findActorsInRange( pos, theRange, actorManager.getCreatures() );
							if (actors.length > 0) {
								applyEffects(owner, wearer, actors);
							}
						}
					));
				break;
			}
			if (selectedTargets.length > 0) {
				applyEffects(owner, wearer, selectedTargets);
			}
		}
	}

	/*
		Interface: Effect
		Some effect that can be applied to actors. The effect might be triggered by using an item or casting a spell.
	*/
	export interface Effect {
		/*
			Function: applyTo
			Apply an effect to an actor

			Returns:
			false if effect cannot be applied
		*/
		applyTo(actor: Actor): boolean;
	}

	export class InstantHealthEffect implements Effect {
		constructor( private _amount: number, private _message?: string) {}

		applyTo(actor: Actor): boolean {
			if (! actor.destructible ) {
				return false;
			}
			if ( this._amount > 0 ) {
				// healing effect
				var healPointsCount: number = actor.destructible.heal( this._amount );
				if ( healPointsCount > 0 && this._message ) {
					// TODO message formatting utility
					log(this._message);
				}
				return true;
			} else {
				// wounding effect
				if ( this._message && actor.destructible.defense < -this._amount ) {
					log(this._message);
				}
				if ( actor.destructible.takeDamage(actor, -this._amount) ) {
					return true;
				}
			}
			return false;
		}
	}

	/*
		Class: Pickable
		An actor that can be picked by a creature
	*/
	export class Pickable {
		constructor( private _effect: Effect, private _targetSelector?: TargetSelector) {}
		/*
			Function: pick
			Put this actor in a container actor

			Parameters:
			owner - the actor owning this Pickable (the item)
			wearer - the container

			Returns:
			true if the operation succeeded
		*/
		pick(owner: Actor, wearer: Actor): boolean {
			if ( wearer.container && wearer.container.add(owner)) {
				// tells the engine to remove this actor from main list
				EventBus.getInstance().publishEvent(new Event<Actor>(EventType.REMOVE_ACTOR, owner));
				return true;
			}
			// wearer is not a container or is full
			return false;
		}

		/*
			Function: use
			Consume this item, destroying it

			Parameters:
			owner - the actor owning this Pickable (the item)
			weare - the container

			Returns:
			true if the action succeeded
		*/
		use(owner: Actor, wearer: Actor, actorManager: ActorManager) {
			if ( this._targetSelector ) {
				this._targetSelector.selectTargets(owner, wearer, actorManager, this.applyEffectToActorList.bind(this));
			}
		}

		private applyEffectToActorList(owner: Actor, wearer: Actor, actors: Actor[]) {
			var success: boolean = false;

			for (var i = 0; i < actors.length; ++i) {
				if (this._effect.applyTo(actors[i])) {
					success = true;
				}
			}
			if ( success && wearer.container ) {
				wearer.container.remove( owner );
			}
		}

		/*
			Some factory helpers
		*/
		static createHealthPotion(x: number, y: number, amount: number): Actor {
			var healthPotion = new Actor(x, y, "!", "health potion", "purple");
			healthPotion.pickable = new Pickable(new InstantHealthEffect(amount, "You drink the health potion"),
				new TargetSelector( TargetSelectionMethod.WEARER ));
			healthPotion.blocks = false;
			return healthPotion;
		}

		static createLightningBoltScroll(x: number, y: number, range: number, damages: number): Actor {
			var lightningBolt = new Actor(x, y, "#", "scroll of lightning bolt", "rgb(255,255,63)");
			lightningBolt.pickable = new Pickable( new InstantHealthEffect(-damages, "A lightning bolt hits with a loud thunder!"),
				new TargetSelector( TargetSelectionMethod.WEARER_CLOSEST_ENEMY, range));
			lightningBolt.blocks = false;
			return lightningBolt;
		}

		static createFireballScroll(x: number, y: number, range: number, damages: number): Actor {
			var fireball = new Actor(x, y, "#", "scroll of fireball", "rgb(255,255,63)");
			fireball.pickable = new Pickable( new InstantHealthEffect(-damages, "A fireball burns all nearby creatures!"),
				new TargetSelector( TargetSelectionMethod.SELECTED_RANGE, range));
			fireball.blocks = false;
			return fireball;
		}
	}

	/********************************************************************************
	 * Group: actors
	 ********************************************************************************/

	export class Actor extends Yendor.Position {
		private _destructible: Destructible;
		private _attacker: Attacker;
		private _ai: Ai;
		private _blocks: boolean = true;
		private _pickable: Pickable;
		private _container: Container;

		constructor(_x: number, _y: number, private _ch: string,
			private _name: string, private _col: Yendor.Color) { super(_x, _y); }

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
	}

	export class Player extends Actor {
		constructor(_x: number, _y: number, _ch: string,
			_name: string, _col: Yendor.Color) {
			super(_x, _y, _ch, _name, _col);
			this.ai = new PlayerAi();
			this.attacker = new Attacker(5);
			this.destructible = new PlayerDestructible(30, 2, "your cadaver");
			this.container = new Container(26);
		}
	}
}
