/**
	Section: utilities
*/
import * as Core from "../core/main";
import * as Yendor from "../yendor/main";
import * as Umbra from "../umbra/main";
import * as wid from "./widget";
import * as con from "./configuration";

/**
    Function: hline
    Draw an horizontal line using <Yendor.CHAR_HLINE> character
*/
export function hline(console: Yendor.Console, x: number, y: number, w: number) {
    console.clearText(Yendor.CHAR_HLINE, x, y, w, 1);
}

/**
    Function: vline
    Draw a vertical line using <Yendor.CHAR_VLINE> character
*/
export function vline(console: Yendor.Console, x: number, y: number, h: number) {
    console.clearText(Yendor.CHAR_VLINE, x, y, 1, h);
}

/**
    Function: rectangle
    Draw a rectangle using special characters
*/
export function rectangle(console: Yendor.Console, x: number, y: number, w: number, h: number) {
    hline(console, x + 1, y, w - 2);
    hline(console, x + 1, y + h - 1, w - 2);
    vline(console, x, y + 1, h - 2);
    vline(console, x + w - 1, y + 1, h - 2);
    console.text[x][y] = Yendor.CHAR_NW;
    console.text[x + w - 1][y] = Yendor.CHAR_NE;
    console.text[x][y + h - 1] = Yendor.CHAR_SW;
    console.text[x + w - 1][y + h - 1] = Yendor.CHAR_SE;
}

/**
    Function: frame
    Draw a frame with an optional title
*/
export function frame(console: Yendor.Console, x: number, y: number, w: number, h: number, title?: string) {
    console.clearBack(con.getConfiguration().color.background, x, y, w, h);
    console.clearFore(con.getConfiguration().color.foregroundDisabled, x, y, w, h);
    console.clearText(32, x + 1, y + 1, w - 2, h - 2);
    rectangle(console, x, y, w, h);
    if (title) {
        let len = title.length;
        let xTitle = x + Math.floor((w - len) / 2);
        console.text[xTitle - 1][y] = Yendor.CHAR_TEEW;
        console.text[xTitle + len][y] = Yendor.CHAR_TEEE;
        console.print(xTitle, y, title, con.getConfiguration().color.titleForeground);
    }
}

export interface ButtonOption {
    /**
        Field: label
        text displayed on the button
    */
    label: string;
    /**
        Field: autoHide
        optional widget to hide when the button is clicked
    */
    autoHideWidget?: wid.Widget;
    /**
        Field: eventData
        optional data to send with the event when the button is clicked
    */
    eventData?: any;
    /**
        Field: eventType
        optional event type sent when this button is clicked
    */
    eventType?: string;
    /**
        Field: callback
        optional callback called when this button is clicked. The data parameter will have the eventData value.
    */
    callback?: (data: any) => void;
    /**
        Field: asciiShortcut
        optional ascii code to trigger the button action with a keypress
    */
    asciiShortcut?: number;
}

/**
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
export function button(console: Yendor.Console, x: number, y: number, options: ButtonOption): boolean {
    let w = options.label.length, h = 1;
    let rect: Core.Rect = new Core.Rect(x, y, w, h);
    let active: boolean = rect.contains(Umbra.getMouseCellPosition());
    let pressed: boolean = active && Umbra.wasMouseButtonReleased(Umbra.MouseButton.LEFT);
    console.clearBack(active ? con.getConfiguration().color.backgroundActive : con.getConfiguration().color.background, x, y, w, h);
    console.clearText(32, x, y, w, h);
    console.print(x, y, options.label, active ? con.getConfiguration().color.foregroundActive : con.getConfiguration().color.foreground);
    if (pressed || (options.asciiShortcut && Umbra.wasCharPressed(options.asciiShortcut))) {
        Umbra.resetInput();
        if (options.autoHideWidget) {
            options.autoHideWidget.hide();
        }
        if (options.eventType) {
            Umbra.EventManager.publishEvent(options.eventType, options ? options.eventData : undefined);
        }
        if (options.callback) {
            options.callback(options.eventData);
        }
        return true;
    }
    return false;
}

/**
    Function: popupMenu
    Display a popup menu with optional title and footer and a list of buttons. Pressing the cancel virtual button will hide the containing widget.

    Parameters :
    widget - the containing widget (optional)
    con - the console where to render the menu
    items - array of <ButtonOption>
    title - optional title displayed on the top of the frame
    footer - optional footer displayed on the bottom of the frame

    Returns :
    the menu bounding box
*/
export function popupMenu(widget: wid.Widget, console: Yendor.Console, items: ButtonOption[], title?: string, footer?: string): Core.Rect {
    if (!title && (!items || items.length === 0)) {
        // nothing to render
        return undefined;
    }
    // compute popup size
    let w = title ? title.length + 4 : 0;
    for (let i: number = 0, len: number = items.length; i < len; ++i) {
        let labelLen = items[i].label ? items[i].label.length + 4 : 0;
        if (labelLen > w) {
            w = labelLen;
        }
    }
    let h = items ? 2 + items.length : 2;
    // compute popup position
    let x: number = 0;
    let y: number = 0;
    if ( widget && widget.getBoundingBox() ) {
        x = widget.getBoundingBox().w ? Math.floor((widget.getBoundingBox().w - w) / 2) : widget.getBoundingBox().x;
        y = widget.getBoundingBox().h ? Math.floor((widget.getBoundingBox().h - h) / 2) : widget.getBoundingBox().y;
    }  else {
        x = Math.floor((Umbra.application.getConsole().width - w) / 2);
        y = Math.floor((Umbra.application.getConsole().height - h) / 2);
    }
    let boundingBox: Core.Rect = new Core.Rect(x, y, w, h);
    // render popup
    frame(console, x, y, w, h, title);
    if (footer) {
        console.print(Math.floor(x + (w - footer.length) / 2), y + h - 1, footer);
    }
    if (items) {
        for (let j: number = 0, len: number = items.length; j < len; ++j) {
            button(console, x + 2, y + 1 + j, items[j]);
        }
    }
    if (widget && Umbra.wasButtonPressed(con.getConfiguration().input.cancelAxisName)) {
        widget.hide();
        Umbra.resetInput();
    }
    return boundingBox;
}
