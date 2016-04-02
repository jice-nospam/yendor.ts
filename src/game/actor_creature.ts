/**
	Section: creatures
*/
module Game {
    "use strict";

	/********************************************************************************
	 * Group: articifial intelligence
	 ********************************************************************************/

	/**
		Class: Ai
		Owned by self-updating actors
	*/
    export class Ai implements ActorFeature, ContainerListener {
        className: string;
        private _conditions: Condition[];
        // time to make a step
        private _walkTime: number;
        private ownerId: ActorId;
        private __owner: Actor;

        constructor(walkTime: number, owner: Actor) {
            this.className = "Game.Ai";
            this._walkTime = walkTime;
            if (owner) {
                this.ownerId = owner.id;
                this.__owner = owner;
            }
        }

        get owner(): Actor {
            if (this.__owner === undefined) {
                this.__owner = Engine.instance.actorManager.getActor(this.ownerId);
            }
            return this.__owner;
        }

        wait(time: number) {
            if (this.hasCondition(ConditionType.OVERENCUMBERED)) {
                time *= Constants.OVERENCUMBERED_MULTIPLIER;
            }
            if (this.hasCondition(ConditionType.FROZEN)) {
                time *= Constants.FROZEN_MULTIPLIER;
            }
            this.owner.wait(time);
        }

        get conditions() { return this._conditions; }

        get walkTime() {
            return this._walkTime;
        }
        set walkTime(newValue: number) { this._walkTime = newValue; }

        update() {
            if (!this._conditions) {
                return;
            }
            for (let i: number = 0, n: number = this._conditions.length; i < n; ++i) {
                let cond: Condition = this._conditions[i];
                if ((!cond.onlyIfActive || !this.owner.activable || this.owner.activable.isActive()) && !cond.update(this.owner)) {
                    cond.onRemove(this.owner);
                    this._conditions.splice(i, 1);
                    i--;
                    n--;
                }
            }
        }

        addCondition(cond: Condition) {
            if (!this._conditions) {
                this._conditions = [];
            }
            this._conditions.push(cond);
            cond.onApply(this.owner);
        }

        removeCondition(cond: ConditionType) {
            if (!this._conditions) {
                return;
            }
            for (let i: number = 0, n: number = this._conditions.length; i < n; ++i) {
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
            let n: number = this._conditions ? this._conditions.length : 0;
            for (let i: number = 0; i < n; i++) {
                if (this._conditions[i].time > 0) {
                    return true;
                }
            }
            return false;
        }

        getCondition(type: ConditionType): Condition {
            let n: number = this._conditions ? this._conditions.length : 0;
            for (let i: number = 0; i < n; i++) {
                if (this._conditions[i].type === type) {
                    return this._conditions[i];
                }
            }
            return undefined;
        }

        hasCondition(type: ConditionType): boolean {
            return this.getCondition(type) !== undefined;
        }

		/**
			Function: getAttacker
			Determin what will be used to attack
		*/
        private getAttacker(): Attacker {
            if (!this.owner) {
                return undefined;
            }
            if (this.owner.container) {
                // check for equipped weapons
                // TODO each equipped weapon should be used only once per turn
                for (let i: number = 0, n: number = this.owner.container.size(); i < n; ++i) {
                    let item: Actor = this.owner.container.get(i);
                    if (item.equipment && item.equipment.isEquipped() && item.attacker) {
                        return item.attacker;
                    }
                }
            }
            return this.owner.attacker;
        }

        /**
            Function: tryActivate
            Activate the first found lever in an adjacent tile
        */
        protected tryActivate() {
            // check if there's an adjacent door
            let actors: Actor[] = Engine.instance.actorManager.filter(function(actor: Actor): boolean {
                return actor.activable && ! actor.pickable && Math.abs(actor.pos.x - this.owner.pos.x) <= 1 && Math.abs(actor.pos.y - this.owner.pos.y) <= 1;
            }.bind(this));
            if (actors.length > 0) {
                actors[0].activable.switch(actors[0], this.owner);
                this.owner.wait(this._walkTime);
            } else {
                log("There's nothing to activate here.");
            }
        }

		/**
			Function: moveOrAttack
			Try to move the owner to a new map cell. If there's a living creature on this map cell, attack it.

			Parameters:
			x - the destination cell x coordinate
			y - the destination cell y coordinate

			Returns:
			true if the owner actually moved to the new cell
		*/
        protected moveOrAttack(x: number, y: number): boolean {
            if (this.hasCondition(ConditionType.STUNNED)) {
                this.owner.wait(this._walkTime);
                return false;
            }
            if (this.hasCondition(ConditionType.CONFUSED)) {
                // random move
                x = this.owner.pos.x + Engine.instance.rng.getNumber(-1, 1);
                y = this.owner.pos.y + Engine.instance.rng.getNumber(-1, 1);
            }
            if (x === this.owner.pos.x && y === this.owner.pos.y) {
                this.owner.wait(this._walkTime);
                return false;
            }
            // cannot move or attack a wall! 
            if (Engine.instance.map.isWall(x, y)) {
                this.owner.wait(this._walkTime);
                return false;
            }
            // check for living creatures on the destination cell
            let actors: Actor[] = Engine.instance.actorManager.filter(function(actor: Actor): boolean {
                return actor.pos.x === x && actor.pos.y === y && actor.isA("creature") && !actor.destructible.isDead();
            });
            if (actors.length > 0) {
                // attack the first living actor found on the cell
                let attacker: Attacker = this.getAttacker();
                attacker.attack(this.owner, actors[0]);
                this.owner.wait(attacker.attackTime);
                return false;
            }
            // check for a closed door
            actors = Engine.instance.actorManager.filter(function(actor: Actor): boolean {
                return actor.pos.x === x && actor.pos.y === y && actor.isA("door") && !actor.activable.isActive();
            });
            if (actors.length > 0) {
                actors[0].activable.activate(actors[0], this.owner);
                this.owner.wait(this._walkTime);
                return false;
            }
            // check for unpassable items
            if (!Engine.instance.map.canWalk(x, y)) {
                this.owner.wait(this._walkTime);
                return false;
            }
            // move the creature
            this.owner.wait(this._walkTime);
            this.owner.moveTo(x, y);
            return true;
        }

        // listen to inventory events to manage OVERENCUMBERED condition
        onAdd(actorId: ActorId, container: Container, owner: Actor) {
            this.checkOverencumberedCondition(container, owner);
        }

        onRemove(actorId: ActorId, container: Container, owner: Actor) {
            this.checkOverencumberedCondition(container, owner);
        }

        private checkOverencumberedCondition(container: Container, owner: Actor) {
            if (!this.hasCondition(ConditionType.OVERENCUMBERED)
                && container.computeTotalWeight() >= container.capacity * Constants.OVEREMCUMBERED_THRESHOLD) {
                this.addCondition(Condition.create({ type: ConditionType.OVERENCUMBERED, nbTurns: -1 }));
            } else if (this.hasCondition(ConditionType.OVERENCUMBERED)
                && container.computeTotalWeight() < container.capacity * Constants.OVEREMCUMBERED_THRESHOLD) {
                this.removeCondition(ConditionType.OVERENCUMBERED);
            }
        }
    }

    export class ItemAi extends Ai {
        constructor(walkTime: number, owner: Actor) {
            super(walkTime, owner);
            this.className = "Game.ItemAi";
        }

        update() {
            super.update();
            this.owner.wait(this.walkTime);
        }
    }

	/**
		Class: PlayerAi
		Handles player input. Determin if a new game turn must be started.
	*/
    export class PlayerAi extends Ai implements Umbra.EventListener {
        private __lastAction: PlayerAction;
        private __nextAction: PlayerAction;
        /** when using an item requires another player interaction, this is the item to use */
        private __lastActionItem: Actor;
        /** when using an item requires to select another actor, this is the selected actor */
        private __lastActionItem2: Actor;
        /** when using an item requires to select a tile, this is the selected tile */
        private __lastActionPos: Core.Position;
        enableEvents: boolean = true;
        constructor(walkTime: number, owner: Actor) {
            super(walkTime, owner);
            this.className = "Game.PlayerAi";
            Umbra.EventManager.registerEventListener(this, EventType[EventType.TILE_SELECTED]);
            Umbra.EventManager.registerEventListener(this, EventType[EventType.ACTOR_SELECTED]);
        }

        computeNextAction() {
            this.__nextAction = getLastPlayerAction();
        }

        onActorSelected(actor: Actor) {
            if (!this.__lastAction) {
                return;
            }
            this.__lastActionItem2 = actor;
            Engine.instance.actorManager.resume();
        }

        onTileSelected(pos: Core.Position) {
            if (!this.__lastAction) {
                return;
            }
            this.__lastActionPos = pos;
            Engine.instance.actorManager.resume();
        }

        private hasPendingAction(): boolean {
            if (this.owner.destructible.isDead()) {
                return false;
            }
            this.computeNextAction();
            return (this.__nextAction !== undefined || this.__lastActionPos !== undefined || this.__lastActionItem2 !== undefined);
        }

		/**
			Function: update
			Updates the player, eventually sends a CHANGE_STATUS event if a new turn has started.
		*/
        update() {
            if (!this.hasPendingAction()) {
                Engine.instance.actorManager.pause();
                return;
            }
            // update conditions
            super.update();
            // conditions might have killed the actor
            if (this.hasCondition(ConditionType.STUNNED) || (this.owner.destructible && this.owner.destructible.isDead())) {
                this.__nextAction = undefined;
                this.clearLastAction();
                this.owner.wait(this.walkTime);
                return;
            }
            let action: PlayerAction = this.__nextAction !== undefined ? this.__nextAction : this.__lastAction;
            switch (action) {
                case PlayerAction.MOVE_NORTH:
                case PlayerAction.MOVE_SOUTH:
                case PlayerAction.MOVE_EAST:
                case PlayerAction.MOVE_WEST:
                case PlayerAction.MOVE_NW:
                case PlayerAction.MOVE_NE:
                case PlayerAction.MOVE_SW:
                case PlayerAction.MOVE_SE:
                    let move: Core.Position = convertActionToPosition(action);
                    // move to the target cell or attack if there's a creature
                    this.moveOrAttack(this.owner.pos.x + move.x, this.owner.pos.y + move.y);
                    break;
                case PlayerAction.WAIT:
                    this.owner.wait(this.walkTime);
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
                    if (!this.hasCondition(ConditionType.CONFUSED)) {
                        this.handleAction(action);
                    }
                    break;
            }
            this.__lastAction = this.__nextAction;
            this.__nextAction = undefined;
        }

		/**
			Function: moveOrAttack
			Try to move the player to a new map call. if there's a living creature on this map cell, attack it.

			Parameters:
			owner - the actor owning this Attacker (the player)
			x - the destination cell x coordinate
			y - the destination cell y coordinate

			Returns:
			true if the player actually moved to the new cell
		*/
        protected moveOrAttack(x: number, y: number): boolean {
            if (!super.moveOrAttack(x, y)) {
                return false;
            }
            let cellPos: Core.Position = new Core.Position(this.owner.pos.x, this.owner.pos.y);
            let player: Actor = Engine.instance.actorManager.getPlayer();
            // no living actor. Log exising corpses and items
            Engine.instance.actorManager.filter(function(actor: Actor): boolean {
                return actor.pos.x === x && actor.pos.y === y && actor !== player && !player.contains(actor.id);
            }).forEach(function(actor: Actor) {
                log(actor.getTheresaname() + " here.");
            });
            return true;
        }

        private handleAction(action: PlayerAction) {
            switch (action) {
                case PlayerAction.GRAB:
                    this.pickupItem();
                    break;
                case PlayerAction.MOVE_DOWN:
                    let stairsDown: Actor = Engine.instance.actorManager.getStairsDown();
                    if (stairsDown.pos.equals(this.owner.pos)) {
                        Umbra.EventManager.publishEvent(EventType[EventType.CHANGE_STATUS], GameStatus.NEXT_LEVEL);
                    } else {
                        log("There are no stairs going down here.");
                    }
                    break;
                case PlayerAction.MOVE_UP:
                    let stairsUp: Actor = Engine.instance.actorManager.getStairsUp();
                    if (stairsUp.pos.equals(this.owner.pos)) {
                        log("The stairs have collapsed. You can't go up anymore...");
                    } else {
                        log("There are no stairs going up here.");
                    }
                    break;
                case PlayerAction.USE_ITEM:
                    if (this.__lastActionPos) {
                        // use on selected pos
                        this.__lastActionItem.pickable.useOnPos(this.__lastActionItem,
                            Engine.instance.actorManager.getPlayer(), this.__lastActionPos);
                        this.clearLastAction();
                        this.owner.wait(this.walkTime);
                    } else if (this.__lastActionItem2) {
                        // use on selected item
                        this.__lastActionItem.pickable.useOnActor(this.__lastActionItem,
                            Engine.instance.actorManager.getPlayer(), this.__lastActionItem2);
                        this.clearLastAction();
                        this.owner.wait(this.walkTime);
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
                        this.owner.wait(this.walkTime);
                    } else {
                        Umbra.EventManager.publishEvent(EventType[EventType.OPEN_INVENTORY], { title: "throw an item", itemListener: this.throwItem.bind(this) });
                    }
                    break;
                case PlayerAction.FIRE:
                    this.fire();
                    break;
                case PlayerAction.ZAP:
                    this.zap();
                    break;
                case PlayerAction.ACTIVATE:
                    this.tryActivate();
                    break;
            }
        }

        private clearLastAction() {
            this.__lastActionPos = undefined;
            this.__lastActionItem = undefined;
            this.__lastActionItem2 = undefined;
            this.__lastAction = undefined;
        }

		/**
			Function: fire
			Fire a projectile using a ranged weapon.
		*/
        private fire() {
            if (this.__lastActionPos) {
                // throw the projectile
                this.__lastActionItem.pickable.throwOnPos(this.__lastActionItem.ranged.projectile,
                    Engine.instance.actorManager.getPlayer(), true, this.__lastActionPos, this.__lastActionItem.ranged.damageCoef);
                this.clearLastAction();
                this.owner.wait(this.walkTime);
            } else {
                // load the weapon and starts the tile picker
                let weapon: Actor = this.owner.container.getFromSlot(Constants.SLOT_RIGHT_HAND);
                if (!weapon || !weapon.ranged) {
                    weapon = this.owner.container.getFromSlot(Constants.SLOT_BOTH_HANDS);
                }
                if (!weapon || !weapon.ranged) {
                    weapon = this.owner.container.getFromSlot(Constants.SLOT_LEFT_HAND);
                }
                if (!weapon || !weapon.ranged) {
                    log("You have no ranged weapon equipped.", 0xFF0000);
                    return;
                }
                this.__lastActionItem = weapon;
                weapon.ranged.fire(weapon, this.owner);
                // note : this time is spent before you select the target. loading the projectile takes time
                this.owner.wait(weapon.ranged.loadTime);
            }
        }

		/**
			Function: zap
			Use a magic wand/staff/rod.
		*/
        private zap() {
            if (this.__lastActionPos) {
                // zap on selected position
                this.__lastActionItem.magic.zapOnPos(this.__lastActionItem, Engine.instance.actorManager.getPlayer(), this.__lastActionPos);
                this.clearLastAction();
                this.owner.wait(this.walkTime);
            } else {
                let staff: Actor = this.owner.container.getFromSlot(Constants.SLOT_RIGHT_HAND);
                if (!staff || !staff.magic) {
                    staff = this.owner.container.getFromSlot(Constants.SLOT_BOTH_HANDS);
                }
                if (!staff || !staff.magic) {
                    staff = this.owner.container.getFromSlot(Constants.SLOT_LEFT_HAND);
                }
                if (!staff || !staff.magic) {
                    log("You have no magic item equipped.", 0xFF0000);
                    return;
                }
                this.__lastActionItem = staff;
                if (staff.magic.zap(staff, this.owner)) {
                    this.owner.wait(this.walkTime);
                }
            }
        }

        private useItem(item: Actor) {
            if (item.pickable) {
                this.__lastActionItem = item;
                if (item.pickable.use(item, Engine.instance.actorManager.getPlayer())) {
                    this.owner.wait(this.walkTime);
                }
            }
        }

        private dropItem(item: Actor) {
            if (item.pickable) {
                item.pickable.drop(item, Engine.instance.actorManager.getPlayer());
            }
            this.owner.wait(this.walkTime);
        }

        private throwItem(item: Actor) {
            if (item.pickable) {
                // open the tile picker
                this.__lastActionItem = item;
                item.pickable.throw(item, Engine.instance.actorManager.getPlayer());
            }
        }

        private pickupItem() {
            let foundItem: boolean = false;
            let pickedItem: boolean = false;
            this.owner.wait(this.walkTime);
            Engine.instance.actorManager.map(function(item: Actor) {
                if (item.pickable && item.pos.equals(this.owner.pos) && !this.owner.contains(item.id)) {
                    foundItem = true;
                    if (this.owner.container.canContain(item)) {
                        item.pickable.pick(item, this.owner);
                        pickedItem = true;
                        return true;
                    }
                    return false;
                } else {
                    return false;
                }
            }.bind(this));
            if (!foundItem) {
                log("There's nothing to pick here.");
            } else if (!pickedItem) {
                log("Your inventory is full.");
            }
        }
    }

	/**
		Class: MonsterAi
		NPC monsters articial intelligence. Attacks the player when he is at melee range, 
		else moves towards him using scent tracking.
	*/
    export class MonsterAi extends Ai {
        private __path: Core.Position[];
        private static __pathFinder: Yendor.PathFinder;
        constructor(walkTime: number, owner: Actor) {
            super(walkTime, owner);
            this.className = "Game.MonsterAi";
        }

		/**
			Function: update
		*/
        update() {
            super.update();

            // don't update a dead monster
            if (this.owner.destructible && this.owner.destructible.isDead()) {
                this.owner.wait(this.walkTime);
                return;
            }
            // attack the player when at melee range, else try to track his scent
            this.searchPlayer();
        }

		/**
			Function: searchPlayer
			If the player is at range, attack him. If in sight, move towards him, else try to track his scent.
		*/
        searchPlayer() {
            if (Engine.instance.map.isInFov(this.owner.pos.x, this.owner.pos.y)) {
                // player is visible, go towards him
                let player: Actor = Engine.instance.actorManager.getPlayer();
                let dx = player.pos.x - this.owner.pos.x;
                let dy = player.pos.y - this.owner.pos.y;
                if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                    if (!this.hasPath()
                        || this.__path[0].x !== player.pos.x || this.__path[0].y !== player.pos.y) {
                        if (!MonsterAi.__pathFinder) {
                            MonsterAi.__pathFinder = new Yendor.PathFinder(Engine.instance.map.w, Engine.instance.map.h,
                                function(from: Core.Position, to: Core.Position): number {
                                    return Engine.instance.map.canWalk(to.x, to.y) ? 1 : 0;
                                });
                        }
                        this.__path = MonsterAi.__pathFinder.getPath(this.owner.pos, player.pos);
                    }
                    if (this.__path) {
                        this.followPath();
                    } else {
                        this.owner.wait(this.walkTime);
                    }
                } else {
                    // at melee range. attack
                    this.move(dx, dy);
                }
            } else {
                if (this.hasPath()) {
                    // go to last known position
                    this.followPath();
                } else {
                    // player not visible. Use scent tracking
                    this.trackScent();
                }
            }
        }

        private hasPath() {
            return this.__path && this.__path.length > 0;
        }

        private followPath() {
            // use precomputed path
            let pos: Core.Position = this.__path.pop();
            this.moveToCell(pos);
        }

        private moveToCell(pos: Core.Position) {
            let dx: number = pos.x - this.owner.pos.x;
            let dy: number = pos.y - this.owner.pos.y;
            // compute the move vector
            let stepdx: number = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
            let stepdy: number = dy > 0 ? 1 : (dy < 0 ? -1 : 0);
            this.move(stepdx, stepdy);
        }

		/**
			Function: move
			Move to a destination cell, avoiding potential obstacles (walls, other creatures)

			Parameters:
			stepdx - horizontal direction
			stepdy - vertical direction
		*/
        private move(stepdx: number, stepdy: number) {
            let x: number = this.owner.pos.x;
            let y: number = this.owner.pos.y;
            if (Engine.instance.map.canWalk(x + stepdx, y + stepdy)) {
                // can walk
                x += stepdx;
                y += stepdy;
            } else if (Engine.instance.map.canWalk(x + stepdx, y)) {
                // horizontal slide
                x += stepdx;
            } else if (Engine.instance.map.canWalk(x, y + stepdy)) {
                // vertical slide
                y += stepdy;
            }
            super.moveOrAttack(x, y);
        }

		/**
			Function: findHighestScentCell
			Find the adjacent cell with the highest scent value

			Returns:
			the cell position or undefined if no adjacent cell has enough scent.
		*/
        private findHighestScentCell(): Core.Position {
            let bestScentLevel: number = 0;
            let bestCell: Core.Position;
            let adjacentCells: Core.Position[] = this.owner.pos.getAdjacentCells(Engine.instance.map.w, Engine.instance.map.h);
            let len: number = adjacentCells.length;
            // scan all 8 adjacent cells
            for (let i: number = 0; i < len; ++i) {
                if (!Engine.instance.map.isWall(adjacentCells[i].x, adjacentCells[i].y)) {
                    // not a wall, check if scent is higher
                    let scentAmount = Engine.instance.map.getScent(adjacentCells[i].x, adjacentCells[i].y);
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

		/**
			Function: trackScent
			Move towards the adjacent cell with the highest scent value
		*/
        private trackScent() {
            // get the adjacent cell with the highest scent value
            let bestCell: Core.Position = this.findHighestScentCell();
            if (bestCell) {
                this.moveToCell(bestCell);
            } else {
                this.owner.wait(this.walkTime);
            }
        }
    }

    export class XpHolder implements ActorFeature {
        className: string;
        private _xpLevel: number = 0;
        private baseLevel: number;
        private newLevel: number;
        private _xp: number = 0;

        constructor(def: XpHolderDef) {
            this.className = "Game.XpHolder";
            if (def) {
                this.baseLevel = def.baseLevel;
                this.newLevel = def.newLevel;
            }
        }

        get xpLevel() { return this._xpLevel; }
        get xp() { return this._xp; }
        getNextLevelXp(): number {
            return this.baseLevel + this._xpLevel * this.newLevel;
        }
        addXp(owner: Actor, amount: number) {
            this._xp += amount;
            let nextLevelXp = this.getNextLevelXp();
            if (this._xp >= nextLevelXp) {
                this._xpLevel++;
                this._xp -= nextLevelXp;
                log(transformMessage("[The actor1's] battle skills grow stronger! [The actor1] reached level " + this.xpLevel, owner), 0xFF0000);
            }
        }
    }

	/********************************************************************************
	 * Group: actors
	 ********************************************************************************/
    export class Player extends Actor {
        constructor(readableId: string) {
            super(readableId);
            this.className = "Game.Player";
        }

        moveTo(x: number, y: number) {
            super.moveTo(x, y);
            Engine.instance.map.setDirty();
            Engine.instance.map.updateScentField(x, y);
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
