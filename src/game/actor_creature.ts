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
        // time until next turn.
        private _waitTime: number = 0;
        // time to make a step
        private _walkTime: number;

        constructor(walkTime: number) {
            this.className = "Ai";
            this.walkTime = walkTime;
        }

        getWaitTime() { return this._waitTime; }
        
        reduceWaitTime(amount: number) {
            this._waitTime -= amount;
        }
        
        wait(time: number) {
            if (this.hasCondition(ConditionType.OVERENCUMBERED)) {
                time *= Constants.OVERENCUMBERED_MULTIPLIER;
            }
            if (this.hasCondition(ConditionType.FROZEN)) {
                time *= Constants.FROZEN_MULTIPLIER;
            }
            this._waitTime += time;            
        }

        get conditions() { return this._conditions; }

        get walkTime() {
            return this._walkTime;
        }
        set walkTime(newValue: number) { this._walkTime = newValue; }

        update(owner: Actor) {
            if (!this._conditions) {
                return;
            }
            for (let i: number = 0, n: number = this._conditions.length; i < n; ++i) {
                let cond: Condition = this._conditions[i];
                if ((!cond.onlyIfActive || !owner.activable || owner.activable.isActive()) && !cond.update(owner)) {
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
        private getAttacker(owner: Actor): Attacker {
            if (!owner) {
                return undefined;
            }
            if (owner.container) {
                // check for equipped weapons
                // TODO each equipped weapon should be used only once per turn
                for (let i: number = 0, n: number = owner.container.size(); i < n; ++i) {
                    let item: Actor = owner.container.get(i);
                    if (item.equipment && item.equipment.isEquipped() && item.attacker) {
                        return item.attacker;
                    }
                }
            }
            return owner.attacker;
        }

        /**
            Function: tryActivate
            Activate the first found lever in an adjacent tile
            
            Parameters:
			owner - the actor owning this Ai
        */
        protected tryActivate(owner: Actor) {
            // check if there's an adjacent lever
            let lever: Actor = Engine.instance.actorManager.findAdjacentActorWithFeature(owner, ActorFeatureType.LEVER);
            if (lever) {
                lever.lever.activate(owner);
                this.wait(this.walkTime);
            }
        }

		/**
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
                this.wait(this.walkTime);
                return false;
            }
            if (this.hasCondition(ConditionType.CONFUSED)) {
                // random move
                x = owner.x + Engine.instance.rng.getNumber(-1, 1);
                y = owner.y + Engine.instance.rng.getNumber(-1, 1);
            }
            if (x === owner.x && y === owner.y) {
                this.wait(this.walkTime);
                return false;
            }
            // cannot move or attack a wall! 
            if (Engine.instance.map.isWall(x, y)) {
                this.wait(this.walkTime);
                return false;
            }
            // check for living creatures on the destination cell
            let cellPos: Core.Position = new Core.Position(x, y);
            let actors: Actor[] = Engine.instance.actorManager.findActorsOnCell(cellPos, Engine.instance.actorManager.getCreatureIds());
            for (let i: number = 0, len: number = actors.length; i < len; ++i) {
                let actor: Actor = actors[i];
                if (actor.destructible && !actor.destructible.isDead()) {
                    // attack the first living actor found on the cell
                    let attacker: Attacker = this.getAttacker(owner);
                    attacker.attack(owner, actor);
                    this.wait(attacker.attackTime);
                    return false;
                }
            }
            // check for a closed door
            actors = Engine.instance.actorManager.findActorsOnCell(cellPos, Engine.instance.actorManager.getItemIds());
            for (let i: number = 0, len: number = actors.length; i < len; ++i) {
                let actor: Actor = actors[i];
                if (actor.door && !actor.door.isActive() && actor.lever) {
                    actor.lever.activate(owner);
                    this.wait(this.walkTime);
                    return false;
                }
            }
            // check for unpassable items
            if (!Engine.instance.map.canWalk(x, y)) {
                this.wait(this.walkTime);
                return false;
            }
            // move the creature
            this.wait(this.walkTime);
            owner.moveTo(x, y);
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
                this.addCondition(Condition.create({type:ConditionType.OVERENCUMBERED, nbTurns:-1}), owner);
            } else if (this.hasCondition(ConditionType.OVERENCUMBERED)
                && container.computeTotalWeight() < container.capacity * Constants.OVEREMCUMBERED_THRESHOLD) {
                this.removeCondition(ConditionType.OVERENCUMBERED);
            }

        }
    }

    export class ItemAi extends Ai {
        update(owner: Actor) {
            super.update(owner);
            this.wait(this.walkTime);
        }
    }

	/**
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
            this.__nextAction = getLastPlayerAction();
        }

        onTileSelected(pos: Core.Position) {
            if (!this.__lastAction) {
                return;
            }
            this.__lastActionPos = pos;
            Engine.instance.actorManager.resume();
        }

		/**
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
                this.wait(this.walkTime);
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
                    let move: Core.Position = convertActionToPosition(this.__nextAction);
                    // move to the target cell or attack if there's a creature
                    this.moveOrAttack(owner, owner.x + move.x, owner.y + move.y);
                    break;
                case PlayerAction.WAIT:
                    this.wait(this.walkTime);
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
        protected moveOrAttack(owner: Actor, x: number, y: number): boolean {
            if (!super.moveOrAttack(owner, x, y)) {
                return false;
            }
            let cellPos: Core.Position = new Core.Position(owner.x, owner.y);
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
                    let stairsDown: Actor = Engine.instance.actorManager.getStairsDown();
                    if (stairsDown.x === owner.x && stairsDown.y === owner.y) {
                        Umbra.EventManager.publishEvent(EventType[EventType.CHANGE_STATUS], GameStatus.NEXT_LEVEL);
                    } else {
                        log("There are no stairs going down here.");
                    }
                    break;
                case PlayerAction.MOVE_UP:
                    let stairsUp: Actor = Engine.instance.actorManager.getStairsUp();
                    if (stairsUp.x === owner.x && stairsUp.y === owner.y) {
                        log("The stairs have collapsed. You can't go up anymore...");
                    } else {
                        log("There are no stairs going up here.");
                    }
                    this.wait(this.walkTime);
                    break;
                case PlayerAction.USE_ITEM:
                    if (this.__lastActionPos) {
                        // use on selected pos
                        this.__lastActionItem.pickable.useOnPos(this.__lastActionItem,
                            Engine.instance.actorManager.getPlayer(), this.__lastActionPos);
                        this.clearLastAction();
                        this.wait(this.walkTime);
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
                        this.wait(this.walkTime);
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
                    this.tryActivate(owner);
                    break;
            }
        }

        private clearLastAction() {
            this.__lastActionPos = undefined;
            this.__lastActionItem = undefined;
            this.__lastAction = undefined;
        }

		/**
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
                let weapon: Actor = owner.container.getFromSlot(Constants.SLOT_RIGHT_HAND);
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
                this.wait(weapon.ranged.loadTime);
            }
        }

		/**
			Function: zap
			Use a magic wand/staff/rod.
		*/
        private zap(owner: Actor) {
            if (this.__lastActionPos) {
                // zap on selected position
                this.__lastActionItem.magic.zapOnPos(this.__lastActionItem, Engine.instance.actorManager.getPlayer(), this.__lastActionPos);
                this.wait(this.walkTime);
            } else {
                let staff: Actor = owner.container.getFromSlot(Constants.SLOT_RIGHT_HAND);
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
                    this.wait(this.walkTime);
                }
            }
        }

        private useItem(item: Actor) {
            if (item.pickable) {
                this.__lastActionItem = item;
                if (item.pickable.use(item, Engine.instance.actorManager.getPlayer())) {
                    this.wait(this.walkTime);
                }
            }
        }

        private dropItem(item: Actor) {
            if (item.pickable) {
                item.pickable.drop(item, Engine.instance.actorManager.getPlayer());
            }
            this.wait(this.walkTime);
        }

        private throwItem(item: Actor) {
            if (item.pickable) {
                // open the tile picker
                this.__lastActionItem = item;
                item.pickable.throw(item, Engine.instance.actorManager.getPlayer());
            }
        }

        private pickupItem(owner: Actor) {
            let foundItem: boolean = false;
            let pickedItem: boolean = false;
            this.wait(this.walkTime);
            Engine.instance.actorManager.getItemIds().some(function(itemId: ActorId) {
                let item: Actor = Engine.instance.actorManager.getActor(itemId);
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
    }

	/**
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

		/**
			Function: update

			Parameters:
			owner - the actor owning this MonsterAi (the monster)
		*/
        update(owner: Actor) {
            super.update(owner);

            // don't update a dead monster
            if (owner.destructible && owner.destructible.isDead()) {
                this.wait(this.walkTime);
                return;
            }
            // attack the player when at melee range, else try to track his scent
            this.searchPlayer(owner);
        }

		/**
			Function: searchPlayer
			If the player is at range, attack him. If in sight, move towards him, else try to track his scent.

			Parameters:
			owner - the actor owning this MonsterAi (the monster)
		*/
        searchPlayer(owner: Actor) {
            if (Engine.instance.map.isInFov(owner.x, owner.y)) {
                // player is visible, go towards him
                let player: Actor = Engine.instance.actorManager.getPlayer();
                let dx = player.x - owner.x;
                let dy = player.y - owner.y;
                if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                    if (!this.hasPath()
                        || this.__path[0].x !== player.x || this.__path[0].y !== player.y) {
                        if (!MonsterAi.__pathFinder) {
                            MonsterAi.__pathFinder = new Yendor.PathFinder(Engine.instance.map.w, Engine.instance.map.h,
                                function(from: Core.Position, to: Core.Position): number {
                                    return Engine.instance.map.canWalk(to.x, to.y) ? 1 : 0;
                                });
                        }
                        this.__path = MonsterAi.__pathFinder.getPath(owner, player);
                    }
                    if (this.__path) {
                        this.followPath(owner);
                    } else {
                        this.wait(this.walkTime);
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
            let pos: Core.Position = this.__path.pop();
            this.moveToCell(owner, pos);
        }

        private moveToCell(owner: Actor, pos: Core.Position) {
            let dx: number = pos.x - owner.x;
            let dy: number = pos.y - owner.y;
            // compute the move vector
            let stepdx: number = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
            let stepdy: number = dy > 0 ? 1 : (dy < 0 ? -1 : 0);
            this.move(owner, stepdx, stepdy);
        }

		/**
			Function: move
			Move to a destination cell, avoiding potential obstacles (walls, other creatures)

			Parameters:
			owner - the actor owning this MonsterAi (the monster)
			stepdx - horizontal direction
			stepdy - vertical direction
		*/
        private move(owner: Actor, stepdx: number, stepdy: number) {
            let x: number = owner.x;
            let y: number = owner.y;
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

		/**
			Function: findHighestScentCell
			Find the adjacent cell with the highest scent value

			Parameters:
			owner - the actor owning this MonsterAi (the monster)

			Returns:
			the cell position or undefined if no adjacent cell has enough scent.
		*/
        private findHighestScentCell(owner: Actor): Core.Position {
            let bestScentLevel: number = 0;
            let bestCell: Core.Position;
            let adjacentCells: Core.Position[] = owner.getAdjacentCells(Engine.instance.map.w, Engine.instance.map.h);
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
        private trackScent(owner: Actor) {
            // get the adjacent cell with the highest scent value
            let bestCell: Core.Position = this.findHighestScentCell(owner);
            if (bestCell) {
                this.moveToCell(owner, bestCell);
            } else {
                this.wait(this.walkTime);
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
            this.className="XpHolder";
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
            this.className = "Player";
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
