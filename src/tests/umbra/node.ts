import * as tsUnit from "../tsUnit";
import * as Core from "../../fwk/core/main";
import * as Umbra from "../../fwk/umbra/main";

export class NodeTests extends tsUnit.TestClass {
    private parent: Umbra.Node = new Umbra.Node();
    private child: Umbra.Node = new Umbra.Node(this.parent);
    private pos: Core.Position = new Core.Position(2, 3);
    private grandchild: Umbra.Node = new Umbra.Node(this.child);
    public abs2Local() {
        this.parent.moveTo(2, 3);
        this.child.abs2Local(this.pos);

        this.isTrue(this.pos.equals(new Core.Position(0, 0)), this.pos.toString());
    }

    public local2Abs() {
        this.child.local2Abs(this.pos);

        this.isTrue(this.pos.equals(new Core.Position(2, 3)), this.pos.toString());
    }

    public local2Abs2Levels() {
        this.grandchild.moveTo(1, 4);
        this.pos.x = this.pos.y = 0;
        this.grandchild.local2Abs(this.pos);

        this.isTrue(this.pos.equals(new Core.Position(3, 7)), this.pos.toString());
    }

    public abs2Local2Levels() {
        this.grandchild.abs2Local(this.pos);

        this.isTrue(this.pos.equals(new Core.Position(0, 0)), this.pos.toString());
    }
}
