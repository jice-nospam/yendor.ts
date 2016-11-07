/**
 * Section: Behavior tree
 *
 * Inspired by https://github.com/behavior3/behavior3js
 * and https://docs.unrealengine.com/latest/INT/Engine/AI/BehaviorTrees/index.html
 */
import * as Core from "../core/main";

const CTX_KEY_OPEN: string = "open";
const CTX_KEY_OPEN_NODES: string = "openNodes";
const CTX_KEY_NODE_COUNT: string = "nodeCount";

export const enum NodeCategoryEnum {
    COMPOSITE = 1,
    DECORATOR,
    ACTION,
    CONDITION,
}

export const enum TickResultEnum {
    SUCCESS = 1,
    FAILURE,
    RUNNING,
    ERROR
}

export const enum ContextLevelEnum {
    GLOBAL = 1,
    TREE,
    NODE
}

export const enum NodeOperatorEnum {
    LESSER,
    LESSER_OR_EQUAL,
    EQUAL,
    NOT_EQUAL,
    GREATER,
    GREATER_OR_EQUAL
}

interface IDictionnary {
    [index: string]: any;
};

interface ITreeDictionnary extends IDictionnary {
    nodeDictionnaries: { [index: number]: IDictionnary };
    openNodes: AbstractNode[];
    traversalDepth: number;
    traversalCycle: number;
}

export class Context {
    public globalCtx: IDictionnary = {};
    public treeCtx: { [index: number]: ITreeDictionnary } = {};

    public set(key: string, value: any, treeid?: number, nodeid?: number) {
        if (treeid === undefined && nodeid === undefined) {
            this.globalCtx[key] = value;
        } else if (nodeid === undefined) {
            this.getTreeDictionnary(treeid!)[key] = value;
        } else {
            this.getNodeDictionnary(treeid!, nodeid!)[key] = value;
        }
    }

    public get(key: string, treeid?: number, nodeid?: number): any {
        if (treeid === undefined && nodeid === undefined) {
            return this.globalCtx[key];
        } else if (nodeid === undefined) {
            return this.getTreeDictionnary(treeid!)[key];
        } else {
            return this.getNodeDictionnary(treeid!, nodeid!)[key];
        }
    }

    private getTreeDictionnary(treeid: number): ITreeDictionnary {
        let dic: ITreeDictionnary = this.treeCtx[treeid];
        if (dic === undefined) {
            dic = {
                nodeDictionnaries: [],
                openNodes: [],
                traversalDepth: 0,
                traversalCycle: 0,
            };
            this.treeCtx[treeid] = dic;
        }
        return dic;
    }

    private getNodeDictionnary(treeid: number, nodeid: number): IDictionnary {
        let treeDic: ITreeDictionnary = this.getTreeDictionnary(treeid);
        let nodeDic: IDictionnary = treeDic.nodeDictionnaries[nodeid];
        if (nodeDic === undefined) {
            nodeDic = {};
            treeDic.nodeDictionnaries[nodeid] = nodeDic;
        }
        return nodeDic;
    }
}

export class Tick {
    private _nodeCount: number = 0;
    private _openNodes: AbstractNode[] = [];

    public get openNodes(): AbstractNode[] { return this._openNodes; }
    public get nodeCount(): number { return this._nodeCount; }
    public get context(): Context { return this._context; }
    public get tree(): BehaviorTree { return this._tree; }

    public constructor(private _tree: BehaviorTree, private _context: Context, public userData?: any) {
    }

    public enterNode(_node: AbstractNode) {
    }

    public isOpen(node: AbstractNode): boolean {
        return this._context.get(CTX_KEY_OPEN, this._tree.id, node.id) === true;
    }

    public openNode(node: AbstractNode) {
        this._nodeCount++;
        this._openNodes.push(node);
        this._context.set(CTX_KEY_OPEN, true, this._tree.id, node.id);
    }

    public tickNode(_node: AbstractNode) {
    }

    public closeNode(node: AbstractNode) {
        this._openNodes.pop();
        this._context.set(CTX_KEY_OPEN, false, this._tree.id, node.id);
    }

    public exitNode(_node: AbstractNode) {
    }
}

export abstract class AbstractNode extends Core.TreeNode {
    private static seq: number = 0;
    public readonly id: number;

    public constructor(protected category: NodeCategoryEnum) {
        super();
        this.id = AbstractNode.seq++;
    }

    public execute(tick: Tick): TickResultEnum {
        this._enter(tick);
        if (!tick.isOpen(this)) {
            this._open(tick);
        }
        let status: TickResultEnum = this._tick(tick);
        if (status !== TickResultEnum.RUNNING) {
            this._close(tick);
        }
        this._exit(tick);
        return status;
    }

    public _close(tick: Tick) {
        tick.closeNode(this);
        this.close(tick);
    }

    // to be implemented / overloaded by subclasses
    protected enter(_tick: Tick) { }
    protected open(_tick: Tick) { }
    protected abstract tick(tick: Tick): TickResultEnum;
    protected close(_tick: Tick) { }
    protected exit(_tick: Tick) { }

    private _enter(tick: Tick) {
        tick.enterNode(this);
        this.enter(tick);
    }

    private _open(tick: Tick) {
        tick.openNode(this);
        this.open(tick);
    }

    private _tick(tick: Tick): TickResultEnum {
        tick.tickNode(this);
        return this.tick(tick);
    }

    private _exit(tick: Tick) {
        tick.exitNode(this);
        this.exit(tick);
    }
}

export class BehaviorTree {
    private static seq: number = 0;

    public readonly id: number;

    public constructor(public name: string, public root: AbstractNode) {
        this.id = BehaviorTree.seq++;
    }

    public tick(context: Context, userData?: any) {
        let tick: Tick = new Tick(this, context, userData);
        let result: TickResultEnum = this.root.execute(tick);
        let lastOpenNodes: AbstractNode[] = context.get(CTX_KEY_OPEN_NODES, this.id);
        let currentOpenNodes: AbstractNode[] = tick.openNodes.slice(0);
        let start: number = 0;
        for (let i: number = 0; i < Math.min(lastOpenNodes.length, currentOpenNodes.length); ++i) {
            start = i + 1;
            if (lastOpenNodes[i] !== currentOpenNodes[i]) {
                break;
            }
        }
        for (let i: number = lastOpenNodes.length - 1; i >= start; --i) {
            lastOpenNodes[i]._close(tick);
        }
        context.set(CTX_KEY_OPEN_NODES, currentOpenNodes, this.id);
        context.set(CTX_KEY_NODE_COUNT, tick.nodeCount, this.id);
        return result;
    }
}

export abstract class AbstractCompositeNode extends AbstractNode {
    public constructor() {
        super(NodeCategoryEnum.COMPOSITE);
    }
}

export abstract class AbstractDecoratorNode extends AbstractNode {
    public constructor() {
        super(NodeCategoryEnum.DECORATOR);
    }
    protected tick(tick: Tick): TickResultEnum {
        if (this.children.length !== 1) {
            console.log("ERROR : " + this.constructor.name + " should have only one child");
            return TickResultEnum.ERROR;
        }
        return this.internalTick(tick);
    }
    protected abstract internalTick(tick: Tick): TickResultEnum;
}

export abstract class AbstractConditionNode extends AbstractNode {
    public constructor() {
        super(NodeCategoryEnum.CONDITION);
    }
}

export abstract class AbstractActionNode extends AbstractNode {
    public constructor() {
        super(NodeCategoryEnum.ACTION);
    }
}
