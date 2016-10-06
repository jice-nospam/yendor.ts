import * as tsUnit from "../tsUnit";
import * as Core from "../../fwk/core/main";
import * as Umbra from "../../fwk/umbra/main";
import * as Gui from "../../fwk/gui/main";
/**
 * Class: GuiTests
 */
export class GuiTests extends tsUnit.TestClass {
    public nodeEmptyBox() {
        let gui: Gui.Widget = new Gui.Widget();
        gui.computeBoundingBox();

        this.__testBox(gui, new Core.Rect(0, 0, 0, 0), "gui box");
    }

    public childBox() {
        let gui: Gui.Widget = new Gui.Widget();
        let child: Gui.Widget = new Gui.Widget();
        child.resize(2, 3);
        gui.addChild(child);
        gui.computeBoundingBox();

        this.__testBox(gui, new Core.Rect(0, 0, 2, 3), "gui box");

        child.moveTo(2, 0);
        gui.computeBoundingBox();

        this.__testBox(gui, new Core.Rect(0, 0, 4, 3), "gui box");
    }

    public childrenBox() {
        let gui: Gui.Widget = new Gui.Widget();
        let child1: Gui.Widget = new Gui.Widget();
        let child2: Gui.Widget = new Gui.Widget();
        child1.resize(2, 3);
        gui.addChild(child1);
        child2.resize(4, 5);
        gui.addChild(child2);
        gui.computeBoundingBox();

        this.__testBox(gui, new Core.Rect(0, 0, 4, 5), "gui box");

        child1.moveTo(5, 0);
        gui.computeBoundingBox();

        this.__testBox(gui, new Core.Rect(0, 0, 7, 5), "gui2 box");
    }

    public centering() {
        let gui: Gui.Widget = new Gui.Widget();
        let child: Gui.Widget = new Gui.Widget();
        gui.addChild(child);
        gui.computeBoundingBox();
        child.resize(2, 4);
        gui.resize(6, 10);
        child.center();

        this.isTrue(new Core.Position(2, 3).equals(child.getBoundingBox()),
            "pos " + child.getBoundingBox().toString() + " instead of 2,3");

        child.center();
        child.center();
        child.center();

        this.isTrue(new Core.Position(2, 3).equals(child.getBoundingBox()),
            "pos " + child.getBoundingBox().toString() + " instead of 2,3");
    }

    public expanding() {
        let gui: Gui.Widget = new Gui.Widget();
        let child: Gui.Widget = new Gui.Widget();
        child.resize(2, 3);
        gui.resize(10, 10);
        gui.addChild(child);
        gui.expand(10, 10);

        this.__testBox(child, new Core.Rect(0, 0, 2, 3), "child box");

        child.setExpandFlag(Umbra.ExpandEnum.HORIZONTAL);
        gui.expand(10, 10);

        this.__testBox(child, new Core.Rect(0, 0, 10, 3), "exp child box");

        child.setExpandFlag(Umbra.ExpandEnum.BOTH);
        gui.expand(10, 10);

        this.__testBox(child, new Core.Rect(0, 0, 10, 10), "exp2 child box");
    }

    public expansionPropagation() {
        let gui: Gui.Widget = new Gui.Widget();
        let child: Gui.Widget = new Gui.Widget();
        let subChild: Gui.Widget = new Gui.Widget();
        child.addChild(subChild);
        gui.addChild(child);
        subChild.resize(1, 1);
        child.resize(2, 3);
        gui.resize(10, 10);
        gui.expand(10, 10);

        this.__testBox(subChild, new Core.Rect(0, 0, 1, 1), "subChild box");

        subChild.setExpandFlag(Umbra.ExpandEnum.VERTICAL);
        gui.expand(10, 10);

        this.__testBox(subChild, new Core.Rect(0, 0, 1, 3), "exp subChild box");
    }

    public vPanel() {
        let vpan: Gui.VPanel = new Gui.VPanel({});
        let child1: Gui.Widget = new Gui.Widget();
        child1.resize(5, 1);
        let child2: Gui.Widget = new Gui.Widget();
        child2.resize(7, 1);
        vpan.addChild(child1);
        vpan.addChild(child2);
        vpan.computeBoundingBox();

        this.isTrue(new Core.Position(0, 0).equals(child1.getBoundingBox()), "child1 pos : "
            + child1.getBoundingBox().toString());
        this.isTrue(new Core.Position(0, 1).equals(child2.getBoundingBox()), "child2 pos : "
            + child2.getBoundingBox().toString());
        this.__testBox(vpan, new Core.Rect(0, 0, 7, 2), "vpan box pos");

        vpan.getOptions().wPadding = 1;
        vpan.clearChildren();
        vpan.addChild(child1);
        vpan.addChild(child2);
        vpan.computeBoundingBox();

        this.isTrue(new Core.Position(1, 0).equals(child1.getBoundingBox()), "wpad child1 pos");
        this.isTrue(new Core.Position(1, 1).equals(child2.getBoundingBox()), "wpad child2 pos");
        this.__testBox(vpan, new Core.Rect(0, 0, 9, 2), "wpad vpan box");

        vpan.getOptions().hPadding = 2;
        vpan.clearChildren();
        vpan.addChild(child1);
        vpan.addChild(child2);
        vpan.computeBoundingBox();

        this.isTrue(new Core.Position(1, 2).equals(child1.getBoundingBox()), "hpad child1 pos");
        this.isTrue(new Core.Position(1, 3).equals(child2.getBoundingBox()), "hpad child2 pos");
        this.__testBox(vpan, new Core.Rect(0, 0, 9, 6), "hpad vpan box");
    }

    public hPanel() {
        let hpan: Gui.HPanel = new Gui.HPanel({});
        let child1: Gui.Widget = new Gui.Widget();
        child1.resize(1, 5);
        let child2: Gui.Widget = new Gui.Widget();
        child2.resize(1, 7);
        hpan.addChild(child1);
        hpan.addChild(child2);
        hpan.computeBoundingBox();

        this.isTrue(new Core.Position(0, 0).equals(child1.getBoundingBox()), "child1 pos : "
            + child1.getBoundingBox().toString());
        this.isTrue(new Core.Position(1, 0).equals(child2.getBoundingBox()), "child2 pos : "
            + child2.getBoundingBox().toString());
        this.__testBox(hpan, new Core.Rect(0, 0, 2, 7), "hpan box pos");

        hpan.getOptions().hPadding = 1;
        hpan.clearChildren();
        hpan.addChild(child1);
        hpan.addChild(child2);
        hpan.computeBoundingBox();

        this.isTrue(new Core.Position(0, 1).equals(child1.getBoundingBox()), "hpad child1 pos");
        this.isTrue(new Core.Position(1, 1).equals(child2.getBoundingBox()), "hpad child2 pos");
        this.__testBox(hpan, new Core.Rect(0, 0, 2, 9), "hpad hpan box");

        hpan.getOptions().wPadding = 2;
        hpan.clearChildren();
        hpan.addChild(child1);
        hpan.addChild(child2);
        hpan.computeBoundingBox();

        this.isTrue(new Core.Position(2, 1).equals(child1.getBoundingBox()), "hpad child1 pos");
        this.isTrue(new Core.Position(3, 1).equals(child2.getBoundingBox()), "hpad child2 pos");
        this.__testBox(hpan, new Core.Rect(0, 0, 6, 9), "hpad hpan box");
    }

    public buttons() {
        let but: Gui.Button = new Gui.Button({label: "12345"});
        but.computeBoundingBox();

        this.__testBox(but, new Core.Rect(0, 0, 5, 1), "but box");

        let vpan: Gui.VPanel = new Gui.VPanel({});
        vpan.addChild(but);
        let but2: Gui.Button = new Gui.Button({label: "1234567"});
        vpan.addChild(but2);
        vpan.computeBoundingBox();

        this.__testBox(vpan, new Core.Rect(0, 0, 7, 2), "vpan box");

        vpan.expand(10, 0);

        this.__testBox(vpan, new Core.Rect(0, 0, 10, 2), "exp vpan box");
        this.__testBox(but, new Core.Rect(0, 0, 10, 1), "exp but box");
        this.__testBox(but2, new Core.Rect(0, 1, 10, 1), "exp but2 box");

        let frame: Gui.Frame = new Gui.Frame({title: "12345678901234567890"});
        frame.addChild(vpan);
        frame.computeBoundingBox();
        frame.expand(0, 0);

        this.__testBox(frame, new Core.Rect(0, 0, 24, 4), "frame box");
        this.__testBox(vpan, new Core.Rect(1, 1, 22, 2), "frame vpan box");
        this.__testBox(but, new Core.Rect(0, 0, 22, 1), "frame but box");
        this.__testBox(but2, new Core.Rect(0, 1, 22, 1), "frame but2 box");
    }

    public immButtons() {
        let frame: Gui.Frame = new Gui.Frame({title: "12345678901234567890"});
        let vpan: Gui.VPanel = frame.addChild(new Gui.VPanel({}));
        let but: Gui.Button = vpan.addChild(new Gui.Button({label: "12345"}));
        let but2: Gui.Button = vpan.addChild(new Gui.Button({label: "1234567"}));
        frame.computeBoundingBox();
        frame.expand(0, 0);

        this.__testBox(frame, new Core.Rect(0, 0, 24, 4), "frame box");
        this.__testBox(vpan, new Core.Rect(1, 1, 22, 2), "frame vpan box");
        this.__testBox(but, new Core.Rect(0, 0, 22, 1), "frame but box");
        this.__testBox(but2, new Core.Rect(0, 1, 22, 1), "frame but2 box");
    }

    public expandh() {
        let vpan: Gui.VPanel = new Gui.VPanel({});
        vpan.expand(10, 10);

        this.__testBox(vpan, new Core.Rect(0, 0, 10, 0), "expandh");
    }

    public expandboth() {
        let drag: Gui.Draggable = new Gui.Draggable({});
        drag.expand(10, 20);

        this.__testBox(drag, new Core.Rect(0, 0, 10, 20), "expandboth");
    }

    private __testBox(w: Gui.Widget, b: Core.Rect, msg: string) {
        this.isTrue(w.getBoundingBox().equals(b), msg + " " + w.getBoundingBox().toString());
    }
}
