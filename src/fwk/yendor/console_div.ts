/**
 * Section: DivConsole
 */
import * as $ from "jquery";
import * as Core from "../core/main";
import {IConsoleRenderer, Console} from "./console";
/**
 * Class: DivConsole
 * A console that can be rendered as divs (one per row) filled with spans.
 */
export class DivConsoleRenderer implements IConsoleRenderer {
    private divSelector: string;
    private div: HTMLElement;

    /**
     * Property: charWidth
     * A character's width in pixels.
     */
    private charWidth: number;

    /**
     * Property: charHeight
     * A character's height in pixels.
     */
    private charHeight: number;

    /**
     * Constructor: constructor
     * Parameters:
     * width - number of columns
     * height - number of rows
     * foreground - default foreground color
     * background - default background color
     * divSelector - JQuery selector for the element where to render this console
     */
    constructor( divSelector: string) {
        this.divSelector = divSelector;
        this.div = $(divSelector)[0];
        this.div.style.fontFamily = "monospace";
        this.div.style.whiteSpace = "pre";
        this.div.style.display = "table";
    }

    public init(con: Console) {
        this.computeCharSize(con);
    }

    /**
     * Function: render
     * Update the content of the HTML element
     */
    public render(con: Console) {
        this.div.innerHTML = this.getHTML(con);
    }

    public getPositionFromPixels(x: number, y: number, pos?: Core.Position): Core.Position {
        let ret = pos ? pos : new Core.Position();
        let offset: JQueryCoordinates = $(this.divSelector).offset();
        let dx: number = x - offset.left;
        let dy: number = y - offset.top;
        ret.x = Math.floor(dx / this.charWidth);
        ret.y = Math.floor(dy / this.charHeight);
        return ret;
    }

    public getPixelPositionFromCell(x: number, y: number, pos?: Core.Position): Core.Position {
        let ret = pos ? pos : new Core.Position();
        let offset: JQueryCoordinates = $(this.divSelector).offset();
        ret.x = x * this.charWidth + offset.left;
        ret.y = y * this.charHeight + offset.top;
        return ret;
    }

    /**
     * Function: getHTML
     * Returns:
     * A HTML representation of the console
     */
    public getHTML(con: Console): string {
        let s = "";
        for (let i = 0; i < con.height; i++) {
            s += "<div class='line'>" + this.getLineHTML(i, con) + "</div>";
        }
        return s;
    }

    /**
     * Function: computeCharSize
     * Compute the size of a character in pixels.
     * This is needed to convert mouse coordinates from pixels to console position.
     */
    private computeCharSize(con: Console) {
        // insert a single (invisible) character in the console
        con.text[0][0] = "@".charCodeAt(0);
        con.fore[0][0] = 0x000000;
        con.render();
        // get the resulting span size
        let oldId = this.div.id;
        this.div.id = "__yendor_div";
        let span: JQuery = $("#__yendor_div div.line span");
        this.charWidth = span.width();
        this.charHeight = span.height();
        console.log("Char size : " + this.charWidth + " x " + this.charHeight);
        // restore the console
        this.div.id = oldId;
        con.text[0][0] = 0;
        con.fore[0][0] = con.fore[0][1];
        con.render();
    }

    private getChar(x: number, y: number, con: Console) {
        let ascii = con.text[x][y];
        if (ascii === 0) {
            return " ";
        }
        return String.fromCharCode(ascii);
    }

    private getLineHTML(line: number, con: Console): string {
        let currentFore = Core.ColorUtils.toWeb(con.fore[0][line]);
        let currentBack = Core.ColorUtils.toWeb(con.back[0][line]);
        let s = "<span style='color:" + currentFore + ";background-color:"
            + currentBack + "'>" + this.getChar(0, line, con);
        for (let i = 1; i < con.width; i++) {
            let nextFore = Core.ColorUtils.toWeb(con.fore[i][line]);
            let nextBack = Core.ColorUtils.toWeb(con.back[i][line]);
            if (nextFore !== currentFore || nextBack !== currentBack) {
                currentFore = nextFore;
                currentBack = nextBack;
                s += "</span><span style='color:" + currentFore + ";background-color:" + currentBack + "'>";
            }
            s += this.getChar(i, line, con);
        }
        s += "</span>";
        return s;
    }
}
