/**
 * Section: Behavior tree
 *
 * Adapted from https://github.com/behavior3/behavior3js
 */
import { AbstractActionNode, Tick, TickResultEnum, BehaviorTree } from "./behavior";

export class ErrorNode extends AbstractActionNode {
    protected tick(_tick: Tick): TickResultEnum {
        return TickResultEnum.ERROR;
    }
}

export class FailureNode extends AbstractActionNode {
    protected tick(_tick: Tick): TickResultEnum {
        return TickResultEnum.FAILURE;
    }
}

export class RunningNode extends AbstractActionNode {
    protected tick(_tick: Tick): TickResultEnum {
        return TickResultEnum.RUNNING;
    }
}

export class SuccessNode extends AbstractActionNode {
    protected tick(_tick: Tick): TickResultEnum {
        return TickResultEnum.SUCCESS;
    }
}

export class WaitNode extends AbstractActionNode {
    public constructor(private tickCount: number) {
        super();
    }
    protected tick(_tick: Tick): TickResultEnum {
        this.tickCount--;
        if (this.tickCount <= 0) {
            return TickResultEnum.SUCCESS;
        }
        return TickResultEnum.RUNNING;
    }
}

export class RunTreeNode extends AbstractActionNode {
    public constructor(private tree: BehaviorTree) {
        super();
    }
    protected tick(_tick: Tick): TickResultEnum {
        return this.tree.tick(_tick.context, _tick.userData);
    }
}
