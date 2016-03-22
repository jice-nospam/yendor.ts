/// <reference path="../decl/jquery.d.ts" />
/// <reference path="../core/core.ts" />
/// <reference path="../yendor/yendor.ts" />
/// <reference path="constants.ts" />
/// <reference path="node.ts" />
/// <reference path="scene.ts" />
/// <reference path="application.ts" />
/// <reference path="input_virtual.ts" />
/// <reference path="input.ts" />
/// <reference path="events.ts" />

/*
	Section: umbra.ts
*/
module Umbra {
    "use strict";
    /*
        Field: application
        The currently running application. Set by Application.run. Needed to compute mouse coordinate in console cells coordinates.
    */
    export var application: Application;

    export function init() {
        Yendor.init();
        $(document).keydown(Input.onKeydown);
        $(document).keypress(Input.onKeypress);
        $(document).keyup(Input.onKeyup);
        $(document).mousemove(Input.onMouseMove);
        $(document).mousedown(Input.onMouseDown);
        $(document).mouseup(Input.onMouseUp);
    }
}
