/*
	Section: utilities
*/
module Gizmo {
    "use strict";

    /*
        Function: hline
        Draw an horizontal line using <Yendor.CHAR_HLINE> character
    */
    export function hline(con: Yendor.Console, x: number, y: number, w: number) {
        con.clearText(Yendor.CHAR_HLINE, x, y, w, 1);
    }

    /*
        Function: vline
        Draw a vertical line using <Yendor.CHAR_VLINE> character
    */
    export function vline(con: Yendor.Console, x: number, y: number, h: number) {
        con.clearText(Yendor.CHAR_VLINE, x, y, 1, h);
    }

    /*
        Function: rectangle
        Draw a rectangle using special characters
    */
    export function rectangle(con: Yendor.Console, x: number, y: number, w: number, h: number) {
        hline(con, x + 1, y, w - 2);
        hline(con, x + 1, y + h - 1, w - 2);
        vline(con, x, y + 1, h - 2);
        vline(con, x + w - 1, y + 1, h - 2);
        con.text[x][y] = Yendor.CHAR_NW;
        con.text[x + w - 1][y] = Yendor.CHAR_NE;
        con.text[x][y + h - 1] = Yendor.CHAR_SW;
        con.text[x + w - 1][y + h - 1] = Yendor.CHAR_SE;
    }

    /*
        Function: frame
        Draw a frame with an optional title
    */
    export function frame(con: Yendor.Console, x: number, y: number, w: number, h: number, title?: string) {
        con.clearBack(getConfiguration().color.background, x, y, w, h);
        con.clearFore(getConfiguration().color.foregroundDisabled, x, y, w, h);
        con.clearText(32, x + 1, y + 1, w - 2, h - 2);
        rectangle(con, x, y, w, h);
        if (title) {
            var len = title.length;
            var xTitle = x + Math.floor((w - len) / 2);
            con.text[xTitle - 1][y] = Yendor.CHAR_TEEW;
            con.text[xTitle + len][y] = Yendor.CHAR_TEEE;
            con.print(xTitle, y, title, getConfiguration().color.titleForeground);
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
            optional widget to hide when the button is clicked
        */
        autoHideWidget?: Widget,
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
            optional callback called when this button is clicked. The data parameter will have the eventData value.
        */
        callback?: (data: any) => void,
        /*
            Field: asciiShortcut
            optional ascii code to trigger the button action with a keypress
        */
        asciiShortcut?: number,
    }
    
    /*
        Function: button
        Renders a button in 'immediate' mode (see http://www.johno.se/book/imgui.html).
        
        Parameters:
        con - the console where to render
        x - the button horizontal coordinate
        y - the button vertical coordinate
        options - options controlling the button's behaviour (see <ButtonOption>)
        
        Returns:
        true if the button was activated, by keyboard shortcut or by mouse click
    */
    export function button(con: Yendor.Console, x: number, y: number, options: ButtonOption): boolean {
        var w = options.label.length, h = 1;
        var rect: Core.Rect = new Core.Rect(x, y, w, h);
        var active: boolean = rect.contains(Umbra.Input.getMouseCellPosition());
        var pressed: boolean = active && Umbra.Input.wasMouseButtonReleased(Umbra.MouseButton.LEFT);
        con.clearBack(active ? getConfiguration().color.backgroundActive : getConfiguration().color.background, x, y, w, h);
        con.clearText(32, x, y, w, h);
        con.print(x, y, options.label, active ? getConfiguration().color.foregroundActive : getConfiguration().color.foreground);
        if (pressed || (options.asciiShortcut && Umbra.Input.wasCharPressed(options.asciiShortcut))) {
            Umbra.Input.resetInput();
            if (options.eventType) {
                Umbra.EventManager.publishEvent(options.eventType, options ? options.eventData : undefined);
            }
            if (options.callback) {
                options.callback(options.eventData);
            }
            if (options.autoHideWidget) {
                options.autoHideWidget.hide();
            }
            return true;
        }
        return false;
    }
}
