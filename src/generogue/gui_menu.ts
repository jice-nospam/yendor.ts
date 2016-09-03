/**
	Section: GUI
*/
import * as Core from "../fwk/core/main";
import * as Yendor from "../fwk/yendor/main";
import * as Gui from "../fwk/gui/main";
import {EventType} from "./custom_events"; // TODO
import {Constants} from "./base";

/********************************************************************************
 * Group: main menu
 ********************************************************************************/
export class MainMenu extends Gui.Widget {
    constructor() {
        super();
        this.showOnEventType(Constants.EVENT_OPEN_MAIN_MENU);
        this.hide();
    }
    onRender(con: Yendor.Console) {
        Gui.popupMenu(this, con,
            [{ label: " Resume game ", autoHideWidget: this },
                { label: "   New game  ", eventType: EventType[EventType.NEW_GAME], autoHideWidget: this }]);
    }
    onUpdate(time: number): void {
    }
}


