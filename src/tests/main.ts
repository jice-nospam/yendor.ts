/// <reference path="../decl/jquery.d.ts" />
/// <reference path="tsUnit.ts" />
/// <reference path="../yendor/yendor.ts" />
/// <reference path="../umbra/umbra.ts" />
/// <reference path="../gizmo/gizmo.ts" />
/// <reference path="../game/custom_events.ts" />
/// <reference path="../game/base.ts" />
/// <reference path="../game/actor_def.ts" />
/// <reference path="../game/actor_factory.ts" />
/// <reference path="../game/actor.ts" />
/// <reference path="../game/actor_manager.ts" />
/// <reference path="../game/actor_condition.ts" />
/// <reference path="../game/actor_effect.ts" />
/// <reference path="../game/actor_light.ts" />
/// <reference path="../game/actor_item.ts" />
/// <reference path="../game/actor_creature.ts" />
/// <reference path="../game/map_topology.ts" />
/// <reference path="../game/map.ts" />
/// <reference path="../game/map_shading.ts" />
/// <reference path="../game/map_render.ts" />
/// <reference path="../game/map_build_dungeon.ts" />
/// <reference path="../game/map_build_dungeon_bsp.ts" />
/// <reference path="../game/gui.ts" />
/// <reference path="../game/gui_inventory.ts" />
/// <reference path="../game/gui_status.ts" />
/// <reference path="../game/gui_tilepicker.ts" />
/// <reference path="../game/engine.ts" />
/// <reference path="yendor/bsp.ts" />
/// <reference path="yendor/console.ts" />
/// <reference path="yendor/fov.ts" />
/// <reference path="yendor/noise.ts" />
/// <reference path="yendor/path.ts" />
/// <reference path="yendor/rng.ts" />
/// <reference path="gameplay.ts" />

module Tests {
	"use strict";
	export class MainTests extends tsUnit.TestClass {
		crc32() {
			this.areIdentical(2240272485, Core.crc32("abcde"));
		}
	}
}

$(function() {
	// new instance of tsUnit
	let test = new tsUnit.Test();

	test.addTestClass(new Tests.MainTests(), "main");
	test.addTestClass(new Tests.RngTests(), "rng");
	test.addTestClass(new Tests.BspTests(), "bsp");
	test.addTestClass(new Tests.FovTests(), "fov");
    test.addTestClass(new Tests.NoiseTests(), "noise");
	test.addTestClass(new Tests.ConsoleTests(), "console");
	test.addTestClass(new Tests.PathTests(), "path");
	test.addTestClass(new Tests.GameplayTests(), "gameplay");

	// Use the built in results display
	test.showResults($("#console")[0], test.run());
});
