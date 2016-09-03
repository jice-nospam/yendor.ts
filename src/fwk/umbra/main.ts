/// <reference path="../../decl/jquery.d.ts" />
/**
	Section: umbra.ts
*/

export * from "./constants";
export * from "./node";
export * from "./scene";
export * from "./application";
export * from "./input_virtual";
export * from "./input";
export * from "./events";
export * from "./log";

import * as Yendor from "../yendor/main";
import * as app from "./application";
import * as inp from "./input";
import {EventType, EventManager} from "./events";
import {AbstractLogger, EventLogger, JSConsoleLogger} from "./log";

/**
    Field: application
    The currently running application. Set by Application.run. Needed to compute mouse coordinate in console cells coordinates.
*/
export let application: app.Application;
export let logger: AbstractLogger = new EventLogger();

export function init(appli: app.Application) {
    Yendor.init();
    EventManager.registerEventListener(new JSConsoleLogger(), EventType[EventType.LOG]);
    application = appli;
    if ( appli ) {
        $(document).keydown(inp.onKeydown);
        $(document).keypress(inp.onKeypress);
        $(document).keyup(inp.onKeyup);
        $(document).mousemove((event) => inp.onMouseMove(event, application.getConsole()));
        $(document).mousedown(inp.onMouseDown);
        $(document).mouseup(inp.onMouseUp);
    }
}
