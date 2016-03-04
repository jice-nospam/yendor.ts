/*
	Section: utilities
*/
module Gizmo {
    "use strict";

    export function frame(con: Yendor.Console, x: number, y: number, w: number, h: number, title?: string) {
        con.clearBack(getConfiguration().color.background, x, y, w, h);
        con.clearText(32, x, y, w, h);
        if ( title ) {
            var len = title.length;
            con.print(x + Math.floor((w-len)/2), y, title, getConfiguration().color.titleForeground);
        }
    }

    export interface ButtonOption {
        /*
            Field: label
            text displayed on the button
        */
        label: string,
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
        /*
            Field: eventType
            optional event type sent when this button is clicked
        */
        eventType?: string,
        /*
            Field: callback
            optional callback called when this button is clicked
        */
        callback?: (data: any) => void,
        /*
            Field: asciiShortcut
            optional ascii code to trigger the button action with a keypress
        */
        asciiShortcut?: number,
    }
    
    export function button(widget: Widget, con: Yendor.Console, x: number, y: number, options: ButtonOption) {
        var w = options.label.length, h=1;
        var rect: Core.Rect = new Core.Rect(x, y, w, h);
        var active: boolean = rect.contains(Umbra.Input.getMouseCellPosition());
        var pressed: boolean = active && Umbra.Input.wasMouseButtonReleased(Umbra.MouseButton.LEFT);
        con.clearBack(active ? getConfiguration().color.backgroundActive : getConfiguration().color.background, x, y, w, h);
        con.clearText(32, x, y, w, h);
        con.print(x, y, options.label, active ? getConfiguration().color.foregroundActive : getConfiguration().color.foreground);
        if (pressed || (options.asciiShortcut && Umbra.Input.wasCharPressed(options.asciiShortcut))) {
            Umbra.Input.resetInput();
            if ( options.eventType ) {
                Umbra.EventManager.publishEvent(options.eventType, options ? options.eventData : undefined);
            }
            if ( options.callback ) {
                options.callback(options.eventData);
            }
            if (options.autoHide) {
                widget.hide();
            }
        }
    }
}
