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
	*/
	export enum ConditionType {
		CONFUSED,
		STUNNED,
	}

	/*
	 	Class: Condition
	 	Permanent or temporary effect affecting a creature
	*/
	export class Condition implements Persistent {
		className: string;
		/*
	 		Property: nbTurns
	 		Number of turns before this condition stops, or -1 for permanent conditions
		*/
		protected nbTurns: number;
		protected _type: ConditionType;
		private static condNames = [ "confused", "stunned" ];

		// factory
		static getCondition(type: ConditionType, nbTurns: number): Condition {
			switch ( type ) {
				case ConditionType.STUNNED :
					return new StunnedCondition(nbTurns);
				default :
					return new Condition(type, nbTurns);
			}
		}

		constructor(type: ConditionType, nbTurns: number) {
			this.className = "Condition";
			this.nbTurns = nbTurns;
			this._type = type;
		}

		get type() { return this._type; }

		getName() { return Condition.condNames[this._type]; }

		/*
			Function: update
			Returns:
				false if the condition has ended
		*/
		update(): boolean {
			if ( this.nbTurns > 0 ) {
				this.nbTurns--;
				return (this.nbTurns > 0);
			}
			return true;
		}
	}

	/*
		Class: StunnedCondition
		The creature cannot move or attack while stunned. Then it gets confused for a few turns
	*/
	export class StunnedCondition extends Condition {
		constructor(nbTurns: number) {
			super(ConditionType.STUNNED, nbTurns);
			this.className = "StunnedCondition";
		}

		update(): boolean {
			if (! super.update()) {
				if ( this.type === ConditionType.STUNNED) {
					// after being stunned, wake up confused
					this._type = ConditionType.CONFUSED;
					this.nbTurns = Constants.AFTER_STUNNED_CONFUSION_DELAY;
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
	export class Ai implements Persistent {
		className: string;
		private conditions: Condition[];

		constructor() {
			this.className = "Ai";
		}

		update(owner: Actor, map: Map) {
			var n: number = this.conditions ? this.conditions.length : 0;
			for ( var i: number = 0; i < n; i++) {
				if ( !this.conditions[i].update() ) {
					this.conditions.splice(i, 1);
					i--;
				}
			}
		}

		addCondition(cond: Condition) {
			if ( ! this.conditions ) {
				this.conditions = [];
			}
			this.conditions.push(cond);
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
				return false;
			}
			if ( this.hasCondition(ConditionType.CONFUSED)) {
				// random move
				x = owner.x + rng.getNumber(-1, 1);
				y = owner.y + rng.getNumber(-1, 1);
			}
			if ( x === owner.x && y === owner.y ) {
				return false;
			}
			// cannot move or attack a wall! 
			if ( map.isWall(x, y)) {
				return false;
			}
			// check for living creatures on the destination cell
			var cellPos: Yendor.Position = new Yendor.Position(x, y);
			var actors: Actor[] = ActorManager.instance.findActorsOnCell(cellPos, ActorManager.instance.getCreatures());
			for (var i = 0; i < actors.length; i++) {
				var actor: Actor = actors[i];
				if ( actor.destructible && ! actor.destructible.isDead() ) {
					// attack the first living actor found on the cell
					owner.attacker.attack( owner, actor );
					return false;
				}
			}
			// check for unpassable items
			if ( !map.canWalk(x, y)) {
				return false;
			}
			// move the creature
			owner.x = x;
			owner.y = y;
			return true;
		}
	}

	/*
		Class: PlayerAi
		Handles player input. Determin if a new game turn must be started.
	*/
	export class PlayerAi extends Ai implements EventListener {
		private lastAction: PlayerAction;
		constructor() {
			super();
			this.className = "PlayerAi";
			EventBus.instance.registerListener(this, EventType.KEYBOARD_INPUT);
		}

		/*
			Function: processEvent
			Stores the action from KEYBOARD_INPUT event so that <update> can use it.

			Parameters:
			action - the PlayerAction
		*/
		processEvent(event: Event<any>) {
			this.lastAction = (<KeyInput>event.data).action;
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
				return;
			}
			// check movement keys
			var move: Yendor.Position = convertActionToPosition(this.lastAction);
			var newTurn: boolean = false;
			if ( move.x === 0 && move.y === 0 ) {
				if (this.lastAction === PlayerAction.WAIT ) {
					newTurn = true;
				} else {
					if (! this.hasCondition(ConditionType.CONFUSED) && ! this.hasCondition(ConditionType.STUNNED)) {
						this.handleAction(owner, map);
					}
				}
			}
			if ( move.x !== 0 || move.y !== 0 )  {
				newTurn = true;
				// move to the target cell or attack if there's a creature
				if ( this.moveOrAttack(owner, owner.x + move.x, owner.y + move.y, map) ) {
					// the player actually move. Recompute the field of view
					map.computeFov(owner.x, owner.y, Constants.FOV_RADIUS);
				}
			}
			this.lastAction = undefined;
			if ( newTurn ) {
				// the player moved or try to move. New game turn
				EventBus.instance.publishEvent(new Event<GameStatus>(EventType.CHANGE_STATUS, GameStatus.NEW_TURN));
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
			if ( this.lastAction === PlayerAction.GRAB ) {
				this.pickupItem(owner, map);
			} else if ( this.lastAction === PlayerAction.MOVE_DOWN ) {
				var stairsDown: Actor = ActorManager.instance.getStairsDown();
				if ( stairsDown.x === owner.x && stairsDown.y === owner.y ) {
					EventBus.instance.publishEvent(new Event<void>(EventType.NEXT_LEVEL) );
				} else {
					log("There are no stairs going down here.");
				}
			} else if ( this.lastAction === PlayerAction.MOVE_UP ) {
				var stairsUp: Actor = ActorManager.instance.getStairsUp();
				if ( stairsUp.x === owner.x && stairsUp.y === owner.y ) {
					EventBus.instance.publishEvent(new Event<void>(EventType.PREV_LEVEL) );
				} else {
					log("There are no stairs going up here.");
				}
			} else if ( this.lastAction === PlayerAction.USE_ITEM ) {
				EventBus.instance.publishEvent(new Event<OpenInventoryEventData>(EventType.OPEN_INVENTORY,
					{ title: "use an item", itemListener: this.useItem.bind(this) } ));
				return true;
			} else if ( this.lastAction === PlayerAction.DROP_ITEM ) {
				EventBus.instance.publishEvent(new Event<OpenInventoryEventData>(EventType.OPEN_INVENTORY,
					{ title: "drop an item", itemListener: this.dropItem.bind(this) } ));
				return true;
			} else if ( this.lastAction === PlayerAction.THROW_ITEM ) {
				EventBus.instance.publishEvent(new Event<OpenInventoryEventData>(EventType.OPEN_INVENTORY,
					{ title: "throw an item", itemListener: this.throwItem.bind(this) } ));
				return true;
			}
		}

		// inventory item listeners
		private useItem(item: Actor) {
			if (item.pickable) {
				item.pickable.use(item, ActorManager.instance.getPlayer());
			}
		}

		private dropItem(item: Actor) {
			if ( item.pickable ) {
				item.pickable.drop(item, ActorManager.instance.getPlayer());
			}
		}

		private throwItem(item: Actor) {
			if ( item.pickable ) {
				item.pickable.throw(item, ActorManager.instance.getPlayer());
			}
		}

		private pickupItem(owner: Actor, map: Map) {
			var found: boolean = false;
			EventBus.instance.publishEvent(new Event<GameStatus>(EventType.CHANGE_STATUS, GameStatus.NEW_TURN));
			ActorManager.instance.getItems().some(function(item: Actor) {
				if ( item.pickable && item.x === owner.x && item.y === owner.y ) {
					found = true;
					item.pickable.pick(item, owner);
					return true;
				} else {
					return false;
				}
			});
			if (! found) {
				log("There's nothing to pick here.");
			}
		}
	}

	/*
		Class: MonsterAi
		NPC monsters articial intelligence. Attacks the player when he is at melee range, 
		else moves towards him using scent tracking.
	*/
	export class MonsterAi extends Ai {
		// static arrays to help scan adjacent cells
		private static TDX: number[] = [-1, 0, 1, -1, 1, -1, 0, 1];
		private static TDY: number[] = [-1, -1, -1, 0, 0, 1, 1, 1];

		constructor() {
			super();
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
			var player: Actor = ActorManager.instance.getPlayer();
			// attack the player when at melee range, else try to track his scent
			this.searchPlayer(owner, player.x, player.y, map);
		}

		/*
			Function: searchPlayer
			If the player is at range, attack him. If in sight, move towards him, else try to track his scent.

			Parameters:
			owner - the actor owning this MonsterAi (the monster)
			x - the destination cell x coordinate
			y - the destination cell y coordinate
			map - the game map. Used to check if player is in sight
		*/
		searchPlayer(owner: Actor, x: number, y: number, map: Map): boolean {
			if ( map.isInFov(owner.x, owner.y) ) {
				// player is visible, go towards him
				var dx: number = x - owner.x;
				var dy: number = y - owner.y;
				var distance: number = Math.sqrt(dx * dx + dy * dy);
				dx = dx / distance;
				dy = dy / distance;
				this.move(owner, dx, dy, map);
			} else {
				// player not visible. Use scent tracking
				this.trackScent(owner, map);
			}
			return true;
		}

		/*
			Function: move
			Move to a destination cell, avoiding potential obstacles (walls, other creatures)

			Parameters:
			owner - the actor owning this MonsterAi (the monster)
			dx - horizontal direction
			dy - vertical direction
			map - the game map (to check if a cell is walkable)
		*/
		private move(owner: Actor, dx: number, dy: number, map: Map) {
			// compute the unitary move vector
			var stepdx: number = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
			var stepdy: number = dy > 0 ? 1 : (dy < 0 ? -1 : 0);
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
		private trackScent(owner: Actor, map: Map) {
			// get the adjacent cell with the highest scent value
			var bestCellIndex: number = this.findHighestScentCellIndex(owner, map);
			if ( bestCellIndex !== -1 ) {
				// found. try to move 
				this.move(owner, MonsterAi.TDX[bestCellIndex], MonsterAi.TDY[bestCellIndex], map);
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
			this.ai = new PlayerAi();
			this.attacker = new Attacker(5);
			this.destructible = new PlayerDestructible(30, 0, "your cadaver");
			this.container = new Container(26);
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
				log("Your battle skills grow stronger! You reached level " + this.xpLevel, "#FF0000");
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
