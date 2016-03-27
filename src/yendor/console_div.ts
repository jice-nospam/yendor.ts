/// <reference path="../yendor/yendor.ts" />

/**
	Section: DivConsole
*/
module Yendor {
    "use strict";

	/**
		Class: DivConsole
		A console that can be rendered as divs (one per row) filled with spans.
	*/
    export class DivConsole extends Console {
        private divSelector: string;
        private div: HTMLElement;

		/**
			Property: charWidth
			A character's width in pixels.
		*/
        private charWidth: number;

		/**
			Property: charHeight
			A character's height in pixels.
		*/
        private charHeight: number;

		/**
			Constructor: constructor

			Parameters:
			width - number of columns
			height - number of rows
			foreground - default foreground color
			background - default background color
			divSelector - JQuery selector for the element where to render this console
		*/
        constructor(_width: number, _height: number,
            foreground: Core.Color, background: Core.Color, divSelector: string) {
            super(_width, _height, foreground, background);
            this.divSelector = divSelector;
            this.div = $(divSelector)[0];
            this.div.style.fontFamily = "monospace";
            this.div.style.whiteSpace = "pre";
            this.div.style.display = "table";
            this.computeCharSize();
        }

		/**
			Function: computeCharSize
			Compute the size of a character in pixels. This is needed to convert mouse coordinates from pixels to console position.
		*/
        private computeCharSize() {
            // insert a single (invisible) character in the console
            this.text[0][0] = "@".charCodeAt(0);
            this.fore[0][0] = 0x000000;
            this.render();
            // get the resulting span size
            let oldId = this.div.id;
            this.div.id = "__yendor_div";
            let span: JQuery = $("#__yendor_div div.line span");
            this.charWidth = span.width();
            this.charHeight = span.height();
            console.log("Char size : " + this.charWidth + " x " + this.charHeight);
            // restore the console
            this.div.id = oldId;
            this.text[0][0] = 0;
            this.fore[0][0] = this.fore[0][1];
            this.render();
        }

		/**
			Function: render
			Update the content of the HTML element
		*/
        render() {
            this.div.innerHTML = this.getHTML();
        }

		/**
			Function: getPositionFromPixels
			Returns the column and row corresponding to a mouse position in the page.

			Parameters:
			x - the mouse x coordinate in pixels relative to the document
			y - the mouse y coordinate in pixels relative to the document
            pos - if not undefined, when function exits, contains the mouse cell position

			Returns:
			The <Core.Position> in the console.
		*/
        getPositionFromPixels(x: number, y: number, pos: Core.Position): Core.Position {
            let ret = pos ? pos : new Core.Position();
            let dx: number = x - $(this.divSelector).offset().left;
            let dy: number = y - $(this.divSelector).offset().top;
            ret.x = Math.floor(dx / this.charWidth);
            ret.y = Math.floor(dy / this.charHeight);
            return ret;
        }


		/**
			Function: getHTML

			Returns:
			A HTML representation of the console
		*/
        getHTML(): string {
            let s = "";
            for (let i = 0; i < this.height; i++) {
                s += "<div class='line'>" + this.getLineHTML(i) + "</div>";
            }
            return s;
        }

        private getChar(x: number, y: number) {
            let ascii = this.text[x][y];
            if (ascii === 0) {
                return " ";
            }
            return String.fromCharCode(ascii);
        }

        private getLineHTML(line: number): string {
            let currentFore = Core.ColorUtils.toWeb(this.fore[0][line]);
            let currentBack = Core.ColorUtils.toWeb(this.back[0][line]);
            let s = "<span style='color:" + currentFore + ";background-color:" + currentBack + "'>" + this.getChar(0, line);
            for (let i = 1; i < this.width; i++) {
                let nextFore = Core.ColorUtils.toWeb(this.fore[i][line]);
                let nextBack = Core.ColorUtils.toWeb(this.back[i][line]);
                if (nextFore !== currentFore || nextBack !== currentBack) {
                    currentFore = nextFore;
                    currentBack = nextBack;
                    s += "</span><span style='color:" + currentFore + ";background-color:" + currentBack + "'>";
                }
                s += this.getChar(i, line);
            }
            s += "</span>";
            return s;
        }
    }
}
