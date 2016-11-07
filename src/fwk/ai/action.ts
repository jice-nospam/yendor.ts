/**
 * Section: Artificial intelligence
 */
import * as Core from "../core/main";
import * as Yendor from "../yendor/main";
import * as Actors from "../actors/main";
import * as Map from "../map/main";
import { CTX_KEY_PATH, CTX_KEY_PATH_FINDER } from "./constants";

/**
 * class: AttackPlayerActionNode
 * If the player is at melee range, attack him and return SUCCESS.
 * Else return FAILURE
 */
export class AttackPlayerActionNode extends Yendor.AbstractActionNode {
    protected tick(tick: Yendor.Tick): Yendor.TickResultEnum {
        let owner: Actors.Actor = <Actors.Actor>tick.userData;
        let player: Actors.Actor = Actors.Actor.specialActors[Actors.SpecialActorsEnum.PLAYER];
        if (player.pos.isAdjacent(owner.pos)) {
            owner.ai.moveToCell(owner, player.pos, true);
            return Yendor.TickResultEnum.SUCCESS;
        }
        return Yendor.TickResultEnum.FAILURE;
    }
}

/**
 * class: MoveToActionNode
 * If the distance to target is less than or equal to minRange, return SUCCESS.
 * Else if the target is visible or a previous path to the target was computed, follow this path and return RUNNING
 * Else return FAILURE
 */
export class MoveToActionNode extends Yendor.AbstractActionNode {
    constructor(private targetContextKey: string, private minRange: number = 0) {
        super();
    }
    protected tick(tick: Yendor.Tick): Yendor.TickResultEnum {
        let currentMap: Map.Map = Map.Map.current;
        let owner: Actors.Actor = <Actors.Actor>tick.userData;
        let path: Core.Position[] | undefined = tick.context.get(CTX_KEY_PATH, tick.tree.id, this.id);
        // TODO actual "in sight" computation
        if (currentMap.isInFov(owner.pos.x, owner.pos.y)) {
            // target is visible, go towards it
            let target: Actors.Actor = tick.context.get(this.targetContextKey);
            if (!target.pos.isAdjacent(owner.pos) && Core.Position.distance(target.pos, owner.pos) > this.minRange) {
                if ((!path || path.length === 0)
                    || path[0].x !== target.pos.x || path[0].y !== target.pos.y) {
                    let pathFinder: Yendor.PathFinder = tick.context.get(CTX_KEY_PATH_FINDER);
                    if (!pathFinder) {
                        pathFinder = new Yendor.PathFinder(currentMap.w, currentMap.h,
                            function (_from: Core.Position, to: Core.Position): number {
                                return currentMap.canWalk(to.x, to.y) ? 1 : 0;
                            });
                        tick.context.set(CTX_KEY_PATH_FINDER, pathFinder);
                    }
                    path = pathFinder.getPath(owner.pos, target.pos);
                    tick.context.set(CTX_KEY_PATH, path, tick.tree.id, this.id);
                }
                if (path) {
                    // found a path
                    this.followPath(owner, path);
                    return Yendor.TickResultEnum.RUNNING;
                } else {
                    // no path found. wait
                    owner.wait(owner.ai.walkTime);
                    return Yendor.TickResultEnum.SUCCESS;
                }
            } else {
                // at range.
                return Yendor.TickResultEnum.SUCCESS;
            }
        } else if (path && path.length > 0) {
            // target not visible. follow last computed path (go to the target last know position)
            this.followPath(owner, path);
            return Yendor.TickResultEnum.RUNNING;
        }
        return Yendor.TickResultEnum.FAILURE;
    }

    private followPath(owner: Actors.Actor, path: Core.Position[]) {
        let pos: Core.Position | undefined = path.pop();
        if (pos) {
            owner.ai.moveToCell(owner, pos, false);
        }
    }
}

/**
 * class: TrackScentActionNode
 * If adjacent to player, return SUCCESS
 * else if scent is detected in surrounding cells, go to this cell and return RUNNING
 * else return FAILURE.
 */
export class TrackScentActionNode extends Yendor.AbstractActionNode {
    constructor(private scentThreshold: number) {
        super();
    }

    /**
     * Function: trackScent
     * Move towards the adjacent cell with the highest scent value
     */
    protected tick(tick: Yendor.Tick): Yendor.TickResultEnum {
        let owner: Actors.Actor = <Actors.Actor>tick.userData;
        let player: Actors.Actor = Actors.Actor.specialActors[Actors.SpecialActorsEnum.PLAYER];
        let dx: number = Math.abs(owner.pos.x - player.pos.x);
        let dy: number = Math.abs(owner.pos.y - player.pos.y);
        if (dx <= 1 && dy <= 1) {
            // adjacent to player
            return Yendor.TickResultEnum.SUCCESS;
        }
        // move to adjacent cell with the highest scent value
        let bestCell: Core.Position | undefined = this.findHighestScentCell(owner);
        if (bestCell) {
            owner.ai.moveToCell(owner, bestCell, false);
            return Yendor.TickResultEnum.RUNNING;
        }
        // no scent detected
        return Yendor.TickResultEnum.FAILURE;
    }

    /**
     * Function: findHighestScentCell
     * Find the adjacent cell with the highest scent value
     * Returns:
     * the cell position or undefined if no adjacent cell has enough scent.
     */
    private findHighestScentCell(owner: Actors.Actor): Core.Position | undefined {
        let bestScentLevel: number = 0;
        let bestCell: Core.Position | undefined;
        let currentMap: Map.Map = Map.Map.current;
        let adjacentCells: Core.Position[] = owner.pos.getAdjacentCells(currentMap.w, currentMap.h);
        // scan all 8 adjacent cells
        for (let cell of adjacentCells) {
            if (!currentMap.isWall(cell.x, cell.y)) {
                // not a wall, check if scent is higher
                let scentAmount = currentMap.getScent(cell.x, cell.y);
                if (scentAmount > currentMap.currentScentValue - this.scentThreshold
                    && scentAmount > bestScentLevel) {
                    // scent is higher. New candidate
                    bestScentLevel = scentAmount;
                    bestCell = cell;
                }
            }
        }
        return bestCell;
    }
}

/**
 * class: WaitActionNode
 * Wait one turn (always return SUCCESS)
 */
export class WaitActionNode extends Yendor.AbstractActionNode {
    protected tick(tick: Yendor.Tick): Yendor.TickResultEnum {
        let owner: Actors.Actor = <Actors.Actor>tick.userData;
        owner.wait(owner.ai.walkTime);
        return Yendor.TickResultEnum.SUCCESS;
    }
}
