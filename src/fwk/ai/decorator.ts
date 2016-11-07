/**
 * Section: Artificial intelligence
 */
import * as Core from "../core/main";
import * as Yendor from "../yendor/main";
import * as Actors from "../actors/main";

const CTX_KEY_CHILD_STATUS: string = "CHILD_STATUS";

/**
 * class: RangeCompareNode
 * Compare target distance to value. If result is true, execute child.
 */
export class RangeCompareNode extends Yendor.TestContextNode {
    constructor(targetKey: string, range: number, operator: Yendor.NodeOperatorEnum, child?: Yendor.AbstractNode) {
        super(targetKey, Yendor.ContextLevelEnum.GLOBAL, range, operator, child);
    }
    protected internalTick(tick: Yendor.Tick): Yendor.TickResultEnum {
        let target: Actors.Actor = tick.context.get(this.contextKey);
        let owner: Actors.Actor = <Actors.Actor>tick.userData;
        let distance: number = Core.Position.distance(target.pos, owner.pos);
        let childStatus: Yendor.TickResultEnum =
            <Yendor.TickResultEnum>tick.context.get(CTX_KEY_CHILD_STATUS, tick.tree.id, this.id);
        if (childStatus === Yendor.TickResultEnum.RUNNING || this.valueMatches(distance, this.value, this.operator)) {
            childStatus = (<Yendor.AbstractNode>this.children[0]).execute(tick);
            tick.context.set(CTX_KEY_CHILD_STATUS, childStatus, tick.tree.id, this.id);
            return childStatus;
        }
        return Yendor.TickResultEnum.FAILURE;
    }
}
