/**
 * Section: Behavior tree
 *
 * Adapted from https://github.com/behavior3/behavior3js
 */
import {
    AbstractNode, AbstractDecoratorNode, ContextLevelEnum,
    NodeOperatorEnum, Tick, TickResultEnum,
} from "./behavior";

/**
 * class: InverterNode
 * Return its child result, inverting SUCCESS and FAILURE.
 */
export class InverterNode extends AbstractDecoratorNode {
    constructor(child?: AbstractNode) {
        super();
        if (child) {
            this.addChild(child);
        }
    }
    protected internalTick(tick: Tick): TickResultEnum {
        let status: TickResultEnum = (<AbstractNode>this.children[0]).execute(tick);
        if (status === TickResultEnum.SUCCESS) {
            return TickResultEnum.FAILURE;
        } else if (status === TickResultEnum.FAILURE) {
            return TickResultEnum.SUCCESS;
        }
        return status;
    }
}

const CTX_KEY_TICK_COUNT: string = "tickCount";

/**
 * class: MaxTicksNode
 * If its child can't resolve in less than maxTicks ticks, return FAILURE.
 *
 */
export class MaxTicksNode extends AbstractDecoratorNode {
    public constructor(private maxTicks: number, child?: AbstractNode) {
        super();
        if (child) {
            this.addChild(child);
        }
    }

    protected open(tick: Tick) {
        tick.context.set(CTX_KEY_TICK_COUNT, 0, tick.tree.id, this.id);
    }

    protected internalTick(tick: Tick): TickResultEnum {
        let loopCount: number = tick.context.get(CTX_KEY_TICK_COUNT, tick.tree.id, this.id);
        if (loopCount < this.maxTicks) {
            tick.context.set(CTX_KEY_TICK_COUNT, loopCount + 1, tick.tree.id, this.id);
            return (<AbstractNode>this.children[0]).execute(tick);
        }
        return TickResultEnum.FAILURE;
    }
}

/**
 * class: WhileSuccessNode
 * requires count SUCCESS from its child to return SUCCESS. FAILURE aborts.
 *
 */
export class WhileSuccessNode extends AbstractDecoratorNode {
    public constructor(private count: number, child?: AbstractNode) {
        super();
        if (child) {
            this.addChild(child);
        }
    }

    protected open(tick: Tick) {
        tick.context.set(CTX_KEY_TICK_COUNT, 0, tick.tree.id, this.id);
    }

    protected internalTick(tick: Tick): TickResultEnum {
        let loopCount: number = tick.context.get(CTX_KEY_TICK_COUNT, tick.tree.id, this.id);
        let result: TickResultEnum = (<AbstractNode>this.children[0]).execute(tick);
        if (result === TickResultEnum.SUCCESS) {
            tick.context.set(CTX_KEY_TICK_COUNT, loopCount + 1, tick.tree.id, this.id);
            if (loopCount + 1 >= this.count) {
                return TickResultEnum.SUCCESS;
            } else {
                return TickResultEnum.RUNNING;
            }
        }
        return result;
    }
}

/**
 * class: UntilSuccessNode
 * try count times to get a SUCCESS from its child (returning RUNNING in case of FAILURE).
 */
export class UntilSuccessNode extends AbstractDecoratorNode {
    public constructor(private count: number, child?: AbstractNode) {
        super();
        if (child) {
            this.addChild(child);
        }
    }

    protected open(tick: Tick) {
        tick.context.set(CTX_KEY_TICK_COUNT, 0, tick.tree.id, this.id);
    }

    protected internalTick(tick: Tick): TickResultEnum {
        let loopCount: number = tick.context.get(CTX_KEY_TICK_COUNT, tick.tree.id, this.id);
        let result: TickResultEnum = (<AbstractNode>this.children[0]).execute(tick);
        if (result === TickResultEnum.FAILURE) {
            tick.context.set(CTX_KEY_TICK_COUNT, loopCount + 1, tick.tree.id, this.id);
            if (loopCount + 1 >= this.count) {
                return TickResultEnum.FAILURE;
            } else {
                return TickResultEnum.RUNNING;
            }
        }
        return result;
    }
}

/**
 * class: TestContextNode
 * TestContextNode(key, level) => run child if key is defined in context level else return FAILURE
 * TestContextNode(key, level, value) => run child if key matches value in context level else return FAILURE
 * TestContextNode(key, level, value operator) => run child if key in context level comparison with value is true
 * else return FAILURE
 */
export class TestContextNode extends AbstractDecoratorNode {
    public constructor(protected contextKey: string, private contextLevel: ContextLevelEnum,
        protected value?: any, protected operator?: NodeOperatorEnum, child?: AbstractNode) {
        super();
        if (child) {
            this.addChild(child);
        }
    }
    protected internalTick(tick: Tick): TickResultEnum {
        let contextValue: any;
        switch (this.contextLevel) {
            default:
            case ContextLevelEnum.GLOBAL:
                contextValue = tick.context.get(this.contextKey);
                break;
            case ContextLevelEnum.TREE:
                contextValue = tick.context.get(this.contextKey, tick.tree.id);
                break;
            case ContextLevelEnum.NODE:
                contextValue = tick.context.get(this.contextKey, tick.tree.id, this.id);
                break;
        }
        if (this.valueMatches(contextValue, this.value, this.operator)) {
            return (<AbstractNode>this.children[0]).execute(tick);
        }
        return TickResultEnum.FAILURE;
    }
    protected valueMatches(contextValue: any, value?: any, operator?: NodeOperatorEnum): boolean {
        if (value === undefined && operator === undefined) {
            // TextContextNode (key) => true if key is not undefined
            return contextValue !== undefined;
        } else if (operator === undefined) {
            // TestContextNode(key, value) => true if key === value
            return contextValue === value;
        } else {
            switch (operator) {
                default:
                case NodeOperatorEnum.EQUAL:
                    return contextValue === value;
                case NodeOperatorEnum.NOT_EQUAL:
                    return contextValue !== value;
                case NodeOperatorEnum.GREATER:
                    return contextValue > value;
                case NodeOperatorEnum.GREATER_OR_EQUAL:
                    return contextValue >= value;
                case NodeOperatorEnum.LESSER:
                    return contextValue < value;
                case NodeOperatorEnum.LESSER_OR_EQUAL:
                    return contextValue <= value;
            }
        }

    }
}
