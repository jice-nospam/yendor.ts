/// <reference path="actor.ts" />

/*
	Section: creatures
*/
module Game {
	"use strict";
	/********************************************************************************
	 * Group: creatures conditions
	 ********************************************************************************/
	/*
		Enum: ConditionType

	 	CONFUSED - moves randomly and attacks anything on path
	 	STUNNED - don't move or attack, then get confused
	 	REGENERATION - regain health points over time
	 	OVERENCUMBERED - walk slower. This also affects all actions relying on walkTime.
	*/
	export const enum ConditionType {
		CONFUSED,
		STUNNED,
		REGENERATION,
		OVERENCUMBERED,
	}

	/*
	 	Class: Condition
	 	Permanent or temporary effect affecting a creature
	*/
	export class Condition implements Persistent {
		className: string;
		/*
	 		Property: time
	 		Time before this condition stops, or -1 for permanent conditions
		*/
		protected time: number;
		protected _type: ConditionType;
		// not persisted to avoid cyclic dependency
		protected __owner: Actor;
		private static condNames = [ "confused", "stunned" ];

		// factory
		static create(type: ConditionType, owner: Actor, time: number, ...additionalArgs : any[]): Condition {
			switch ( type ) {
				case ConditionType.REGENERATION :
					return new RegenerationCondition(owner, time, <number>additionalArgs[0]);
				case ConditionType.STUNNED :
					return new StunnedCondition(owner, time);
				default :
					return new Condition(type, owner, time);
			}
		}

		constructor(type: ConditionType, owner: Actor, time: number) {
			this.className = "Condition";
			this.time = time;
			this.__owner = owner;
			this._type = type;
		}

		get type() { return this._type; }
		setOwner(actor: Actor) {
			// used to rebuilt owner link after loading
			this.__owner = actor;
		}

		getName() { return Condition.condNames[this._type]; }

		/*
			Function: update
			Returns:
				false if the condition has ended
		*/
		update(): boolean {
			if ( this.time > 0 ) {
				this.time --;
				return (this.time > 0);
			}
			return true;
		}
	}

	/*
		Class: RegenerationCondition
		The creature gain health points over time
	*/
	export class RegenerationCondition extends Condition {
		private hpPerTurn: number;
		constructor(owner: Actor, nbTurns: number, nbHP : number) {
			super(ConditionType.REGENERATION, owner, nbTurns);
			this.className = "RegenerationCondition";
			this.hpPerTurn = nbHP / nbTurns;
		}

		update(): boolean {
			if (this.__owner.destructible) {
				this.__owner.destructible.heal(this.hpPerTurn);
			}
			return super.update();
		}
	}

	/*
		Class: StunnedCondition
		The creature cannot move or attack while stunned. Then it gets confused for a few turns
	*/
	export class StunnedCondition extends Condition {
		constructor(owner: Actor, nbTurns: number) {
			super(ConditionType.STUNNED, owner, nbTurns);
			this.className = "StunnedCondition";
		}

		update(): boolean {
			if (! super.update()) {
				if ( this.type === ConditionType.STUNNED) {
					// after being stunned, wake up confused
					this._type = ConditionType.CONFUSED;
					this.time = Constants.AFTER_STUNNED_CONFUSION_DELAY;
				} else {
					return false;
				}
			}
			return true;
		}
	}

	/********************************************************************************
	 * Group: articifial intelligence
	 ********************************************************************************/

	/*
		Class: Ai
		Owned by self-updating actors
	*/
	export class Ai implements Persistent, ContainerListener {
		className: string;
		private conditions: Condition[];
		// time until next turn.
		private _waitTime: number = 0;
		// time to make a step
		private _walkTime: number;

		constructor(walkTime: number) {
			this.className = "Ai";
			this.walkTime = walkTime;
		}

		get waitTime() { return this._waitTime; }
		set waitTime(newValue: number) { this._waitTime = newValue; }

		get walkTime() {
			return this.hasCondition(ConditionType.OVERENCUMBERED) ? this._walkTime * Constants.OVERENCUMBERED_MULTIPLIER : this._walkTime;
		}
		set walkTime(newValue: number) { this._walkTime = newValue; }

		update(owner: Actor, map: Map) {
			if ( ! this.conditions ) {
				return;
			}
			for ( var i: number = 0, n: number = this.conditions.length; i < n; ++i) {
				if ( !this.conditions[i].update() ) {
					this.conditions.splice(i, 1);
					i--;
					n--;
				}
			}
		}

		setPostLoadOwner(owner: Actor) {
			// rebuild conditions links
			if ( this.conditions ) {
				this.conditions.forEach( (cond: Condition) => { cond.setOwner(owner); });
			}
		}

		addCondition(cond: Condition) {
			if ( ! this.conditions ) {
				this.conditions = [];
			}
			this.conditions.push(cond);
		}

		removeCondition(cond: ConditionType) {
			if ( ! this.conditions ) {
				return;
			}
			for ( var i: number = 0, n: number = this.conditions.length; i < n; ++i) {
				if ( this.conditions[i].type === cond ) {
					this.conditions.splice(i, 1);
					break;
				}
			}
		}

		getConditionDescription(): string {
			return  this.conditions && this.conditions.length > 0 ? this.conditions[0].getName() : undefined;
		}

		hasCondition(type: ConditionType): boolean {
			var n: number = this.conditions ? this.conditions.length : 0;
			for ( var i: number = 0; i < n; i++) {
				if ( this.conditions[i].type === type ) {
					return true;
				}
			}
			return false;
		}

		/*
			Function: getAttacker
			Determin what will be used to attack
		*/
		private getAttacker(owner: Actor): Attacker {
			if (! owner ) {
				return undefined;
			}
			if ( owner.container ) {
				// check for equipped weapons
				// TODO each equipped weapon should be used only once per turn
				for ( var i: number = 0, n: number = owner.container.size(); i < n; ++i) {
					var item: Actor = owner.container.get(i);
					if ( item.equipment && item.equipment.isEquipped() && item.attacker ) {
						return item.attacker;
					}
				}
			}
			return owner.attacker;
		}



		/*
			Function: moveOrAttack
			Try to move the owner to a new map cell. If there's a living creature on this map cell, attack it.

			Parameters:
			owner - the actor owning this Ai
			x - the destination cell x coordinate
			y - the destination cell y coordinate
			map - the game map, used to check for wall collisions

			Returns:
			true if the owner actually moved to the new cell
		*/
		protected moveOrAttack(owner: Actor, x: number, y: number, map: Map): boolean {
			if ( this.hasCondition(ConditionType.STUNNED)) {
				this.waitTime += this.walkTime;
				return false;
			}
			if ( this.hasCondition(ConditionType.CONFUSED)) {
				// random move
				x = owner.x + rng.getNumber(-1, 1);
				y = owner.y + rng.getNumber(-1, 1);
			}
			if ( x === owner.x && y === owner.y ) {
				this.waitTime += this.walkTime;
				return false;
			}
			// cannot move or attack a wall! 
			if ( map.isWall(x, y)) {
				this.waitTime += this.walkTime;
				return false;
			}
			// check for living creatures on the destination cell
			var cellPos: Yendor.Position = new Yendor.Position(x, y);
			var actors: Actor[] = ActorManager.instance.findActorsOnCell(cellPos, ActorManager.instance.getCreatures());
			for (var i = 0; i < actors.length; i++) {
				var actor: Actor = actors[i];
				if ( actor.destructible && ! actor.destructible.isDead() ) {
					// attack the first living actor found on the cell
					var attacker: Attacker = this.getAttacker(owner);
					attacker.attack( owner, actor );
					this.waitTime += attacker.attackTime;
					return false;
				}
			}
			// check for unpassable items
			if ( !map.canWalk(x, y)) {
				this.waitTime += this.walkTime;
				return false;
			}
			// move the creature
			this.waitTime += this.walkTime;
			owner.x = x;
			owner.y = y;
			return true;
		}

		// listen to inventory events to manage OVERENCUMBERED condition
		onAdd(actor: Actor, container: Container) {
			this.checkOverencumberedCondition(container);
		}

		onRemove(actor: Actor, container: Container) {
			this.checkOverencumberedCondition(container);
		}

		private checkOverencumberedCondition(container: Container) {
			if ( ! this.hasCondition(ConditionType.OVERENCUMBERED)
				&& container.computeTotalWeight() >= container.capacity * Constants.OVEREMCUMBERED_THRESHOLD ) {
				this.addCondition(Condition.create(ConditionType.OVERENCUMBERED, undefined, -1));
			} else if ( this.hasCondition(ConditionType.OVERENCUMBERED)
				&& container.computeTotalWeight() < container.capacity * Constants.OVEREMCUMBERED_THRESHOLD ) {
				this.removeCondition(ConditionType.OVERENCUMBERED);
			}

		}
	}

	/*
		Class: PlayerAi
		Handles player input. Determin if a new game turn must be started.
	*/
	export class PlayerAi extends Ai implements EventListener {
		private _lastAction: PlayerAction;
		constructor(walkTime: number) {
			super(walkTime);
			this.className = "PlayerAi";
			EventBus.instance.registerListener(this, EventType.KEYBOARD_INPUT);
		}

		get lastAction() { return this._lastAction; }

		/*
			Function: processEvent
			Stores the action from KEYBOARD_INPUT event so that <update> can use it.

			Parameters:
			action - the PlayerAction
		*/
		processEvent(event: Event<any>) {
			this._lastAction = (<KeyInput>event.data).action;
			if ( this._lastAction !== undefined) {
				ActorManager.instance.resume();
			}
		}

		/*
			Function: update
			Updates the player, eventually sends a CHANGE_STATUS event if a new turn has started.

			Parameters:
			owner - the actor owning this PlayerAi (obviously, the player)
		*/
		update(owner: Actor, map: Map) {
			super.update(owner, map);
			// don't update a dead actor
			if ( owner.destructible && owner.destructible.isDead()) {
				this._lastAction = undefined;
				return;
			}
			var newTurn: boolean = false;
			switch ( this._lastAction ) {
				case PlayerAction.MOVE_NORTH :
        		case PlayerAction.MOVE_SOUTH :
        		case PlayerAction.MOVE_EAST :
        		case PlayerAction.MOVE_WEST :
        		case PlayerAction.MOVE_NW :
        		case PlayerAction.MOVE_NE :
        		case PlayerAction.MOVE_SW :
        		case PlayerAction.MOVE_SE :
        			var move: Yendor.Position = convertActionToPosition(this._lastAction);
					newTurn = true;
					// move to the target cell or attack if there's a creature
					if ( this.moveOrAttack(owner, owner.x + move.x, owner.y + move.y, map) ) {
						// the player actually move. Recompute the field of view
						map.computeFov(owner.x, owner.y, Constants.FOV_RADIUS);
					}
				break;
        		case PlayerAction.WAIT :
        			newTurn = true;
					this.waitTime += this.walkTime;
        		break;
        		case PlayerAction.GRAB :
        		case PlayerAction.USE_ITEM :
        		case PlayerAction.DROP_ITEM :
        		case PlayerAction.THROW_ITEM :
        		case PlayerAction.FIRE :
        		case PlayerAction.MOVE_UP :
        		case PlayerAction.MOVE_DOWN :
					if (! this.hasCondition(ConditionType.CONFUSED) && ! this.hasCondition(ConditionType.STUNNED)) {
						this.handleAction(owner, map);
					}
				break;
			}
			this._lastAction = undefined;
			if ( newTurn ) {
				// the player moved or try to move. New game turn
				ActorManager.instance.resume();
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

			Returns:
			true if the player actually moved to the new cell
		*/
		protected moveOrAttack(owner: Actor, x: number, y: number, map: Map): boolean {
			if ( !super.moveOrAttack(owner, x, y, map) ) {
				return false;
			}
			var cellPos: Yendor.Position = new Yendor.Position(owner.x, owner.y);
			// no living actor. Log exising corpses and items
			ActorManager.instance.findActorsOnCell(cellPos, ActorManager.instance.getCorpses()).forEach(function(actor: Actor) {
				log(actor.getTheresaname() + " here.");
			});
			ActorManager.instance.findActorsOnCell(cellPos, ActorManager.instance.getItems()).forEach(function(actor: Actor) {
				log(actor.getTheresaname() + " here.");
			});
			return true;
		}

		private handleAction(owner: Actor, map: Map) {
			switch ( this.lastAction ) {
				case PlayerAction.GRAB :
					this.pickupItem(owner, map);
				break;
				case PlayerAction.MOVE_DOWN :
					var stairsDown: Actor = ActorManager.instance.getStairsDown();
					if ( stairsDown.x === owner.x && stairsDown.y === owner.y ) {
						EventBus.instance.publishEvent(new Event<GameStatus>( EventType.CHANGE_STATUS, GameStatus.NEXT_LEVEL ));
					} else {
						log("There are no stairs going down here.");
					}
					ActorManager.instance.resume();
				break;
				case PlayerAction.MOVE_UP :
					var stairsUp: Actor = ActorManager.instance.getStairsUp();
					if ( stairsUp.x === owner.x && stairsUp.y === owner.y ) {
						log("The stairs have collapsed. You can't go up anymore...");
					} else {
						log("There are no stairs going up here.");
					}
					this.waitTime += this.walkTime;
					ActorManager.instance.resume();
				break;
				case PlayerAction.USE_ITEM :
					EventBus.instance.publishEvent(new Event<OpenInventoryEventData>(EventType.OPEN_INVENTORY,
						{ title: "use an item", itemListener: this.useItem.bind(this) } ));
				break;
				case PlayerAction.DROP_ITEM :
					EventBus.instance.publishEvent(new Event<OpenInventoryEventData>(EventType.OPEN_INVENTORY,
						{ title: "drop an item", itemListener: this.dropItem.bind(this) } ));
				break;
				case PlayerAction.THROW_ITEM :
					EventBus.instance.publishEvent(new Event<OpenInventoryEventData>(EventType.OPEN_INVENTORY,
						{ title: "throw an item", itemListener: this.throwItem.bind(this) } ));
				break;
				case PlayerAction.FIRE :
					this.fire(owner);
				break;
			}
		}

		/*
			Function: fire
			Fire a projectile using a ranged weapon.
		*/
		private fire(owner: Actor) {
			var weapon: Actor = owner.container.getFromSlot(Constants.SLOT_RIGHT_HAND);
			if (! weapon || ! weapon.ranged) {
				weapon = owner.container.getFromSlot(Constants.SLOT_BOTH_HANDS);
			}
			if (! weapon || ! weapon.ranged) {
				weapon = owner.container.getFromSlot(Constants.SLOT_LEFT_HAND);
			}
			if (! weapon || ! weapon.ranged) {
				log("You have no ranged weapon equipped.", 0xFF0000);
				return;
			}
			weapon.ranged.fire(weapon, owner);
			// note : this time is spent before you select the target. loading the projectile takes time
			this.waitTime += weapon.ranged.loadTime;
		}

		// inventory item listeners
		private useItem(item: Actor) {
			if (item.pickable) {
				item.pickable.use(item, ActorManager.instance.getPlayer());
			}
			ActorManager.instance.resume();
			this.waitTime += this.walkTime;
		}

		private dropItem(item: Actor) {
			if ( item.pickable ) {
				item.pickable.drop(item, ActorManager.instance.getPlayer());
			}
			ActorManager.instance.resume();
			this.waitTime += this.walkTime;
		}

		private throwItem(item: Actor) {
			if ( item.pickable ) {
				item.pickable.throw(item, ActorManager.instance.getPlayer());
			}
			ActorManager.instance.resume();
			this.waitTime += this.walkTime;
		}

		private pickupItem(owner: Actor, map: Map) {
			var foundItem: boolean = false;
			var pickedItem: boolean = false;
			ActorManager.instance.resume();
			this.waitTime += this.walkTime;
			ActorManager.instance.getItems().some(function(item: Actor) {
				if ( item.pickable && item.x === owner.x && item.y === owner.y ) {
					foundItem = true;
					if (owner.container.canContain(item)) {
						item.pickable.pick(item, owner);
						pickedItem = true;
						return true;
					}
					return false;
				} else {
					return false;
				}
			});
			if (! foundItem) {
				log("There's nothing to pick here.");
			} else if (! pickedItem) {
				log("Your inventory is full.");
			}
		}
	}

	/*
		Class: MonsterAi
		NPC monsters articial intelligence. Attacks the player when he is at melee range, 
		else moves towards him using scent tracking.
	*/
	export class MonsterAi extends Ai {
		private __path: Yendor.Position[];
		private static __pathFinder: Yendor.PathFinder;
		constructor(walkTime: number) {
			super(walkTime);
			this.className = "MonsterAi";
		}

		/*
			Function: update

			Parameters:
			owner - the actor owning this MonsterAi (the monster)
			map - the game map (used to check player line of sight)
		*/
		update(owner: Actor, map: Map) {
			super.update(owner, map);

			// don't update a dead monster
			if ( owner.destructible && owner.destructible.isDead()) {
				return;
			}
			// attack the player when at melee range, else try to track his scent
			this.searchPlayer(owner, map);
		}

		/*
			Function: searchPlayer
			If the player is at range, attack him. If in sight, move towards him, else try to track his scent.

			Parameters:
			owner - the actor owning this MonsterAi (the monster)
			map - the game map. Used to check if player is in sight
		*/
		searchPlayer(owner: Actor, map: Map) {
			if ( map.isInFov(owner.x, owner.y) ) {
				// player is visible, go towards him
				var player: Actor = ActorManager.instance.getPlayer();
				var dx = player.x - owner.x;
				var dy = player.y - owner.y;
				if ( Math.abs(dx) > 1 || Math.abs(dy) > 1) {
					if (! this.hasPath()
						|| this.__path[0].x !== player.x || this.__path[0].y !== player.y) {
						if (! MonsterAi.__pathFinder) {
							MonsterAi.__pathFinder = new Yendor.PathFinder(map.width, map.height,
								function(from: Yendor.Position, to: Yendor.Position): number {
									return map.canWalk(to.x, to.y) ? 1 : 0;
								});
						}
						this.__path = MonsterAi.__pathFinder.getPath(owner, player);
					}
					if ( this.__path ) {
						this.followPath(owner, map);
					}
				} else {
					// at melee range. attack
					this.move(owner, dx, dy, map);
				}
			} else {
				if ( this.hasPath() ) {
					// go to last known position
					this.followPath(owner, map);
				} else {
					// player not visible. Use scent tracking
					this.trackScent(owner, map);
				}
			}
		}

		private hasPath() {
			return this.__path && this.__path.length > 0;
		}

		private followPath(owner: Actor, map: Map) {
			// use precomputed path
			var pos: Yendor.Position = this.__path.pop();
			this.moveToCell(owner, pos, map);
		}

		private moveToCell(owner: Actor, pos: Yendor.Position, map: Map) {
			var dx: number = pos.x - owner.x;
			var dy: number = pos.y - owner.y;
			// compute the move vector
			var stepdx: number = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
			var stepdy: number = dy > 0 ? 1 : (dy < 0 ? -1 : 0);
			this.move(owner, stepdx, stepdy, map);
		}

		/*
			Function: move
			Move to a destination cell, avoiding potential obstacles (walls, other creatures)

			Parameters:
			owner - the actor owning this MonsterAi (the monster)
			stepdx - horizontal direction
			stepdy - vertical direction
			map - the game map (to check if a cell is walkable)
		*/
		private move(owner: Actor, stepdx: number, stepdy: number, map: Map) {
			var x: number = owner.x;
			var y: number = owner.y;
			if ( map.canWalk(owner.x + stepdx, owner.y + stepdy)) {
				// can walk
				x += stepdx;
				y += stepdy;
			} else if ( map.canWalk(owner.x + stepdx, owner.y)) {
				// horizontal slide
				x += stepdx;
			} else if ( map.canWalk(owner.x, owner.y + stepdy)) {
				// vertical slide
				y += stepdy;
			}
			super.moveOrAttack(owner, x, y, map);
		}

		/*
			Function: findHighestScentCell
			Find the adjacent cell with the highest scent value

			Parameters:
			owner - the actor owning this MonsterAi (the monster)
			map - the game map, used to skip wall cells from the search

			Returns:
			the cell position or undefined if no adjacent cell has enough scent.
		*/
		private findHighestScentCell(owner: Actor, map: Map): Yendor.Position {
			var bestScentLevel: number = 0;
			var bestCell: Yendor.Position;
			var adjacentCells: Yendor.Position[] = owner.getAdjacentCells(map.width, map.height);
			var len: number = adjacentCells.length;
			// scan all 8 adjacent cells
			for ( var i: number = 0; i < len; ++i) {
				if ( !map.isWall(adjacentCells[i].x, adjacentCells[i].y)) {
					// not a wall, check if scent is higher
					var scentAmount = map.getScent(adjacentCells[i].x, adjacentCells[i].y);
					if ( scentAmount > map.currentScentValue - Constants.SCENT_THRESHOLD
						&& scentAmount > bestScentLevel ) {
						// scent is higher. New candidate
						bestScentLevel = scentAmount;
						bestCell = adjacentCells[i];
					}
				}
			}
			return bestCell;
		}

		/*
			Function: trackScent
			Move towards the adjacent cell with the highest scent value
		*/
		private trackScent(owner: Actor, map: Map) {
			// get the adjacent cell with the highest scent value
			var bestCell: Yendor.Position = this.findHighestScentCell(owner, map);
			if ( bestCell ) {
				this.moveToCell(owner, bestCell, map);
			} else {
				this.waitTime += this.walkTime;
			}
		}
	}

	/********************************************************************************
	 * Group: actors
	 ********************************************************************************/
	/*
		Class: MonsterDestructible
		Contains an overloaded die function that logs the monsters death
	*/
	export class MonsterDestructible extends Destructible {
		constructor(_maxHp: number = 0, _defense: number = 0, _corpseName: string = "") {
			super(_maxHp, _defense, _corpseName);
			this.className = "MonsterDestructible";
		}

		die(owner: Actor) {
			log(owner.getThename() + " is dead. You gain " + this.xp + " xp.");
			EventBus.instance.publishEvent(new Event<number>( EventType.GAIN_XP, this.xp ));
			super.die(owner);
		}
	}

	/*
		Class: PlayerDestructible
		Contains an overloaded die function to notify the Engine about the player's death
	*/
	export class PlayerDestructible extends Destructible {
		constructor(_maxHp: number = 0, _defense: number = 0, _corpseName: string = "") {
			super(_maxHp, _defense, _corpseName);
			this.className = "PlayerDestructible";
		}

		die(owner: Actor) {
			log("You died!", "red");
			super.die(owner);
			EventBus.instance.publishEvent(new Event<GameStatus>( EventType.CHANGE_STATUS, GameStatus.DEFEAT ));
		}
	}

	export class Player extends Actor {
		private _xpLevel = 0;
		constructor() {
			super();
			this.className = "Player";
		}

		get xpLevel() { return this._xpLevel; }

		init(_x: number, _y: number, _ch: string, _name: string, _col: Yendor.Color) {
			super.init(_x, _y, _ch, _name, "creature|human", _col);
			this.ai = new PlayerAi(Constants.PLAYER_WALK_TIME);
			// default unarmed damages : 3 hit points
			this.attacker = new Attacker(3);
			// player has 30 hit points
			this.destructible = new PlayerDestructible(30, 0, "your cadaver");
			// player can carry up to 20 kg
			this.container = new Container(20, this.ai);
		}
		getNextLevelXp(): number {
			return Constants.XP_BASE_LEVEL + this._xpLevel * Constants.XP_NEW_LEVEL;
		}
		addXp(amount: number) {
			this.destructible.xp += amount;
			var nextLevelXp = this.getNextLevelXp();
			if ( this.destructible.xp >= nextLevelXp ) {
				this._xpLevel ++;
				this.destructible.xp -= nextLevelXp;
				log("Your battle skills grow stronger! You reached level " + this.xpLevel, 0xFF0000);
			}
		}

		update() {
			if ( (<PlayerAi>this.ai).lastAction === undefined ) {
				ActorManager.instance.pause();
			} else {
				this.ai.update(this, Map.instance);
			}
		}

		getaname(): string {
			return "you";
		}
		getAname(): string {
			return "You";
		}
		getthename(): string {
			return " you";
		}
		getThename(): string {
			return "You";
		}
		getVerbEnd(): string {
			return "";
		}
		getits(): string {
			return " your ";
		}
		getThenames(): string {
			return "Your ";
		}
		getthenames(): string {
			return " your ";
		}
		getit(): string {
			return " you ";
		}
	}
}
