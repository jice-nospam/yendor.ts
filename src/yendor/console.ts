/*
	Section: Console
*/
module Yendor {
    "use strict";
    // URL params
    export const URL_PARAM_RENDERER: string = "renderer";
    export const URL_PARAM_RENDERER_PIXI_WEBGL: string = "pixi/webgl";
    export const URL_PARAM_RENDERER_PIXI_CANVAS: string = "pixi/canvas";
    export const URL_PARAM_RENDERER_DIV: string = "yendor/div";

	/*
		Class: Console
		An offscreen console that cannot be rendered on screen, but can be blit on other consoles.
	*/
    export class Console {
        private _width: number;
        private _height: number;
		/*
			Property: text
			Matrix of <number> storing the ascii code. The character at coordinate x,y is text[x][y].
		*/
        text: number[][];

		/*
			Property: fore
			Matrix of <Core.Color> storing the foreground color (characters color). The character color at coordinate x,y is fore[x][y].
		*/
        fore: Core.Color[][];

		/*
			Property: back
			Matrix of <Core.Color> storing the background color. The background color at coordinate x,y is back[x][y].
		*/
        back: Core.Color[][];

		/*
			Constructor: constructor

			Parameters:
			width - the number of columns
			height - the number of rows
			foreground - *optional* (default : white) default foreground color
			background - *optional* (default : black) default background color
		*/
        constructor(_width: number, _height: number,
            foreground: Core.Color = 0xFFFFFF, background: Core.Color = 0x000000) {
            this._width = _width;
            this._height = _height;
            this.text = this.newTable();
            this.fore = this.newTable();
            this.back = this.newTable();
            this.clearText();
            this.clearFore(foreground);
            this.clearBack(background);
        }

		/*
			Property: height
			The number of rows (read-only)
		*/
        get height(): number { return this._height; }

		/*
			Property: width
			The number of columns (read-only)
		*/
        get width(): number { return this._width; }

		/*
			Function: contains
			Check if a position is inside the console
		*/
        contains(pos: Core.Position): boolean {
            return pos.x >= 0 && pos.y >= 0 && pos.x < this._width && pos.y < this._height;
        }

		/*
			Function: render
			To be implemented by non offscreen consoles extending this class.
		*/
        render() {
            // empty
        }

		/*
			Function: getPositionFromPixels
			Returns the column and row corresponding to a mouse position in the page.

			Parameters:
			x - the mouse x coordinate in pixels relative to the document
			y - the mouse y coordinate in pixels relative to the document
            pos - if not undefined, when function exits, contains the mouse cell position

			Returns:
			The <Core.Position> in the console.
		*/
        getPositionFromPixels(x: number, y: number, pos: Core.Position): Core.Position { return undefined; }

		/*
			Function: print
			Print a string on the console. If the string starts before the first column (x < 0) or ends after the last rows, it"s truncated.

			Parameters:
			x - the column of the string"s first character
			y - the row
			text - the string to print
			color - *optional* (default white)
		*/
        print(x: number, y: number, text: string, color: Core.Color = 0xFFFFFF) {
            var begin = 0;
            var end = text.length;
            if (x + end > this.width) {
                end = this.width - x;
            }
            if (x < 0) {
                end += x;
                x = 0;
            }
            this.clearFore(color, x, y, end, 1);
            for (var i = begin; i < end; ++i) {
                this.text[i + x][y] = text.charCodeAt(i);
            }
        }

		/*
			Function: clearText
			Fill the text on the console (don't change foreground/background colors)

			Parameters:
			asciiCode - ascii code to use to fill
			x - *optional* (default 0) top left column
			y - *optional* (default 0) top left row
			width - *optional* the rectangle width
			height - *optional* the rectangle height			
		*/
        clearText(asciiCode: number = 0,
            x: number = 0, y: number = 0, width: number = -1, height: number = -1) {
            this.clearTable(this.text, asciiCode, x, y, width, height);
        }

		/*
			Function: clearFore
			Change all the foreground colors of a rectangular zone. If width and height are undefined, fills the area to the border of the console.
			Using
			> console.clearFore("red");
			fills the whole console foreground with red.

			Parameters:
			color - new foreground color
			x - *optional* (default 0) top left column
			y - *optional* (default 0) top left row
			width - *optional* the rectangle width
			height - *optional* the rectangle height
		*/
        clearFore(color: Core.Color,
            x: number = 0, y: number = 0, width: number = -1, height: number = -1) {
            this.clearTable(this.fore, color, x, y, width, height);
        }


		/*
			Function: clearBack
			Change all the background colors of a rectangular zone. If width and height are undefined, fills the area to the border of the console.
			Using
			> console.clearBack("red");
			fills the whole console background with red.

			Parameters:
			color - new background color
			x - *optional* (default 0) top left column
			y - *optional* (default 0) top left row
			width - *optional* the rectangle width
			height - *optional* the rectangle height
		*/
        clearBack(color: Core.Color,
            x: number = 0, y: number = 0, width: number = -1, height: number = -1) {
            this.clearTable(this.back, color, x, y, width, height);
        }

		/*
			Function: blit
			Copy a part of a console on another console.

			Parameters:
			console - the destination console
			x - *optional* (default 0) column where to blit on the destination console
			y - *optional* (default 0) row where to blit on the destination console
			xSrc - *optional* (default 0) top left column of the area to copy on the source console
			ySrc - *optional* (default 0) top left row of the area to copy on the source console
			srcWidth - *optional* width of the area to copy
			srcHeight - *optional* height of the area to copy
		*/
        blit(console: Console, x: number = 0, y: number = 0, xSrc: number = 0, ySrc: number = 0,
            srcWidth: number = -1, srcHeight: number = -1) {
            if (srcWidth === -1) {
                srcWidth = this.width;
            }
            if (srcHeight === -1) {
                srcHeight = this.height;
            }
            if (x + srcWidth > console.width) {
                srcWidth = console.width - x;
            }
            if (y + srcHeight > console.height) {
                srcHeight = console.height - y;
            }
            for (var desty = y; desty < y + srcHeight; ++desty) {
                for (var destx = x; destx < x + srcWidth; ++destx) {
                    var sourcex = xSrc + destx - x;
                    var sourcey = ySrc + desty - y;
                    console.text[destx][desty] = this.text[sourcex][sourcey];
                    console.back[destx][desty] = this.back[sourcex][sourcey];
                    console.fore[destx][desty] = this.fore[sourcex][sourcey];
                }
            }
        }

        private clearTable<T>(table: T[][], value: T,
            x: number = 0, y: number = 0, width: number = -1, height: number = -1) {
            if (width === -1) {
                width = this.width - x;
            }
            if (height === -1) {
                height = this.height - y;
            }
            for (var cy = y; cy < y + height; ++cy) {
                for (var cx = x; cx < x + width; ++cx) {
                    table[cx][cy] = value;
                }
            }
        }

        private newTable(): any[][] {
            var table = [];
            for (var i = 0; i < this.width; ++i) {
                table[i] = [];
            }
            return table;
        }
    }
}
