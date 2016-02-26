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
    export class Ai implements ActorFeature, ContainerListener {
        className: string;
        private _conditions: Condition[];
        // time until next turn.
        waitTime: number = 0;
        // time to make a step
        private _walkTime: number;

        constructor(walkTime: number) {
            this.className = "Ai";
            this.walkTime = walkTime;
        }

        get conditions() { return this._conditions; }

        get walkTime() {
            var time = this._walkTime;
            if (this.hasCondition(ConditionType.OVERENCUMBERED)) {
                time *= Constants.OVERENCUMBERED_MULTIPLIER;
            }
            if (this.hasCondition(ConditionType.FROZEN)) {
                time *= Constants.FROZEN_MULTIPLIER;
            }
            return time;
        }
        set walkTime(newValue: number) { this._walkTime = newValue; }

        update(owner: Actor) {
            if (!this._conditions) {
                return;
            }
            for (var i: number = 0, n: number = this._conditions.length; i < n; ++i) {
                var cond: Condition = this._conditions[i];
                if (!cond.update(owner)) {
                    cond.onRemove(owner);
                    this._conditions.splice(i, 1);
                    i--;
                    n--;
                }
            }
        }

        addCondition(cond: Condition, owner: Actor) {
            if (!this._conditions) {
                this._conditions = [];
            }
            this._conditions.push(cond);
            cond.onApply(owner);
        }

        removeCondition(cond: ConditionType) {
            if (!this._conditions) {
                return;
            }
            for (var i: number = 0, n: number = this._conditions.length; i < n; ++i) {
                if (this._conditions[i].type === cond) {
                    this._conditions.splice(i, 1);
                    break;
                }
            }
        }

        getConditionDescription(): string {
            return this._conditions && this._conditions.length > 0 ? this._conditions[0].getName() : undefined;
        }

        hasActiveConditions(): boolean {
            var n: number = this._conditions ? this._conditions.length : 0;
            for (var i: number = 0; i < n; i++) {
                if (this._conditions[i].time > 0) {
                    return true;
                }
            }
            return false;
        }

        getCondition(type: ConditionType): Condition {
            var n: number = this._conditions ? this._conditions.length : 0;
            for (var i: number = 0; i < n; i++) {
                if (this._conditions[i].type === type) {
                    return this._conditions[i];
                }
            }
            return undefined;
        }

        hasCondition(type: ConditionType): boolean {
            return this.getCondition(type) !== undefined;
        }

		/*
			Function: getAttacker
			Determin what will be used to attack
		*/
        private getAttacker(owner: Actor): Attacker {
            if (!owner) {
                return undefined;
            }
            if (owner.container) {
                // check for equipped weapons
                // TODO each equipped weapon should be used only once per turn
                for (var i: number = 0, n: number = owner.container.size(); i < n; ++i) {
                    var item: Actor = owner.container.get(i);
                    if (item.equipment && item.equipment.isEquipped() && item.attacker) {
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

			Returns:
			true if the owner actually moved to the new cell
		*/
        protected moveOrAttack(owner: Actor, x: number, y: number): boolean {
            if (this.hasCondition(ConditionType.STUNNED)) {
                this.waitTime += this.walkTime;
                return false;
            }
            if (this.hasCondition(ConditionType.CONFUSED)) {
                // random move
                x = owner.x + Engine.instance.rng.getNumber(-1, 1);
                y = owner.y + Engine.instance.rng.getNumber(-1, 1);
            }
            if (x === owner.x && y === owner.y) {
                this.waitTime += this.walkTime;
                return false;
            }
            // cannot move or attack a wall! 
            if (Engine.instance.map.isWall(x, y)) {
                this.waitTime += this.walkTime;
                return false;
            }
            // check for living creatures on the destination cell
            var cellPos: Core.Position = new Core.Position(x, y);
            var actors: Actor[] = Engine.instance.actorManager.findActorsOnCell(cellPos, Engine.instance.actorManager.getCreatureIds());
            for (var i: number = 0, len: number = actors.length; i < len; ++i) {
                var actor: Actor = actors[i];
                if (actor.destructible && !actor.destructible.isDead()) {
                    // attack the first living actor found on the cell
                    var attacker: Attacker = this.getAttacker(owner);
                    attacker.attack(owner, actor);
                    this.waitTime += attacker.attackTime;
                    return false;
                }
            }
            // check for unpassable items
            if (!Engine.instance.map.canWalk(x, y)) {
                this.waitTime += this.walkTime;
                return false;
            }
            // move the creature
            this.waitTime += this.walkTime;
            owner.moveTo(x, y);
            return true;
        }

        // listen to inventory events to manage OVERENCUMBERED condition
        onAdd(actor: Actor, container: Container, owner: Actor) {
            this.checkOverencumberedCondition(container, owner);
        }

        onRemove(actor: Actor, container: Container, owner: Actor) {
            this.checkOverencumberedCondition(container, owner);
        }

        private checkOverencumberedCondition(container: Container, owner: Actor) {
            if (!this.hasCondition(ConditionType.OVERENCUMBERED)
                && container.computeTotalWeight() >= container.capacity * Constants.OVEREMCUMBERED_THRESHOLD) {
                this.addCondition(Condition.create(ConditionType.OVERENCUMBERED, -1), owner);
            } else if (this.hasCondition(ConditionType.OVERENCUMBERED)
                && container.computeTotalWeight() < container.capacity * Constants.OVEREMCUMBERED_THRESHOLD) {
                this.removeCondition(ConditionType.OVERENCUMBERED);
            }

        }
    }

	/*
		Class: PlayerAi
		Handles player input. Determin if a new game turn must be started.
	*/
    export class PlayerAi extends Ai implements Umbra.EventListener {
        private __lastAction: PlayerAction;
        private __nextAction: PlayerAction;
        private __lastActionItem: Actor;
        private __lastActionPos: Core.Position;
        enableEvents: boolean = true;
        constructor(walkTime: number) {
            super(walkTime);
            this.className = "PlayerAi";
            Umbra.EventManager.registerEventListener(this, EventType[EventType.TILE_SELECTED]);
        }

        computeNextAction() {
            /*
            TODO remove
            for (var action in PlayerAction) {
                if (isNaN(parseInt(action))) {
                    if (Umbra.Input.wasButtonPressed(action)) {
                        this.__nextAction = PlayerAction[<string>action];
                    }
                }
            }
            */
            this.__nextAction = getLastPlayerAction();
        }

        onTileSelected(pos: Core.Position) {
            if (!this.__lastAction) {
                return;
            }
            this.__lastActionPos = pos;
            Engine.instance.actorManager.resume();
        }

		/*
			Function: update
			Updates the player, eventually sends a CHANGE_STATUS event if a new turn has started.

			Parameters:
			owner - the actor owning this PlayerAi (obviously, the player)
		*/
        update(owner: Actor) {
            this.computeNextAction();
            if (this.__nextAction === undefined) {
                if (this.__lastActionPos) {
                    this.handleAction(owner, this.__lastAction);
                    this.clearLastAction();
                    return;
                }
                Engine.instance.actorManager.pause();
                return;
            }
            super.update(owner);
            // don't update a dead actor
            if (owner.destructible && owner.destructible.isDead()) {
                this.__nextAction = undefined;
                this.waitTime += this.walkTime;
                return;
            }
            switch (this.__nextAction) {
                case PlayerAction.MOVE_NORTH:
                case PlayerAction.MOVE_SOUTH:
                case PlayerAction.MOVE_EAST:
                case PlayerAction.MOVE_WEST:
                case PlayerAction.MOVE_NW:
                case PlayerAction.MOVE_NE:
                case PlayerAction.MOVE_SW:
                case PlayerAction.MOVE_SE:
                    var move: Core.Position = convertActionToPosition(this.__nextAction);
                    // move to the target cell or attack if there's a creature
                    this.moveOrAttack(owner, owner.x + move.x, owner.y + move.y);
                    break;
                case PlayerAction.WAIT:
                    this.waitTime += this.walkTime;
                    break;
                case PlayerAction.GRAB:
                case PlayerAction.USE_ITEM:
                case PlayerAction.DROP_ITEM:
                case PlayerAction.THROW_ITEM:
                case PlayerAction.FIRE:
                case PlayerAction.ZAP:
                case PlayerAction.MOVE_UP:
                case PlayerAction.MOVE_DOWN:
                case PlayerAction.ACTIVATE:
                    if (!this.hasCondition(ConditionType.CONFUSED) && !this.hasCondition(ConditionType.STUNNED)) {
                        this.handleAction(owner, this.__nextAction);
                    }
                    break;
            }
            this.__lastAction = this.__nextAction;
            this.__nextAction = undefined;
        }

		/*
			Function: moveOrAttack
			Try to move the player to a new map call. if there's a living creature on this map cell, attack it.

			Parameters:
			owner - the actor owning this Attacker (the player)
			x - the destination cell x coordinate
			y - the destination cell y coordinate

			Returns:
			true if the player actually moved to the new cell
		*/
        protected moveOrAttack(owner: Actor, x: number, y: number): boolean {
            if (!super.moveOrAttack(owner, x, y)) {
                return false;
            }
            var cellPos: Core.Position = new Core.Position(owner.x, owner.y);
            // no living actor. Log exising corpses and items
            Engine.instance.actorManager.findActorsOnCell(cellPos, Engine.instance.actorManager.getCorpseIds()).forEach(function(actor: Actor) {
                log(actor.getTheresaname() + " here.");
            });
            Engine.instance.actorManager.findActorsOnCell(cellPos, Engine.instance.actorManager.getItemIds()).forEach(function(actor: Actor) {
                log(actor.getTheresaname() + " here.");
            });
            return true;
        }

        private handleAction(owner: Actor, action: PlayerAction) {
            switch (action) {
                case PlayerAction.GRAB:
                    this.pickupItem(owner);
                    break;
                case PlayerAction.MOVE_DOWN:
                    var stairsDown: Actor = Engine.instance.actorManager.getStairsDown();
                    if (stairsDown.x === owner.x && stairsDown.y === owner.y) {
                        Umbra.EventManager.publishEvent(EventType[EventType.CHANGE_STATUS], GameStatus.NEXT_LEVEL);
                    } else {
                        log("There are no stairs going down here.");
                    }
                    break;
                case PlayerAction.MOVE_UP:
                    var stairsUp: Actor = Engine.instance.actorManager.getStairsUp();
                    if (stairsUp.x === owner.x && stairsUp.y === owner.y) {
                        log("The stairs have collapsed. You can't go up anymore...");
                    } else {
                        log("There are no stairs going up here.");
                    }
                    this.waitTime += this.walkTime;
                    break;
                case PlayerAction.USE_ITEM:
                    if (this.__lastActionPos) {
                        // use on selected pos
                        this.__lastActionItem.pickable.useOnPos(this.__lastActionItem,
                            Engine.instance.actorManager.getPlayer(), this.__lastActionPos);
                        this.clearLastAction();
                        this.waitTime += this.walkTime;
                    } else {
                        Umbra.EventManager.publishEvent(EventType[EventType.OPEN_INVENTORY], { title: "use an item", itemListener: this.useItem.bind(this) });
                    }
                    break;
                case PlayerAction.DROP_ITEM:
                    Umbra.EventManager.publishEvent(EventType[EventType.OPEN_INVENTORY], { title: "drop an item", itemListener: this.dropItem.bind(this) });
                    break;
                case PlayerAction.THROW_ITEM:
                    if (this.__lastActionPos) {
                        // throw on selected pos
                        this.__lastActionItem.pickable.throwOnPos(this.__lastActionItem,
                            Engine.instance.actorManager.getPlayer(), false, this.__lastActionPos);
                        this.clearLastAction();
                        this.waitTime += this.walkTime;
                    } else {
                        Umbra.EventManager.publishEvent(EventType[EventType.OPEN_INVENTORY], { title: "throw an item", itemListener: this.throwItem.bind(this) });
                    }
                    break;
                case PlayerAction.FIRE:
                    this.fire(owner);
                    break;
                case PlayerAction.ZAP:
                    this.zap(owner);
                    break;
                case PlayerAction.ACTIVATE:
                    this.activate(owner);
                    break;
            }
        }

        private clearLastAction() {
            this.__lastActionPos = undefined;
            this.__lastActionItem = undefined;
            this.__lastAction = undefined;
        }

		/*
			Function: fire
			Fire a projectile using a ranged weapon.
		*/
        private fire(owner: Actor) {
            if (this.__lastActionPos) {
                // throw the projectile
                this.__lastActionItem.pickable.throwOnPos(this.__lastActionItem.ranged.projectile,
                    Engine.instance.actorManager.getPlayer(), true, this.__lastActionPos, this.__lastActionItem.ranged.damageCoef);
            } else {
                // load the weapon and starts the tile picker
                var weapon: Actor = owner.container.getFromSlot(Constants.SLOT_RIGHT_HAND);
                if (!weapon || !weapon.ranged) {
                    weapon = owner.container.getFromSlot(Constants.SLOT_BOTH_HANDS);
                }
                if (!weapon || !weapon.ranged) {
                    weapon = owner.container.getFromSlot(Constants.SLOT_LEFT_HAND);
                }
                if (!weapon || !weapon.ranged) {
                    log("You have no ranged weapon equipped.", 0xFF0000);
                    return;
                }
                this.__lastActionItem = weapon;
                weapon.ranged.fire(weapon, owner);
                // note : this time is spent before you select the target. loading the projectile takes time
                this.waitTime += weapon.ranged.loadTime;
            }
        }

		/*
			Function: zap
			Use a magic wand/staff/rod.
		*/
        private zap(owner: Actor) {
            if (this.__lastActionPos) {
                // zap on selected position
                this.__lastActionItem.magic.zapOnPos(this.__lastActionItem, Engine.instance.actorManager.getPlayer(), this.__lastActionPos);
                this.waitTime += this.walkTime;
            } else {
                var staff: Actor = owner.container.getFromSlot(Constants.SLOT_RIGHT_HAND);
                if (!staff || !staff.magic) {
                    staff = owner.container.getFromSlot(Constants.SLOT_BOTH_HANDS);
                }
                if (!staff || !staff.magic) {
                    staff = owner.container.getFromSlot(Constants.SLOT_LEFT_HAND);
                }
                if (!staff || !staff.magic) {
                    log("You have no magic item equipped.", 0xFF0000);
                    return;
                }
                this.__lastActionItem = staff;
                if (staff.magic.zap(staff, owner)) {
                    this.waitTime += this.walkTime;
                }
            }
        }

        private useItem(item: Actor) {
            if (item.pickable) {
                this.__lastActionItem = item;
                if (item.pickable.use(item, Engine.instance.actorManager.getPlayer())) {
                    this.waitTime += this.walkTime;
                }
            }
        }

        private dropItem(item: Actor) {
            if (item.pickable) {
                item.pickable.drop(item, Engine.instance.actorManager.getPlayer());
            }
            this.waitTime += this.walkTime;
        }

        private throwItem(item: Actor) {
            if (item.pickable) {
                // open the tile picker
                this.__lastActionItem = item;
                item.pickable.throw(item, Engine.instance.actorManager.getPlayer());
            }
        }

        private pickupItem(owner: Actor) {
            var foundItem: boolean = false;
            var pickedItem: boolean = false;
            this.waitTime += this.walkTime;
            Engine.instance.actorManager.getItemIds().some(function(itemId: ActorId) {
                var item: Actor = Engine.instance.actorManager.getActor(itemId);
                if (item.pickable && item.x === owner.x && item.y === owner.y) {
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
            if (!foundItem) {
                log("There's nothing to pick here.");
            } else if (!pickedItem) {
                log("Your inventory is full.");
            }
        }

        private activate(owner: Actor) {
            // check if there's an adjacent lever
            var lever: Actor = Engine.instance.actorManager.findAdjacentLever(owner);
            if (lever) {
                lever.lever.activate(owner);
                this.waitTime += this.walkTime;
            }
        }
    }

	/*
		Class: MonsterAi
		NPC monsters articial intelligence. Attacks the player when he is at melee range, 
		else moves towards him using scent tracking.
	*/
    export class MonsterAi extends Ai {
        private __path: Core.Position[];
        private static __pathFinder: Yendor.PathFinder;
        constructor(walkTime: number) {
            super(walkTime);
            this.className = "MonsterAi";
        }

		/*
			Function: update

			Parameters:
			owner - the actor owning this MonsterAi (the monster)
		*/
        update(owner: Actor) {
            super.update(owner);

            // don't update a dead monster
            if (owner.destructible && owner.destructible.isDead()) {
                this.waitTime += this.walkTime;
                return;
            }
            // attack the player when at melee range, else try to track his scent
            this.searchPlayer(owner);
        }

		/*
			Function: searchPlayer
			If the player is at range, attack him. If in sight, move towards him, else try to track his scent.

			Parameters:
			owner - the actor owning this MonsterAi (the monster)
		*/
        searchPlayer(owner: Actor) {
            if (Engine.instance.map.isInFov(owner.x, owner.y)) {
                // player is visible, go towards him
                var player: Actor = Engine.instance.actorManager.getPlayer();
                var dx = player.x - owner.x;
                var dy = player.y - owner.y;
                if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                    if (!this.hasPath()
                        || this.__path[0].x !== player.x || this.__path[0].y !== player.y) {
                        if (!MonsterAi.__pathFinder) {
                            MonsterAi.__pathFinder = new Yendor.PathFinder(Engine.instance.map.width, Engine.instance.map.height,
                                function(from: Core.Position, to: Core.Position): number {
                                    return Engine.instance.map.canWalk(to.x, to.y) ? 1 : 0;
                                });
                        }
                        this.__path = MonsterAi.__pathFinder.getPath(owner, player);
                    }
                    if (this.__path) {
                        this.followPath(owner);
                    } else {
                        this.waitTime += this.walkTime;
                    }
                } else {
                    // at melee range. attack
                    this.move(owner, dx, dy);
                }
            } else {
                if (this.hasPath()) {
                    // go to last known position
                    this.followPath(owner);
                } else {
                    // player not visible. Use scent tracking
                    this.trackScent(owner);
                }
            }
        }

        private hasPath() {
            return this.__path && this.__path.length > 0;
        }

        private followPath(owner: Actor) {
            // use precomputed path
            var pos: Core.Position = this.__path.pop();
            this.moveToCell(owner, pos);
        }

        private moveToCell(owner: Actor, pos: Core.Position) {
            var dx: number = pos.x - owner.x;
            var dy: number = pos.y - owner.y;
            // compute the move vector
            var stepdx: number = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
            var stepdy: number = dy > 0 ? 1 : (dy < 0 ? -1 : 0);
            this.move(owner, stepdx, stepdy);
        }

		/*
			Function: move
			Move to a destination cell, avoiding potential obstacles (walls, other creatures)

			Parameters:
			owner - the actor owning this MonsterAi (the monster)
			stepdx - horizontal direction
			stepdy - vertical direction
		*/
        private move(owner: Actor, stepdx: number, stepdy: number) {
            var x: number = owner.x;
            var y: number = owner.y;
            if (Engine.instance.map.canWalk(owner.x + stepdx, owner.y + stepdy)) {
                // can walk
                x += stepdx;
                y += stepdy;
            } else if (Engine.instance.map.canWalk(owner.x + stepdx, owner.y)) {
                // horizontal slide
                x += stepdx;
            } else if (Engine.instance.map.canWalk(owner.x, owner.y + stepdy)) {
                // vertical slide
                y += stepdy;
            }
            super.moveOrAttack(owner, x, y);
        }

		/*
			Function: findHighestScentCell
			Find the adjacent cell with the highest scent value

			Parameters:
			owner - the actor owning this MonsterAi (the monster)

			Returns:
			the cell position or undefined if no adjacent cell has enough scent.
		*/
        private findHighestScentCell(owner: Actor): Core.Position {
            var bestScentLevel: number = 0;
            var bestCell: Core.Position;
            var adjacentCells: Core.Position[] = owner.getAdjacentCells(Engine.instance.map.width, Engine.instance.map.height);
            var len: number = adjacentCells.length;
            // scan all 8 adjacent cells
            for (var i: number = 0; i < len; ++i) {
                if (!Engine.instance.map.isWall(adjacentCells[i].x, adjacentCells[i].y)) {
                    // not a wall, check if scent is higher
                    var scentAmount = Engine.instance.map.getScent(adjacentCells[i].x, adjacentCells[i].y);
                    if (scentAmount > Engine.instance.map.currentScentValue - Constants.SCENT_THRESHOLD
                        && scentAmount > bestScentLevel) {
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
        private trackScent(owner: Actor) {
            // get the adjacent cell with the highest scent value
            var bestCell: Core.Position = this.findHighestScentCell(owner);
            if (bestCell) {
                this.moveToCell(owner, bestCell);
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
            Umbra.EventManager.publishEvent(EventType[EventType.GAIN_XP], this.xp);
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
            log("You died!", Constants.LOG_CRIT_COLOR);
            super.die(owner);
            Umbra.EventManager.publishEvent(EventType[EventType.CHANGE_STATUS], GameStatus.DEFEAT);
        }
    }

    export class Player extends Actor {
        private _xpLevel = 0;
        constructor(readableId: string) {
            super(readableId);
            this.className = "Player";
        }

        get xpLevel() { return this._xpLevel; }

        init(_x: number, _y: number, _ch: string, _name: string, _col: Core.Color) {
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
            if (this.destructible.xp >= nextLevelXp) {
                this._xpLevel++;
                this.destructible.xp -= nextLevelXp;
                log("Your battle skills grow stronger! You reached level " + this.xpLevel, 0xFF0000);
            }
        }

        moveTo(x: number, y: number) {
            super.moveTo(x, y);
            Engine.instance.map.setDirty();
            Engine.instance.map.updateScentField(x, y);
        }

        update() {
            this.ai.update(this);
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
            return " you";
        }
        getis(): string {
            return " are";
        }
    }
}
