/// <reference path="../decl/jquery.d.ts" />
/// <reference path="rng.ts" />
/// <reference path="bsp.ts" />
/// <reference path="fov.ts" />
/// <reference path="console.ts" />
/// <reference path="path.ts" />
/// <reference path="gameplay.ts" />

module Tests {
	"use strict";
	export class MainTests extends tsUnit.TestClass {
		crc32() {
			this.areIdentical(2240272485, Yendor.crc32("abcde"));
		}
	}
}

$(function() {
	// new instance of tsUnit
	var test = new tsUnit.Test();

	test.addTestClass(new Tests.MainTests(), "main");
	test.addTestClass(new Tests.RngTests(), "rng");
	test.addTestClass(new Tests.BspTests(), "bsp");
	test.addTestClass(new Tests.FovTests(), "fov");
	test.addTestClass(new Tests.ConsoleTests(), "console");
	test.addTestClass(new Tests.PathTests(), "path");
	test.addTestClass(new Tests.GameplayTests(), "gameplay");

	// Use the built in results display
	test.showResults($("#console")[0], test.run());
});
