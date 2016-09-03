/**
	Section: gui
*/
export * from "./widget";
export * from "./commands";
export * from "./events";
export * from "./configuration";

import * as Umbra from "../umbra/main";
import * as Widget from "./widget";

export function initFrame() {
    if ( Umbra.wasMouseMoved()) {
        Widget.Widget.setFocus( undefined );
    }
}
