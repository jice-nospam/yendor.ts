import * as tsUnit from "../tsUnit";
import * as Yendor from "../../fwk/yendor/main";

class DummyNode extends Yendor.AbstractNode {
    public static get globalLog(): string { return DummyNode._globalLog; }
    public static clearGlobalLog() {
        DummyNode._globalLog = "";
    }

    private static _globalLog: string = "";

    private _tickCount: number = 0;
    private _executionLog: string = "";

    public get tickCount(): number { return this._tickCount; }
    public get executionLog(): string { return this._executionLog; }

    public constructor(private status: Yendor.TickResultEnum) {
        super(Yendor.NodeCategoryEnum.ACTION);
    }

    protected enter(_tick: Yendor.Tick) {
        this.log("enter");
    }

    protected open(_tick: Yendor.Tick) {
        this.log("open");
    }

    protected tick(_tick: Yendor.Tick): Yendor.TickResultEnum {
        this.log("tick");
        this._tickCount++;
        return this.status;
    }

    protected close(_tick: Yendor.Tick) {
        this.log("close");
    }

    protected exit(_tick: Yendor.Tick) {
        this.log("exit");
    }

    private log(event: string) {
        this._executionLog += event + "|";
        DummyNode._globalLog += event + "[" + this.id + "]|";
    }
}

export class BehaviorTests extends tsUnit.TestClass {
    public setUp() {
        Yendor.Persistence.registerClass(DummyNode);
    }

    public doOpenNode() {
        let node: DummyNode = new DummyNode(Yendor.TickResultEnum.RUNNING);
        let tree: Yendor.BehaviorTree = new Yendor.BehaviorTree("test", node);
        let ctx: Yendor.Context = new Yendor.Context();
        let tick: Yendor.Tick = new Yendor.Tick(tree, ctx);
        node.execute(tick);
        this.isTrue(ctx.get("open", tree.id, node.id));
        this.isTrue(node.executionLog === "enter|open|tick|exit|");
    }

    public doCloseNode() {
        let node: DummyNode = new DummyNode(Yendor.TickResultEnum.SUCCESS);
        let tree: Yendor.BehaviorTree = new Yendor.BehaviorTree("test", node);
        let ctx: Yendor.Context = new Yendor.Context();
        let tick: Yendor.Tick = new Yendor.Tick(tree, ctx);
        node.execute(tick);
        this.isFalse(ctx.get("open", tree.id, node.id));
        console.log(node.executionLog);
    }

    public doCallMethods() {
        let node: DummyNode = new DummyNode(Yendor.TickResultEnum.SUCCESS);
        let tree: Yendor.BehaviorTree = new Yendor.BehaviorTree("test", node);
        let ctx: Yendor.Context = new Yendor.Context();
        let tick: Yendor.Tick = new Yendor.Tick(tree, ctx);
        node.execute(tick);
        this.isTrue(node.tickCount === 1);
        this.isTrue(node.executionLog === "enter|open|tick|close|exit|");
    }

    public dontReopenNode() {
        let node: DummyNode = new DummyNode(Yendor.TickResultEnum.RUNNING);
        let tree: Yendor.BehaviorTree = new Yendor.BehaviorTree("test", node);
        let ctx: Yendor.Context = new Yendor.Context();
        let tick: Yendor.Tick = new Yendor.Tick(tree, ctx);
        node.execute(tick);
        node.execute(tick);
        this.isTrue(node.executionLog === "enter|open|tick|exit|enter|tick|exit|");
    }

    public treeExecutes() {
        let node: DummyNode = new DummyNode(Yendor.TickResultEnum.SUCCESS);
        let tree: Yendor.BehaviorTree = new Yendor.BehaviorTree("test", node);
        let ctx: Yendor.Context = new Yendor.Context();
        tree.root = node;
        tree.tick(ctx);
        this.isTrue(node.executionLog === "enter|open|tick|close|exit|");
    }

    public treeUpdatesContext() {
        let node: DummyNode = new DummyNode(Yendor.TickResultEnum.RUNNING);
        let tree: Yendor.BehaviorTree = new Yendor.BehaviorTree("test", node);
        let ctx: Yendor.Context = new Yendor.Context();
        tree.root = node;
        tree.tick(ctx);
        let openNodes: Yendor.AbstractNode[] = ctx.get("openNodes", tree.id);
        this.isTrue(openNodes !== undefined, "openNodes !== undefined");
        this.isTrue(openNodes.length === 1, "openNodes.length === 1");
        this.isTrue(openNodes[0] === node, "openNodes[0] === node");

        let nodeCount: number = ctx.get("nodeCount", tree.id);
        this.isTrue(nodeCount === 1);
    }

    public selectorNodeSuccess() {
        let tree: Yendor.BehaviorTree = new Yendor.BehaviorTree("test", new Yendor.SelectorNode());
        let ctx: Yendor.Context = new Yendor.Context();
        let node1: DummyNode;
        let node2: DummyNode;
        let node3: DummyNode;
        tree.root.addChild(node1 = new DummyNode(Yendor.TickResultEnum.FAILURE));
        tree.root.addChild(node2 = new DummyNode(Yendor.TickResultEnum.SUCCESS));
        tree.root.addChild(node3 = new DummyNode(Yendor.TickResultEnum.SUCCESS));
        DummyNode.clearGlobalLog();
        tree.tick(ctx);
        let log: string = "enter[%1]|open[%1]|tick[%1]|close[%1]|exit[%1]|"
            + "enter[%2]|open[%2]|tick[%2]|close[%2]|exit[%2]|";
        log = log.replace(/%1/g, "" + node1.id);
        log = log.replace(/%2/g, "" + node2.id);
        this.isTrue(DummyNode.globalLog === log, DummyNode.globalLog + "!==" + log);
    }

    public selectorNodeFailure() {
        let tree: Yendor.BehaviorTree = new Yendor.BehaviorTree("test", new Yendor.SelectorNode());
        let ctx: Yendor.Context = new Yendor.Context();
        let node1: DummyNode;
        let node2: DummyNode;
        let node3: DummyNode;
        tree.root.addChild(node1 = new DummyNode(Yendor.TickResultEnum.FAILURE));
        tree.root.addChild(node2 = new DummyNode(Yendor.TickResultEnum.FAILURE));
        tree.root.addChild(node3 = new DummyNode(Yendor.TickResultEnum.FAILURE));
        DummyNode.clearGlobalLog();
        tree.tick(ctx);
        let log: string = "enter[%1]|open[%1]|tick[%1]|close[%1]|exit[%1]|"
            + "enter[%2]|open[%2]|tick[%2]|close[%2]|exit[%2]|"
            + "enter[%3]|open[%3]|tick[%3]|close[%3]|exit[%3]|";
        log = log.replace(/%1/g, "" + node1.id);
        log = log.replace(/%2/g, "" + node2.id);
        log = log.replace(/%3/g, "" + node3.id);
        this.isTrue(DummyNode.globalLog === log, DummyNode.globalLog + "!==" + log);
    }

    public selectorNodeRunning() {
        let tree: Yendor.BehaviorTree = new Yendor.BehaviorTree("test", new Yendor.SelectorNode());
        let ctx: Yendor.Context = new Yendor.Context();
        let node1: DummyNode;
        let node2: DummyNode;
        let node3: DummyNode;
        tree.root.addChild(node1 = new DummyNode(Yendor.TickResultEnum.FAILURE));
        tree.root.addChild(node2 = new DummyNode(Yendor.TickResultEnum.RUNNING));
        tree.root.addChild(node3 = new DummyNode(Yendor.TickResultEnum.SUCCESS));
        DummyNode.clearGlobalLog();
        tree.tick(ctx);
        let log: string = "enter[%1]|open[%1]|tick[%1]|close[%1]|exit[%1]|"
            + "enter[%2]|open[%2]|tick[%2]|exit[%2]|";
        log = log.replace(/%1/g, "" + node1.id);
        log = log.replace(/%2/g, "" + node2.id);
        this.isTrue(DummyNode.globalLog === log, DummyNode.globalLog + "!==" + log);
    }

    public sequenceNodeSuccess() {
        let tree: Yendor.BehaviorTree = new Yendor.BehaviorTree("test", new Yendor.SequenceNode());
        let ctx: Yendor.Context = new Yendor.Context();
        let node1: DummyNode;
        let node2: DummyNode;
        let node3: DummyNode;
        tree.root.addChild(node1 = new DummyNode(Yendor.TickResultEnum.SUCCESS));
        tree.root.addChild(node2 = new DummyNode(Yendor.TickResultEnum.SUCCESS));
        tree.root.addChild(node3 = new DummyNode(Yendor.TickResultEnum.SUCCESS));
        DummyNode.clearGlobalLog();
        tree.tick(ctx);
        let log: string = "enter[%1]|open[%1]|tick[%1]|close[%1]|exit[%1]|"
            + "enter[%2]|open[%2]|tick[%2]|close[%2]|exit[%2]|"
            + "enter[%3]|open[%3]|tick[%3]|close[%3]|exit[%3]|";
        log = log.replace(/%1/g, "" + node1.id);
        log = log.replace(/%2/g, "" + node2.id);
        log = log.replace(/%3/g, "" + node3.id);
        this.isTrue(DummyNode.globalLog === log, DummyNode.globalLog + "!==" + log);
    }

    public sequenceNodeFailure() {
        let tree: Yendor.BehaviorTree = new Yendor.BehaviorTree("test", new Yendor.SequenceNode());
        let ctx: Yendor.Context = new Yendor.Context();
        let node1: DummyNode;
        let node2: DummyNode;
        let node3: DummyNode;
        tree.root.addChild(node1 = new DummyNode(Yendor.TickResultEnum.SUCCESS));
        tree.root.addChild(node2 = new DummyNode(Yendor.TickResultEnum.FAILURE));
        tree.root.addChild(node3 = new DummyNode(Yendor.TickResultEnum.SUCCESS));
        DummyNode.clearGlobalLog();
        tree.tick(ctx);
        let log: string = "enter[%1]|open[%1]|tick[%1]|close[%1]|exit[%1]|"
            + "enter[%2]|open[%2]|tick[%2]|close[%2]|exit[%2]|";
        log = log.replace(/%1/g, "" + node1.id);
        log = log.replace(/%2/g, "" + node2.id);
        this.isTrue(DummyNode.globalLog === log, DummyNode.globalLog + "!==" + log);
    }

    public sequenceNodeRunning() {
        let tree: Yendor.BehaviorTree = new Yendor.BehaviorTree("test", new Yendor.SequenceNode());
        let ctx: Yendor.Context = new Yendor.Context();
        let node1: DummyNode;
        let node2: DummyNode;
        let node3: DummyNode;
        tree.root.addChild(node1 = new DummyNode(Yendor.TickResultEnum.SUCCESS));
        tree.root.addChild(node2 = new DummyNode(Yendor.TickResultEnum.RUNNING));
        tree.root.addChild(node3 = new DummyNode(Yendor.TickResultEnum.SUCCESS));
        DummyNode.clearGlobalLog();
        tree.tick(ctx);
        let log: string = "enter[%1]|open[%1]|tick[%1]|close[%1]|exit[%1]|"
            + "enter[%2]|open[%2]|tick[%2]|exit[%2]|";
        log = log.replace(/%1/g, "" + node1.id);
        log = log.replace(/%2/g, "" + node2.id);
        this.isTrue(DummyNode.globalLog === log, DummyNode.globalLog + "!==" + log);
    }

    public serialization() {

        let tree: Yendor.BehaviorTree = new Yendor.BehaviorTree("test", new Yendor.SequenceNode());
        tree.root.addChild(new DummyNode(Yendor.TickResultEnum.SUCCESS));
        tree.root.addChild(new DummyNode(Yendor.TickResultEnum.RUNNING));
        tree.root.addChild(new DummyNode(Yendor.TickResultEnum.SUCCESS));
        let treeJsonData: string | undefined = Yendor.JSONSerializer.object2Json(tree);
        console.log(treeJsonData);
        this.isTrue(treeJsonData !== undefined);
        let tree2: Yendor.BehaviorTree = Yendor.JSONSerializer.json2Object(treeJsonData!);

        this.isTrue(tree.id === tree2.id);
        this.isTrue(tree.root.id === tree2.root.id);
        this.isTrue(tree2.root.children.length === 3);
    }

    public simpleTreeDesc() {
        let desc = {
            className: "SequenceNode",
            children: [
                { className: "DummyNode", status: Yendor.TickResultEnum.SUCCESS },
                { className: "DummyNode", status: Yendor.TickResultEnum.RUNNING },
                { className: "DummyNode", status: Yendor.TickResultEnum.SUCCESS },
            ],
        };
        let tree: Yendor.BehaviorTree = new Yendor.BehaviorTree(
            "test", <Yendor.AbstractNode>Yendor.JSONSerializer.loadFromData(desc));
        this.isTrue(tree.root.children.length === 3);
    }
}
