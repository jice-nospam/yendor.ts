/**
 * Section: basic drawing utilities for widgets
 */
import * as Yendor from "../yendor/main";
import * as Umbra from "../umbra/main";
import { getConfiguration } from "./configuration";

/**
 * Function: hline
 * Draw an horizontal line using <Yendor.CHAR_HLINE> character
 */
export function hline(con: Yendor.Console, x: number, y: number, w: number, fixBorders: boolean = false) {
    let maxh: number = Umbra.application.getConsole().height - 1;
    if (y < 0 || y > maxh) {
        return;
    }
    let maxw: number = Umbra.application.getConsole().width - 1;
    if (x + w > maxw) {
        w = maxw - x;
    }
    if (x < 0) {
        w += x;
        x = 0;
    }
    _hline(con, x, y, w, fixBorders);
}

export function _hline(con: Yendor.Console, x: number, y: number, w: number, fixBorders: boolean = false) {
    let maxw: number = Umbra.application.getConsole().width - 1;
    let maxh: number = Umbra.application.getConsole().height - 1;
    let top: boolean[] = [];
    let bottom: boolean[] = [];
    if (fixBorders) {
        for (let cx: number = x; cx < x + w; ++cx) {
            if (con.text[cx][y] === Yendor.CHAR_TEEN || con.text[cx][y] === Yendor.CHAR_CROSS
                || con.text[cx][y] === Yendor.CHAR_TEEE || con.text[cx][y] === Yendor.CHAR_TEEW
                || con.text[cx][y] === Yendor.CHAR_VLINE
                || (y > 0 && con.text[cx][y - 1] === Yendor.CHAR_VLINE)) {
                top[cx - x] = true;
            }
            if (con.text[cx][y] === Yendor.CHAR_TEES || con.text[cx][y] === Yendor.CHAR_CROSS
                || con.text[cx][y] === Yendor.CHAR_TEEE || con.text[cx][y] === Yendor.CHAR_TEEW
                || con.text[cx][y] === Yendor.CHAR_VLINE
                || (y < maxh && con.text[cx][y + 1] === Yendor.CHAR_VLINE)) {
                bottom[cx - x] = true;
            }
        }
    }
    for (let cx: number = x; cx < x + w; ++cx) {
        let idx: number = cx - x;
        if (fixBorders) {
            if (top[idx] && bottom[idx]) {
                con.text[cx][y] = Yendor.CHAR_CROSS;
            } else if (top[idx]) {
                con.text[cx][y] = Yendor.CHAR_TEEN;
            } else if (bottom[idx]) {
                con.text[cx][y] = Yendor.CHAR_TEES;
            } else {
                con.text[cx][y] = Yendor.CHAR_HLINE;
            }
        } else {
            con.text[cx][y] = Yendor.CHAR_HLINE;
        }
    }
    if (fixBorders) {
        if (x - 1 >= 0 && x - 1 <= maxw) {
            if (con.text[x - 1][y] === Yendor.CHAR_TEEW) {
                con.text[x - 1][y] = Yendor.CHAR_CROSS;
            } else if (con.text[x - 1][y] === Yendor.CHAR_VLINE) {
                con.text[x - 1][y] = Yendor.CHAR_TEEE;
            }
        }
        if (x + w >= 0 && x + w <= maxw) {
            if (con.text[x + w][y] === Yendor.CHAR_TEEE) {
                con.text[x + w][y] = Yendor.CHAR_CROSS;
            } else if (con.text[x + w][y] === Yendor.CHAR_VLINE) {
                con.text[x + w][y] = Yendor.CHAR_TEEW;
            }
        }
    }
}

/**
 * Function: vline
 * Draw a vertical line using <Yendor.CHAR_VLINE> character
 */
export function vline(con: Yendor.Console, x: number, y: number, h: number, fixBorders: boolean = false) {
    let maxw: number = Umbra.application.getConsole().width - 1;
    if (x < 0 || x > maxw) {
        return;
    }
    let maxh: number = Umbra.application.getConsole().height - 1;
    if (y + h > maxh) {
        h = maxh - y;
    }
    if (y < 0) {
        h += y;
        y = 0;
    }
    _vline(con, x, y, h, fixBorders);
}

export function _vline(con: Yendor.Console, x: number, y: number, h: number, fixBorders: boolean = false) {
    let maxw: number = Umbra.application.getConsole().width - 1;
    let maxh: number = Umbra.application.getConsole().height - 1;
    let left: boolean[] = [];
    let right: boolean[] = [];
    if (fixBorders) {
        for (let cy: number = y; cy < y + h; ++cy) {
            if (con.text[x][cy] === Yendor.CHAR_TEEW || con.text[x][cy] === Yendor.CHAR_CROSS
                || con.text[x][cy] === Yendor.CHAR_TEEN || con.text[x][cy] === Yendor.CHAR_TEES
                || con.text[x][cy] === Yendor.CHAR_HLINE
                || (x > 0 && con.text[x - 1][cy] === Yendor.CHAR_HLINE)) {
                left[cy - y] = true;
            }
            if (con.text[x][cy] === Yendor.CHAR_TEEE || con.text[x][cy] === Yendor.CHAR_CROSS
                || con.text[x][cy] === Yendor.CHAR_TEEN || con.text[x][cy] === Yendor.CHAR_TEES
                || con.text[x][cy] === Yendor.CHAR_HLINE
                || (x < maxw && con.text[x + 1][cy] === Yendor.CHAR_HLINE)) {
                right[cy - y] = true;
            }
        }
    }
    for (let cy: number = y; cy < y + h; ++cy) {
        let idx: number = cy - y;
        if (fixBorders) {
            if (left[idx] && right[idx]) {
                con.text[x][cy] = Yendor.CHAR_CROSS;
            } else if (left[idx]) {
                con.text[x][cy] = Yendor.CHAR_TEEW;
            } else if (right[idx]) {
                con.text[x][cy] = Yendor.CHAR_TEEE;
            } else {
                con.text[x][cy] = Yendor.CHAR_VLINE;
            }
        } else {
            con.text[x][cy] = Yendor.CHAR_VLINE;
        }
    }
    if (fixBorders) {
        if (y - 1 >= 0 && y - 1 <= maxh) {
            if (con.text[x][y - 1] === Yendor.CHAR_TEEN) {
                con.text[x][y - 1] = Yendor.CHAR_CROSS;
            } else if (con.text[x][y - 1] === Yendor.CHAR_HLINE) {
                con.text[x][y - 1] = Yendor.CHAR_TEES;
            }
        }
        if (y + h >= 0 && y + h <= maxh) {
            if (con.text[x][y + h] === Yendor.CHAR_TEES) {
                con.text[x][y + h] = Yendor.CHAR_CROSS;
            } else if (con.text[x][y + h] === Yendor.CHAR_HLINE) {
                con.text[x][y + h] = Yendor.CHAR_TEEN;
            }
        }
    }
}

export function checkPos(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < Umbra.application.getConsole().width && y < Umbra.application.getConsole().height;
}

/**
 * Function: rectangle
 * Draw a rectangle using special characters
 */
export function rectangle(con: Yendor.Console, x: number, y: number, w: number, h: number) {
    let maxw: number = Umbra.application.getConsole().width;
    let maxh: number = Umbra.application.getConsole().height;
    if (x + w <= 0 || x > maxw || y + h <= 0 || y > maxh) {
        return;
    }
    if (x + w > maxw) {
        w = maxw - x;
    }
    if (x < 0) {
        w += x;
        x = 0;
    }
    if (y + h > maxh) {
        h = maxh - y;
    }
    if (y < 0) {
        h += y;
        y = 0;
    }
    if (checkPos(x, y)) {
        con.text[x][y] = Yendor.CHAR_NW;
    }
    if (checkPos(x + w - 1, y)) {
        con.text[x + w - 1][y] = Yendor.CHAR_NE;
    }
    if (checkPos(x, y + h - 1)) {
        con.text[x][y + h - 1] = Yendor.CHAR_SW;
    }
    if (checkPos(x + w - 1, y + h - 1)) {
        con.text[x + w - 1][y + h - 1] = Yendor.CHAR_SE;
    }
    _hline(con, x + 1, y, w - 2);
    _hline(con, x + 1, y + h - 1, w - 2);
    _vline(con, x, y + 1, h - 2);
    _vline(con, x + w - 1, y + 1, h - 2);
}

/**
 * Function: frame
 * Draw a frame with an optional title
 */
export function frame(con: Yendor.Console, x: number, y: number, w: number, h: number, title?: string) {
    con.clearBack(getConfiguration().color.background, x, y, w, h);
    con.clearFore(getConfiguration().color.foregroundDisabled, x, y, w, h);
    con.clearText(32, x + 1, y + 1, w - 2, h - 2);
    rectangle(con, x, y, w, h);
    if (title) {
        let len = title.length;
        let xTitle = x + Math.floor((w - len) / 2);
        if (checkPos(xTitle - 1, y)) {
            con.text[xTitle - 1][y] = Yendor.CHAR_TEEW;
        }
        if (checkPos(xTitle + len, y)) {
            con.text[xTitle + len][y] = Yendor.CHAR_TEEE;
        }
        con.print(xTitle, y, title, getConfiguration().color.titleForeground);
    }
}
