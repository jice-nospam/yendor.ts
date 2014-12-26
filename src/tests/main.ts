/// <reference path="../decl/jquery.d.ts" />
/// <reference path="rng.ts" />
/// <reference path="bsp.ts" />
/// <reference path="fov.ts" />
/// <reference path="console.ts" />
/// <reference path="path.ts" />
$(function() {
	// new instance of tsUnit
	var test = new tsUnit.Test();

	// add your test class (you can call this multiple times)
	test.addTestClass(new Tests.RngTests(), "rng");
	test.addTestClass(new Tests.BspTests(), "bsp");
	test.addTestClass(new Tests.FovTests(), "fov");
	test.addTestClass(new Tests.ConsoleTests(), "console");
	test.addTestClass(new Tests.PathTests(), "path");

	// Use the built in results display
	test.showResults($("#console")[0], test.run());
});
