/**
 * Section: Behavior tree
 *
 * Adapted from https://github.com/behavior3/behavior3js
 */
import { AbstractNode, AbstractCompositeNode, Tick, TickResultEnum } from "./behavior";

/**
 * class: SelectorNode
 * Executes childs in sequence.
 * Returns the status of the first child not returning FAILURE.
 * If all children return FAILURE, return FAILURE.
 */
export class SelectorNode extends AbstractCompositeNode {
    constructor(children?: AbstractNode[]) {
        super();
        if (children) {
            for (let child of children) {
                this.addChild(child);
            }
        }
    }

    protected tick(tick: Tick): TickResultEnum {
        for (let child of this.children) {
            let status: TickResultEnum = (<AbstractNode>child).execute(tick);
            if (status !== TickResultEnum.FAILURE) {
                return status;
            }
        }
        return TickResultEnum.FAILURE;
    }
}

/**
 * class: SequenceNode
 * Executes childs in sequence.
 * Returns the status of the first child not returning SUCCESS.
 * If all children return SUCCESS, return SUCCESS.
 */
export class SequenceNode extends AbstractCompositeNode {
    constructor(children?: AbstractNode[]) {
        super();
        if (children) {
            for (let child of children) {
                this.addChild(child);
            }
        }
    }

    protected tick(tick: Tick): TickResultEnum {
        for (let child of this.children) {
            let status: TickResultEnum = (<AbstractNode>child).execute(tick);
            if (status !== TickResultEnum.SUCCESS) {
                return status;
            }
        }
        return TickResultEnum.SUCCESS;
    }
}

const CTX_KEY_RUNNING_CHILD: string = "runningChild";

/**
 * class: MemSelectorNode
 * Same behavior as SelectorNode, but start at the last RUNNING child
 */
export class MemSelectorNode extends AbstractCompositeNode {
    protected open(tick: Tick) {
        tick.context.set(CTX_KEY_RUNNING_CHILD, 0, tick.tree.id, this.id);
    }

    protected tick(tick: Tick): TickResultEnum {
        let index: number = tick.context.get(CTX_KEY_RUNNING_CHILD, tick.tree.id, this.id);
        while (index < this.children.length) {
            let status: TickResultEnum = (<AbstractNode>this.children[index]).execute(tick);
            if (status !== TickResultEnum.FAILURE) {
                if (status === TickResultEnum.RUNNING) {
                    tick.context.set(CTX_KEY_RUNNING_CHILD, index, tick.tree.id, this.id);
                }
                return status;
            }
            index++;
        }
        return TickResultEnum.FAILURE;
    }
}

/**
 * class: MemSequenceNode
 * Same behavior as SequenceNode, but start at the last RUNNING child
 */
export class MemSequenceNode extends AbstractCompositeNode {
    protected open(tick: Tick) {
        tick.context.set(CTX_KEY_RUNNING_CHILD, 0, tick.tree.id, this.id);
    }

    protected tick(tick: Tick): TickResultEnum {
        let index: number = tick.context.get(CTX_KEY_RUNNING_CHILD, tick.tree.id, this.id);
        while (index < this.children.length) {
            let status: TickResultEnum = (<AbstractNode>this.children[index]).execute(tick);
            if (status !== TickResultEnum.SUCCESS) {
                if (status === TickResultEnum.RUNNING) {
                    tick.context.set(CTX_KEY_RUNNING_CHILD, index, tick.tree.id, this.id);
                }
                return status;
            }
            index++;
        }
        return TickResultEnum.SUCCESS;
    }
}
