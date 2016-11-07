import * as $ from "jquery";
import * as tsUnit from "./tsUnit";
import * as Yendor from "../fwk/yendor/main";
import { RngTests } from "./yendor/rng";
import { BspTests } from "./yendor/bsp";
import { FovTests } from "./yendor/fov";
import { NoiseTests } from "./yendor/noise";
import { ColorTests } from "./core/color";
import { PathTests } from "./yendor/path";
import { BehaviorTests } from "./yendor/behavior";
import { GameplayTests } from "./generogue/gameplay";
import { GuiTests } from "./generogue/gui";
import { CoreTests } from "./core/main";
import { NodeTests } from "./umbra/node";
import { PersistenceTests } from "./core/persistence";

if (Yendor.isBrowser()) {
    $(function () {
        runTests(true);
    });
} else {
    runTests(false);
}

function runTests(browser: boolean) {
    Yendor.init();
    // new instance of tsUnit
    let test = new tsUnit.Test();

    // core tests
    test.addTestClass(new CoreTests(), "core", CoreTests);
    test.addTestClass(new ColorTests(), "core/color", ColorTests);
    if (browser) {
        // local storage and indexed db not available in node.js
        test.addTestClass(new PersistenceTests(), "core/persistence", PersistenceTests);
    }

    // yendor tests
    test.addTestClass(new RngTests(), "yendor/rng", RngTests);
    test.addTestClass(new BspTests(), "yendor/bsp", BspTests);
    test.addTestClass(new FovTests(), "yendor/fov", FovTests);
    test.addTestClass(new NoiseTests(), "yendor/noise", NoiseTests);
    test.addTestClass(new PathTests(), "yendor/path", PathTests);
    test.addTestClass(new BehaviorTests(), "yendor/behavior", BehaviorTests);

    // umbra tests
    test.addTestClass(new NodeTests(), "umbra/node", NodeTests);

    // generogue tests
    test.addTestClass(new GameplayTests(), "generogue/gameplay", GameplayTests);
    test.addTestClass(new GuiTests(), "generogue/gui", GuiTests);

    // Use the built in results display
    if (browser) {
        test.showResultsBrowser($("#console")[0], test.run());
    } else {
        test.showResultsNode(test.run());
    }
}
