/// <reference path="actor.ts" />

/*
	Section: creatures
*/
module Game {
	"use strict";
	/********************************************************************************
	 * Group: articifial intelligence
	 ********************************************************************************/

	/*
		Class: Ai
		Owned by self-updating actors
	*/
	export class Ai implements Persistent {
		className: string;

		constructor() {
			this.className = "Ai";
		}

		update(owner: Actor, map: Map) {}

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
			// cannot move or attack a wall! 
			if ( map.isWall(x, y)) {
				return false;
			}
			// check for living creatures on the destination cell
			var cellPos: Yendor.Position = new Yendor.Position(x, y);
			var actors: Actor[] = ActorManager.instance.findActorsOnCell(cellPos, ActorManager.instance.getCreatures());
			var player = ActorManager.instance.getPlayer();
			if ( player !== owner && <Yendor.Position>player === cellPos ) {
				actors.push(player);
			}
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
			return true;
		}
	}

	/*
		Class: PlayerAi
		Handles player input. Determin in a new game turn must be started.
	*/
	export class PlayerAi extends Ai implements EventListener {
		private keyCode: number = 0;
		private keyChar: string;
		constructor() {
			super();
			this.className = "PlayerAi";
			EventBus.instance.registerListener(this, EventType.KEY_PRESSED);
		}

		/*
			Function: processEvent
			Stores the keyCode from KEY_PRESSED event so that <update> can use it.

			Parameters:
			event - the KEY_PRESSED <Event>
		*/
		processEvent(event: Event<any>) {
			this.keyCode = 0;
			this.keyChar = undefined;
			if ( event.type === EventType.KEY_PRESSED ) {
				this.keyCode = event.data.keyCode;
				this.keyChar = event.data.key;
			}
		}

		/*
			Function: update
			Updates the player, eventually sends a CHANGE_STATUS event if a new turn has started.

			Parameters:
			owner - the actor owning this PlayerAi (obviously, the player)
		*/
		update(owner: Actor, map: Map) {
			// don't update a dead actor
			if ( owner.destructible && owner.destructible.isDead()) {
				return;
			}
			// check movement keys
			var dx : number = 0;
			var dy : number = 0;
			var newTurn: boolean = false;
			switch (this.keyCode) {
				// cardinal movements
				case KeyEvent.DOM_VK_LEFT:
				case KeyEvent.DOM_VK_NUMPAD4:
					dx = -1;
				break;
				case KeyEvent.DOM_VK_RIGHT:
				case KeyEvent.DOM_VK_NUMPAD6:
					dx = 1;
				break;
				case KeyEvent.DOM_VK_UP:
				case KeyEvent.DOM_VK_NUMPAD8:
					dy = -1;
				break;
				case KeyEvent.DOM_VK_DOWN:
				case KeyEvent.DOM_VK_NUMPAD2:
					dy = 1;
				break;
				// diagonal movements
				case KeyEvent.DOM_VK_NUMPAD7:
					dx = -1;
					dy = -1;
				break;
				case KeyEvent.DOM_VK_NUMPAD9:
					dx = 1;
					dy = -1;
				break;
				case KeyEvent.DOM_VK_NUMPAD1:
					dx = -1;
					dy = 1;
				break;
				case KeyEvent.DOM_VK_NUMPAD3:
					dx = 1;
					dy = 1;
				break;
				// other movements
				case KeyEvent.DOM_VK_NUMPAD5:
					// wait for a turn
					newTurn = true;
				break;
				default : this.handleActionKey(owner, map); break;
			}
			if ( dx !== 0 || dy !== 0 )  {
				newTurn = true;
				// move to the target cell or attack if there's a creature
				if ( this.moveOrAttack(owner, owner.x + dx, owner.y + dy, map) ) {
					// the player actually move. Recompute the field of view
					map.computeFov(owner.x, owner.y, Constants.FOV_RADIUS);
				}
			}
			this.keyCode = undefined;
			this.keyChar = undefined;
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
			var cellPos: Yendor.Position = new Yendor.Position(x, y);
			// no living actor. Log exising corpses and items
			ActorManager.instance.findActorsOnCell(cellPos, ActorManager.instance.getCorpses()).forEach(function(actor: Actor) {
				log(actor.getTheresaname() + " here.");
			});
			ActorManager.instance.findActorsOnCell(cellPos, ActorManager.instance.getItems()).forEach(function(actor: Actor) {
				log(actor.getTheresaname() + " here.");
			});
			// move the player
			owner.x = x;
			owner.y = y;
			return true;
		}

		private handleActionKey(owner: Actor, map: Map) {
			if ( this.keyChar === "g" ) {
				this.pickupItem(owner, map);
			} else if ( this.keyChar === ">") {
				var stairsDown: Actor = ActorManager.instance.getStairsDown();
				if ( stairsDown.x === owner.x && stairsDown.y === owner.y ) {
					EventBus.instance.publishEvent(new Event<void>(EventType.NEXT_LEVEL) );
				} else {
					log("There are no stairs going down here.");
				}
			} else if ( this.keyChar === "<") {
				var stairsUp: Actor = ActorManager.instance.getStairsUp();
				if ( stairsUp.x === owner.x && stairsUp.y === owner.y ) {
					EventBus.instance.publishEvent(new Event<void>(EventType.PREV_LEVEL) );
				} else {
					log("There are no stairs going up here.");
				}
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
			// don't update a dead monster
			if ( owner.destructible && owner.destructible.isDead()) {
				return;
			}
			// attack the player when at melee range, else try to track his scent
			var player: Actor = ActorManager.instance.getPlayer();
			this.moveOrAttack(owner, player.x, player.y, map);
		}

		/*
			Function: moveOrAttack
			If the player is at range, attack him. If in sight, move towards him, else try to track his scent.

			Parameters:
			owner - the actor owning this MonsterAi (the monster)
			x - the destination cell x coordinate
			y - the destination cell y coordinate
			map - the game map. Used to check if player is in sight
		*/
		moveOrAttack(owner: Actor, x: number, y: number, map: Map): boolean {
			var dx: number = x - owner.x;
			var dy: number = y - owner.y;
			// compute distance from player
			var distance: number = Math.sqrt(dx * dx + dy * dy);
			if ( distance < 2 ) {
				// at melee range. Attack !
				if ( owner.attacker ) {
					owner.attacker.attack(owner, ActorManager.instance.getPlayer());
				}
			} else if ( map.isInFov(owner.x, owner.y) ) {
				// not at melee range, but in sight. Move towards him
				dx = dx / distance;
				dy = dy / distance;
				this.move(owner, dx, dy, map);
			} else {
				// player not in range. Use scent tracking
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
			if ( map.canWalk(owner.x + stepdx, owner.y + stepdy)) {
				// can walk
				owner.x += stepdx;
				owner.y += stepdy;
			} else if ( map.canWalk(owner.x + stepdx, owner.y)) {
				// horizontal slide
				owner.x += stepdx;
			} else if ( map.canWalk(owner.x, owner.y + stepdy)) {
				// vertical slide
				owner.y += stepdy;
			}
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

	/*
		Class: TemporaryAi
		Some artificial intelligence that temporarily replace a NPC Ai.
		Stores the old Ai to be able to restore it.
	*/
	export class TemporaryAi extends Ai {
		private _nbTurns: number;
		private oldAi: Ai;

		constructor(_nbTurns: number) {
			super();
			this.className = "TemporaryAi";
			this._nbTurns = _nbTurns;
		}

		update(owner: Actor, map: Map) {
			this._nbTurns--;
			if ( this._nbTurns === 0 ) {
				owner.ai = this.oldAi;
			}
		}

		applyTo(actor: Actor) {
			this.oldAi = actor.ai;
			actor.ai = this;
		}
	}


	/*
		Class: ConfusedMonsterAi
		NPC monsters articial intelligence. Moves randomly, 
		then attacks any creature at melee range.
	*/
	export class ConfusedMonsterAi extends TemporaryAi {

		constructor(_nbTurns: number) {
			super(_nbTurns);
			this.className = "ConfusedMonsterAi";
		}
		/*
			Function: update

			Parameters:
			owner - the actor owning this MonsterAi (the monster)
			map - the game map (used to check player line of sight)
		*/
		update(owner: Actor, map: Map) {
			// don't update a dead monster
			if ( owner.destructible && owner.destructible.isDead()) {
				return;
			}
			this.moveRandomly(owner, map);
			super.update(owner, map);
			if ( owner === ActorManager.instance.getPlayer()) {
				EventBus.instance.publishEvent(new Event<GameStatus>(EventType.CHANGE_STATUS, GameStatus.NEW_TURN));
			}
		}

		/*
			Function: moveRandomly
			Move in a random direction, attacking anything on this cell.

			Parameters:
			owner - the actor owning this MonsterAi (the monster)
			map - the game map. Used to check if player is in sight
		*/
		private moveRandomly(owner: Actor, map: Map) {
			var dx: number = rng.getNumber(-1, 1);
			var dy: number = rng.getNumber(-1, 1);
			if (dx !== 0 && dy !== 0 && super.moveOrAttack(owner, owner.x + dx, owner.y + dy, map)) {
				owner.x += dx;
				owner.y += dy;
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
			super.init(_x, _y, _ch, _name, _col);
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
