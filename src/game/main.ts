/// <reference path="../yendor/yendor.ts" />
/// <reference path="../umbra/umbra.ts" />
/// <reference path="../gizmo/gizmo.ts" />
/// <reference path="base.ts" />
/// <reference path="custom_events.ts" />
/// <reference path="actor_def.ts" />
/// <reference path="actor_factory.ts" />
/// <reference path="actor.ts" />
/// <reference path="actor_manager.ts" />
/// <reference path="actor_condition.ts" />
/// <reference path="actor_effect.ts" />
/// <reference path="actor_item.ts" />
/// <reference path="actor_light.ts" />
/// <reference path="actor_creature.ts" />
/// <reference path="map_topology.ts" />
/// <reference path="map_build_dungeon.ts" />
/// <reference path="map_build_dungeon_bsp.ts" />
/// <reference path="map.ts" />
/// <reference path="map_shading.ts" />
/// <reference path="map_render.ts" />
/// <reference path="gui.ts" />
/// <reference path="gui_inventory.ts" />
/// <reference path="gui_status.ts" />
/// <reference path="gui_tilepicker.ts" />
/// <reference path="engine.ts" />
module Game {
    "use strict";
	/**
		This function is called when the document has finished loading in the browser.
		It creates the root console, register the keyboard and mouse event callbacks, and starts the frame rendering loop.
	*/
    $(function() {
        try {
            Umbra.init();
            let engine = new Engine();
            let app: Umbra.Application = new Umbra.Application();
            app.run(engine, {consoleWidth: Constants.CONSOLE_WIDTH, consoleHeight: Constants.CONSOLE_HEIGHT});
        } catch (e) {
            console.log("ERROR in " + e.fileName + ":" + e.lineNumber + " : " + e.message);
            console.log(e.stack);
        }
    });
}
