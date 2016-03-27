/**
	Section: GUI
*/
module Game {
    "use strict";

	/********************************************************************************
	 * Group: main menu
	 ********************************************************************************/
    export class MainMenu extends Gizmo.Widget {
        constructor() {
            super();
            this.showOnEventType(EventType[EventType.OPEN_MAIN_MENU]);
            this.hide();
        }
        onRender(con: Yendor.Console) {
            Gizmo.popupMenu(this, con, 
                [{ label: " Resume game ", eventType: EventType[EventType.RESUME_GAME], autoHideWidget: this },
                    { label: "   New game  ", eventType: EventType[EventType.NEW_GAME], autoHideWidget: this }]);
        }
        onUpdate(time: number): void {
        }
    }
}
