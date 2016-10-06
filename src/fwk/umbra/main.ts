/**
 * Section: umbra.ts
 */

export * from "./constants";
export * from "./node";
export * from "./scene";
export * from "./application";
export * from "./input_virtual";
export * from "./input";
export * from "./events";
export * from "./log";

import * as $ from "jquery";
import * as Yendor from "../yendor/main";
import {Application} from "./application";
import * as inp from "./input";
import {EventManager} from "./events";
import {EVENT_LOG} from "./constants";
import {AbstractLogger, EventLogger, JSConsoleLogger} from "./log";

/**
 * Field: application
 * The currently running application. Set by Application.run.
 * Needed to compute mouse coordinate in console cells coordinates.
 */
export let application: Application;
export let logger: AbstractLogger = new EventLogger();

export function init(appli: Application): Application {
    Yendor.init();
    EventManager.registerEventListener(new JSConsoleLogger(), EVENT_LOG);
    application = appli;
    if ( appli ) {
        $(document).keydown(inp.onKeydown);
        $(document).keypress(inp.onKeypress);
        $(document).keyup(inp.onKeyup);
        $(document).mousemove((event) => inp.onMouseMove(event, application.getConsole()));
        $(document).mousedown(inp.onMouseDown);
        $(document).mouseup(inp.onMouseUp);
    }
    return application;
}
