/**
 * Section: creatures
 */
import * as Core from "../core/main";
import * as Yendor from "../yendor/main";
import * as Umbra from "../umbra/main";
import * as Map from "../map/main";
import {IActorFeature, ActorId} from "./actor_feature";
import { transformMessage, PlayerActionEnum, getLastPlayerAction, convertActionToPosition} from "./base";
import {Actor, SpecialActorsEnum} from "./actor";
import {ConditionTypeEnum, IXpHolderDef} from "./actor_def";
import {Condition} from "./actor_condition";
import {IContainerListener, Attacker, Container} from "./actor_item";
import { SLOT_BOTH_HANDS, SLOT_LEFT_HAND, SLOT_RIGHT_HAND, OVERENCUMBERED_MULTIPLIER,
    FROZEN_MULTIPLIER, OVERENCUMBERED_THRESHOLD, SCENT_THRESHOLD} from "./base";
import {ITilePicker} from "./actor_effect";

/**
 * ==============================================================================
 * Group: artificial intelligence
 * ==============================================================================
 */

/**
 * Class: Ai
 * Owned by self-updating actors
 */
export class Ai implements IActorFeature, IContainerListener {
    private _conditions: Condition[];
    // time to make a step
    private _walkTime: number;
    private __tilePicker: ITilePicker|undefined;
    private __inventoryItemPicker: IInventoryItemPicker|undefined;
    private __lootHandler: ILootHandler|undefined;

    constructor(walkTime: number, tilePicker?: ITilePicker, inventoryItemPicker?: IInventoryItemPicker,
                lootHandler?: ILootHandler) {
        this._walkTime = walkTime;
        this.setPickers(tilePicker, inventoryItemPicker, lootHandler);
    }

    /**
     * function: setPickers
     * Used to restore pickers references after loading from persistence
     */
    public setPickers(tilePicker?: ITilePicker, inventoryPicker?: IInventoryItemPicker, lootHandler?: ILootHandler) {
        this.__tilePicker = tilePicker;
        this.__inventoryItemPicker = inventoryPicker;
        this.__lootHandler = lootHandler;
    }

    public getConditionTimeMultiplier() {
        let multiplier = 1.0;
        if (this.hasCondition(ConditionTypeEnum.OVERENCUMBERED)) {
            multiplier *= OVERENCUMBERED_MULTIPLIER;
        }
        if (this.hasCondition(ConditionTypeEnum.FROZEN)) {
            multiplier *= FROZEN_MULTIPLIER;
        }
        return multiplier;
    }

    get tilePicker(): ITilePicker|undefined { return this.__tilePicker; }

    get inventoryItemPicker(): IInventoryItemPicker|undefined { return this.__inventoryItemPicker; }

    get lootHandler(): ILootHandler|undefined { return this.__lootHandler; }

    get conditions(): Condition[] { return this._conditions; }

    get walkTime(): number {
        return this._walkTime;
    }
    set walkTime(newValue: number) { this._walkTime = newValue; }

    public update(owner: Actor) {
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

    public addCondition(cond: Condition, owner: Actor) {
        if (!this._conditions) {
            this._conditions = [];
        }
        this._conditions.push(cond);
        cond.onApply(owner);
    }

    public removeCondition(cond: ConditionTypeEnum) {
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

    public getConditionDescription(owner: Actor): string|undefined {
        // find the first valid condition
        if (! this._conditions) {
            return undefined;
        }
        let i: number = 0;
        while ( i < this._conditions.length ) {
            let condition: Condition = this._conditions[i];
            if ( condition.getName()) {
                if (! condition.noDisplay
                    && (!condition.noCorpse || ! owner.destructible || !owner.destructible.isDead())) {
                    return condition.getName();
                }
            }
            i++;
        }
        return undefined;
    }

    public hasActiveConditions(): boolean {
        let n: number = this._conditions ? this._conditions.length : 0;
        for (let i: number = 0; i < n; i++) {
            if (this._conditions[i].time > 0) {
                return true;
            }
        }
        return false;
    }

    public getCondition(type: ConditionTypeEnum): Condition|undefined {
        let n: number = this._conditions ? this._conditions.length : 0;
        for (let i: number = 0; i < n; i++) {
            if (this._conditions[i].type === type) {
                return this._conditions[i];
            }
        }
        return undefined;
    }

    public hasCondition(type: ConditionTypeEnum): boolean {
        return this.getCondition(type) !== undefined;
    }

    // listen to inventory events to manage OVERENCUMBERED condition
    public onAdd(_actorId: ActorId, container: Container, owner: Actor) {
        this.checkOverencumberedCondition(container, owner);
    }

    public onRemove(_actorId: ActorId, container: Container, owner: Actor) {
        this.checkOverencumberedCondition(container, owner);
    }

    /**
     * Function: tryActivate
     * Activate the first found lever in an adjacent tile
     */
    protected tryActivate(owner: Actor) {
        // try on the creature's cell
        let actors: Actor[] = Actor.list.filter( (actor: Actor) =>
            ( (actor.activable && ! actor.pickable)
              || (actor.container && (! actor.pickable || actor.pickable.containerId === undefined)))
            && actor.pos.equals(owner.pos)
            && actor !== owner
        );
        if (actors.length > 0) {
            this.activateActors(owner, actors);
            return;
        }
        // check on adjacent cells
        actors = Actor.list.filter( (actor: Actor) =>
            ( (actor.activable && ! actor.pickable)
              || (actor.container && (! actor.pickable || actor.pickable.containerId === undefined)))
            && actor.pos.isAdjacent(owner.pos)
            && actor !== owner
        );
        if (actors.length > 0) {
            this.activateActors(owner, actors);
        }
    }

    /**
     * Function: moveOrAttack
     * Try to move the owner to a new map cell. If there's a living creature on this map cell, attack it.
     * Parameters:
     * x - the destination cell x coordinate
     * y - the destination cell y coordinate
     * Returns:
     * true if the owner actually moved to the new cell
     */
    protected moveOrAttack(owner: Actor, x: number, y: number): boolean {
        if (this.hasCondition(ConditionTypeEnum.STUNNED)) {
            owner.wait(this._walkTime);
            return false;
        }
        if (this.hasCondition(ConditionTypeEnum.CONFUSED)) {
            // random move
            x = owner.pos.x + Yendor.CMWCRandom.default.getNumber(-1, 1);
            y = owner.pos.y + Yendor.CMWCRandom.default.getNumber(-1, 1);
        }
        if (x === owner.pos.x && y === owner.pos.y) {
            owner.wait(this._walkTime);
            return false;
        }
        // cannot move or attack a wall!
        if (Map.Map.current.isWall(x, y)) {
            owner.wait(this._walkTime);
            return false;
        }
        // check for living creatures on the destination cell
        let actors: Actor[] = Actor.list.filter((actor: Actor) =>
            actor.pos.x === x
            && actor.pos.y === y
            && actor.isA("creature[s]")
            && !actor.destructible.isDead()
        );
        if (actors.length > 0) {
            // attack the first living actor found on the cell
            let attacker: Attacker = owner.getAttacker();
            attacker.attack(owner, actors[0]);
            owner.wait(attacker.attackTime);
            return false;
        }
        // check for a closed door
        actors = Actor.list.filter((actor: Actor) =>
            actor.pos.x === x
            && actor.pos.y === y
            && actor.isA("door[s]")
            && !actor.activable.isActive()
        );
        if (actors.length > 0) {
            actors[0].activable.activate(actors[0], owner);
            owner.wait(this._walkTime);
            return false;
        }
        // check for unpassable items
        if (!Map.Map.current.canWalk(x, y)) {
            owner.wait(this._walkTime);
            return false;
        }
        // move the creature
        owner.wait(this._walkTime);
        owner.moveTo(x, y);
        return true;
    }

    private activateActors(owner: Actor, actors: Actor[]) {
        let containers: Actor[] = [];
        for (let actor of actors) {
            if (actor.activable) {
                actor.activable.switchLever(actor, owner);
                owner.wait(this._walkTime);
            } else if (actor.container) {
                containers.push(actor);
            }
        }
        if ( containers.length > 0  && this.lootHandler) {
            this.lootHandler.lootContainer(owner, containers);
        }
    }

    private checkOverencumberedCondition(container: Container, owner: Actor) {
        if (!this.hasCondition(ConditionTypeEnum.OVERENCUMBERED)
            && container.computeTotalWeight() >= container.capacity * OVERENCUMBERED_THRESHOLD) {
            this.addCondition(Condition.create({
                nbTurns: -1,
                type: ConditionTypeEnum.OVERENCUMBERED,
                noCorpse: true,
            }), owner);
        } else if (this.hasCondition(ConditionTypeEnum.OVERENCUMBERED)
            && container.computeTotalWeight() < container.capacity * OVERENCUMBERED_THRESHOLD) {
            this.removeCondition(ConditionTypeEnum.OVERENCUMBERED);
        }
    }
}

export class ItemAi extends Ai {
    constructor(walkTime: number) {
        super(walkTime, undefined, undefined, undefined);
    }

    public update(owner: Actor) {
        super.update(owner);
        owner.wait(this.walkTime);
    }
}

export interface IInventoryItemPicker {
    pickItemFromInventory(title: string, wearer: Actor, itemClassFilter?: string): Promise<Actor>;
}

export interface ILootHandler {
    lootContainer(actor: Actor, containers: Actor[]|Actor): void;
}

/**
 * Class: PlayerAi
 * Handles player input. Determin if a new game turn must be started.
 */
export class PlayerAi extends Ai {
    constructor(walkTime: number, tilePicker?: ITilePicker, inventoryPicker?: IInventoryItemPicker,
                lootHandler?: ILootHandler) {
        super(walkTime, tilePicker, inventoryPicker, lootHandler);
    }

    /**
     * Function: update
     * Updates the player.
     */
    public update(owner: Actor) {
        let action: PlayerActionEnum|undefined = getLastPlayerAction();
        if ( action === undefined ) {
            if (!Actor.scheduler.isPaused()) {
                Actor.scheduler.pause();
            }
            return;
        }
        // update conditions
        super.update(owner);
        // conditions might have killed the actor
        if (this.hasCondition(ConditionTypeEnum.STUNNED) || (owner.destructible && owner.destructible.isDead())) {
            owner.wait(this.walkTime);
            return;
        }
        switch (action) {
            case PlayerActionEnum.MOVE_NORTH:
            case PlayerActionEnum.MOVE_SOUTH:
            case PlayerActionEnum.MOVE_EAST:
            case PlayerActionEnum.MOVE_WEST:
            case PlayerActionEnum.MOVE_NW:
            case PlayerActionEnum.MOVE_NE:
            case PlayerActionEnum.MOVE_SW:
            case PlayerActionEnum.MOVE_SE:
                let move: Core.Position = convertActionToPosition(action);
                // move to the target cell or attack if there's a creature
                this.moveOrAttack(owner, owner.pos.x + move.x, owner.pos.y + move.y);
                break;
            case PlayerActionEnum.WAIT:
                owner.wait(this.walkTime);
                break;
            case PlayerActionEnum.GRAB:
            case PlayerActionEnum.USE_ITEM:
            case PlayerActionEnum.DROP_ITEM:
            case PlayerActionEnum.THROW_ITEM:
            case PlayerActionEnum.FIRE:
            case PlayerActionEnum.ZAP:
            case PlayerActionEnum.ACTIVATE:
                if (!this.hasCondition(ConditionTypeEnum.CONFUSED)) {
                    this.handleAction(owner, action);
                }
                break;
            case PlayerActionEnum.MOVE_UP:
            case PlayerActionEnum.MOVE_DOWN:
            default:
                // TODO. not supported. (flying mount or underwater swimming)
                break;
        }
    }

    /**
     * Function: moveOrAttack
     * Try to move the player to a new map call. if there's a living creature on this map cell, attack it.
     * Parameters:
     * owner - the actor owning this Attacker (the player)
     * x - the destination cell x coordinate
     * y - the destination cell y coordinate
     * Returns:
     * true if the player actually moved to the new cell
     */
    protected moveOrAttack(owner: Actor, x: number, y: number): boolean {
        if (!super.moveOrAttack(owner, x, y)) {
            return false;
        }
        let cellPos: Core.Position = new Core.Position(owner.pos.x, owner.pos.y);
        // no living actor. Log exising corpses and items
        Actor.describeCell(cellPos);
        return true;
    }

    private handleAction(owner: Actor, action: PlayerActionEnum) {
        switch (action) {
            case PlayerActionEnum.GRAB:
                this.pickupItem(owner);
                break;
            case PlayerActionEnum.USE_ITEM:
                if (this.inventoryItemPicker) {
                    this.inventoryItemPicker.pickItemFromInventory("use an item", owner).then((item: Actor) => {
                        this.useItem(owner, item);
                    });
                }
                break;
            case PlayerActionEnum.DROP_ITEM:
                if (this.inventoryItemPicker) {
                    this.inventoryItemPicker.pickItemFromInventory("drop an item", owner).then((item: Actor) => {
                        this.dropItem(owner, item);
                    });
                }
                break;
            case PlayerActionEnum.THROW_ITEM:
                if (this.inventoryItemPicker) {
                    this.inventoryItemPicker.pickItemFromInventory("throw an item", owner).then((item: Actor) => {
                        this.throwItem(owner, item);
                    });
                }
                break;
            case PlayerActionEnum.FIRE:
                this.fire(owner);
                break;
            case PlayerActionEnum.ZAP:
                this.zap(owner);
                break;
            case PlayerActionEnum.ACTIVATE:
                this.tryActivate(owner);
                break;
            default: break;
        }
    }

    /**
     * Function: fire
     * Fire a projectile using a ranged weapon.
     */
    private fire(owner: Actor) {
        // load the weapon and starts the tile picker
        let weapon: Actor|undefined = owner.container.getFromSlot(SLOT_RIGHT_HAND);
        if (!weapon || !weapon.ranged) {
            weapon = owner.container.getFromSlot(SLOT_BOTH_HANDS);
        }
        if (!weapon || !weapon.ranged) {
            weapon = owner.container.getFromSlot(SLOT_LEFT_HAND);
        }
        if (!weapon || !weapon.ranged) {
            Umbra.logger.error("You have no ranged weapon equipped.");
            return;
        }
        // note : this time is spent before you select the target. loading the projectile takes time
        owner.wait(weapon.ranged.loadTime);
        weapon.ranged.fire(owner, weapon).then((_fired: boolean) => {
            // if ( fired ) {
            //     owner.wait(this.walkTime);
            // }
        });
    }

    /**
     * Function: zap
     * Use a magic wand/staff/rod.
     */
    private zap(owner: Actor) {
        let staff: Actor|undefined = owner.container.getFromSlot(SLOT_RIGHT_HAND);
        if (!staff || !staff.magic) {
            staff = owner.container.getFromSlot(SLOT_BOTH_HANDS);
        }
        if (!staff || !staff.magic) {
            staff = owner.container.getFromSlot(SLOT_LEFT_HAND);
        }
        if (!staff || !staff.magic) {
            Umbra.logger.error("You have no magic item equipped.");
            return;
        }
        staff.magic.zap(staff, owner).then((_zapped: boolean) => {
            //owner.wait(this.walkTime);
        });
    }

    private useItem(owner: Actor, item: Actor) {
        if (item.pickable) {
            item.pickable.use(item, owner).then((used: boolean) => {
                if ( used ) {
                    owner.wait(this.walkTime);
                }
            });
        }
    }

    private dropItem(owner: Actor, item: Actor) {
        if (item.pickable) {
            item.pickable.drop(item, owner, undefined, undefined, undefined, true);
        }
        owner.wait(this.walkTime);
    }

    private throwItem(owner: Actor, item: Actor) {
        if (item.pickable) {
            item.pickable.throw(item, Actor.specialActors[SpecialActorsEnum.PLAYER], false).then(() => {
                owner.wait(this.walkTime);
            });
        }
    }

    private pickupItem(owner: Actor) {
        let foundItem: boolean = false;
        let pickedItem: boolean = false;
        owner.wait(this.walkTime);
        for (let item of Actor.list) {
            if (item.pickable && item.pos.equals(owner.pos) && item.pickable.containerId === undefined) {
                foundItem = true;
                if (owner.container.canContain(item)) {
                    item.pickable.pick(item, owner, true);
                    pickedItem = true;
                    break;
                }
            }
        }
        if (!foundItem) {
            Umbra.logger.warn("There's nothing to pick here.");
        } else if (!pickedItem) {
            Umbra.logger.warn("Your inventory is full.");
        }
    }
}

/**
 * Class: MonsterAi
 * NPC monsters articial intelligence. Attacks the player when he is at melee range,
 * else moves towards him using scent tracking.
 */
export class MonsterAi extends Ai {
    private static __pathFinder: Yendor.PathFinder;
    private __path: Core.Position[]|undefined;
    constructor(walkTime: number) {
        // TODO AI tile picker and inventory item picker for intelligent creatures
        super(walkTime, undefined, undefined, undefined);
    }

    public update(owner: Actor) {
        super.update(owner);

        // don't update a dead monster
        if (owner.destructible && owner.destructible.isDead()) {
            owner.wait(this.walkTime);
            return;
        }
        // attack the player when at melee range, else try to track his scent
        this.searchPlayer(owner);
    }

    /**
     * Function: searchPlayer
     * If the player is at range, attack him. If in sight, move towards him, else try to track his scent.
     */
    public searchPlayer(owner: Actor) {
        let currentMap: Map.Map = Map.Map.current;
        if (currentMap.isInFov(owner.pos.x, owner.pos.y)) {
            // player is visible, go towards him
            let player: Actor = Actor.specialActors[SpecialActorsEnum.PLAYER];
            let dx = player.pos.x - owner.pos.x;
            let dy = player.pos.y - owner.pos.y;
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                if ((!this.__path || this.__path.length === 0 )
                    || this.__path[0].x !== player.pos.x || this.__path[0].y !== player.pos.y) {
                    if (!MonsterAi.__pathFinder) {
                        MonsterAi.__pathFinder = new Yendor.PathFinder(currentMap.w, currentMap.h,
                            function(_from: Core.Position, to: Core.Position): number {
                                return currentMap.canWalk(to.x, to.y) ? 1 : 0;
                            });
                    }
                    this.__path = MonsterAi.__pathFinder.getPath(owner.pos, player.pos);
                }
                if (this.__path) {
                    this.followPath(owner);
                } else {
                    owner.wait(this.walkTime);
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
        if ( this.__path) {
            let pos: Core.Position|undefined = this.__path.pop();
            if ( pos ) {
                this.moveToCell(owner, pos);
            }
        }
    }

    private moveToCell(owner: Actor, pos: Core.Position) {
        let dx: number = pos.x - owner.pos.x;
        let dy: number = pos.y - owner.pos.y;
        // compute the move vector
        let stepdx: number = dx > 0 ? 1 : (dx < 0 ? -1 : 0);
        let stepdy: number = dy > 0 ? 1 : (dy < 0 ? -1 : 0);
        this.move(owner, stepdx, stepdy);
    }

    /**
     * Function: move
     * Move to a destination cell, avoiding potential obstacles (walls, other creatures)
     * Parameters:
     * stepdx - horizontal direction
     * stepdy - vertical direction
     */
    private move(owner: Actor, stepdx: number, stepdy: number) {
        let x: number = owner.pos.x;
        let y: number = owner.pos.y;
        let currentMap: Map.Map = Map.Map.current;
        if (currentMap.canWalk(x + stepdx, y + stepdy)) {
            // can walk
            x += stepdx;
            y += stepdy;
        } else if (currentMap.canWalk(x + stepdx, y)) {
            // horizontal slide
            x += stepdx;
        } else if (currentMap.canWalk(x, y + stepdy)) {
            // vertical slide
            y += stepdy;
        }
        super.moveOrAttack(owner, x, y);
    }

    /**
     * Function: findHighestScentCell
     * Find the adjacent cell with the highest scent value
     * Returns:
     * the cell position or undefined if no adjacent cell has enough scent.
     */
    private findHighestScentCell(owner: Actor): Core.Position|undefined {
        let bestScentLevel: number = 0;
        let bestCell: Core.Position|undefined;
        let currentMap: Map.Map = Map.Map.current;
        let adjacentCells: Core.Position[] = owner.pos.getAdjacentCells(currentMap.w, currentMap.h);
        // scan all 8 adjacent cells
        for (let cell of adjacentCells) {
            if (!currentMap.isWall(cell.x, cell.y)) {
                // not a wall, check if scent is higher
                let scentAmount = currentMap.getScent(cell.x, cell.y);
                if (scentAmount > currentMap.currentScentValue - SCENT_THRESHOLD
                    && scentAmount > bestScentLevel) {
                    // scent is higher. New candidate
                    bestScentLevel = scentAmount;
                    bestCell = cell;
                }
            }
        }
        return bestCell;
    }

    /**
     * Function: trackScent
     * Move towards the adjacent cell with the highest scent value
     */
    private trackScent(owner: Actor) {
        // get the adjacent cell with the highest scent value
        let bestCell: Core.Position|undefined = this.findHighestScentCell(owner);
        if (bestCell) {
            this.moveToCell(owner, bestCell);
        } else {
            owner.wait(this.walkTime);
        }
    }
}

export class XpHolder implements IActorFeature {
    private _xpLevel: number = 0;
    private baseLevel: number;
    private newLevel: number;
    private _xp: number = 0;

    constructor(def: IXpHolderDef) {
        if (def) {
            this.baseLevel = def.baseLevel;
            this.newLevel = def.newLevel;
        }
    }

    get xpLevel() { return this._xpLevel; }
    get xp() { return this._xp; }
    public getNextLevelXp(): number {
        return this.baseLevel + this._xpLevel * this.newLevel;
    }
    public addXp(owner: Actor, amount: number) {
        this._xp += amount;
        let nextLevelXp = this.getNextLevelXp();
        if (this._xp >= nextLevelXp) {
            this._xpLevel++;
            this._xp -= nextLevelXp;
            Umbra.logger.error(transformMessage("[The actor1's] battle skills grow stronger!" +
                " [The actor1] reached level " + this.xpLevel, owner));
        }
    }
}
