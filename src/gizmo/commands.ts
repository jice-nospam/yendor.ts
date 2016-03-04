/*
	Section: utilities
*/
module Gizmo {
    "use strict";

    export function frame(con: Yendor.Console, x: number, y: number, w: number, h: number) {
        con.clearBack(getConfiguration().color.background, x, y, w, h);
        con.clearText(32, x, y, w, h);
    }

    export interface ButtonOption {
        /*
            Field: autoHide
            Whether the widget is hidden when the button is clicked
        */
        autoHide?: boolean,
        /*
            Field: eventData
            optional data to send with the event when the button is clicked
        */
        eventData?: any,
    }
    
    export function button(widget: Widget, con: Yendor.Console, x: number, y: number, eventType: string, label: string, options?: ButtonOption) {
        var w = label.length, h=1;
        var rect: Core.Rect = new Core.Rect(x, y, w, h);
        var active: boolean = rect.contains(Umbra.Input.getMouseCellPosition());
        var pressed: boolean = active && Umbra.Input.wasMouseButtonReleased(Umbra.MouseButton.LEFT);
        con.clearBack(active ? getConfiguration().color.backgroundActive : getConfiguration().color.background, x, y, w, h);
        con.clearText(32, x, y, w, h);
        if ( label ) {
            con.print(x, y, label, active ? getConfiguration().color.foregroundActive : getConfiguration().color.foreground);
        }
        if (pressed) {
            Umbra.EventManager.publishEvent(eventType, options ? options.eventData : undefined);
            if (options && options.autoHide) {
                widget.hide();
            }
        }
    }
}
