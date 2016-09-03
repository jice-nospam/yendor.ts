/// <reference path="../decl/jquery.d.ts" />

import * as tsUnit from "./tsUnit";
import {RngTests} from "./yendor/rng";
import {BspTests} from "./yendor/bsp";
import {FovTests} from "./yendor/fov";
import {NoiseTests} from "./yendor/noise";
import {ConsoleTests} from "./yendor/console";
import {PathTests} from "./yendor/path";
import {GameplayTests} from "./generogue/gameplay";
import {CoreTests} from "./core/main";
import {PersistenceTests} from "./core/persistence";

let isBrowser = new Function("try {return this===window;}catch(e){ return false;}");
if ( isBrowser() ) {
    $(function() {
        runTests(true);
    });
} else {
    runTests(false);
}

function runTests(isBrowser: boolean) {
    // new instance of tsUnit
    let test = new tsUnit.Test();

    // core tests
    test.addTestClass(new CoreTests(), "core", CoreTests);
    if (isBrowser) {
        // local storage and indexed db not available in node.js
        test.addTestClass(new PersistenceTests(), "core/persistence", PersistenceTests);
    }

    // yendor tests
    test.addTestClass(new RngTests(), "yendor/rng", RngTests);
    test.addTestClass(new BspTests(), "yendor/bsp", BspTests);
    test.addTestClass(new FovTests(), "yendor/fov", FovTests);
    test.addTestClass(new NoiseTests(), "yendor/noise", NoiseTests);
    test.addTestClass(new ConsoleTests(), "yendor/console", ConsoleTests);
    test.addTestClass(new PathTests(), "yendor/path", PathTests);

    // generogue tests
    test.addTestClass(new GameplayTests(), "generogue/gameplay", GameplayTests);

    // Use the built in results display
    if (isBrowser) {
        test.showResultsBrowser($("#console")[0], test.run());
    } else {
        test.showResultsNode(test.run());
    }
}
