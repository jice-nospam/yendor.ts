/**
	Section: Console
*/
module Yendor {
    "use strict";
    // URL params
    export const URL_PARAM_RENDERER: string = "renderer";
    export const URL_PARAM_RENDERER_PIXI_WEBGL: string = "pixi/webgl";
    export const URL_PARAM_RENDERER_PIXI_CANVAS: string = "pixi/canvas";
    export const URL_PARAM_RENDERER_DIV: string = "yendor/div";

    // Special characters ascii codes
	// single walls
	export const CHAR_HLINE: number = 196;
	export const CHAR_VLINE: number = 179;
	export const CHAR_NE: number = 191;
	export const CHAR_NW: number = 218;
	export const CHAR_SE: number = 217;
	export const CHAR_SW: number = 192;
	export const CHAR_TEEW: number = 180;
	export const CHAR_TEEE: number = 195;
	export const CHAR_TEEN: number = 193;
	export const CHAR_TEES: number = 194;
	export const CHAR_CROSS: number = 197;
	// double walls
	export const CHAR_DHLINE: number = 205;
	export const CHAR_DVLINE: number = 186;
	export const CHAR_DNE: number = 187;
	export const CHAR_DNW: number = 201;
	export const CHAR_DSE: number = 188;
	export const CHAR_DSW: number = 200;
	export const CHAR_DTEEW: number = 185;
	export const CHAR_DTEEE: number = 204;
	export const CHAR_DTEEN: number = 202;
	export const CHAR_DTEES: number = 203;
	export const CHAR_DCROSS: number = 206;
	// blocks 
	export const CHAR_BLOCK1: number = 176;
	export const CHAR_BLOCK2: number = 177;
	export const CHAR_BLOCK3: number = 178;
	// arrows 
	export const CHAR_ARROW_N: number = 24;
	export const CHAR_ARROW_S: number = 25;
	export const CHAR_ARROW_E: number = 26;
	export const CHAR_ARROW_W: number = 27;
	// arrows without tail 
	export const CHAR_ARROW2_N: number = 30;
	export const CHAR_ARROW2_S: number = 31;
	export const CHAR_ARROW2_E: number = 16;
	export const CHAR_ARROW2_W: number = 17;
	// double arrows 
	export const CHAR_DARROW_H: number = 29;
	export const CHAR_DARROW_V: number = 18;
	// GUI stuff 
	export const CHAR_CHECKBOX_UNSET: number = 224;
	export const CHAR_CHECKBOX_SET: number = 225;
	export const CHAR_RADIO_UNSET: number = 9;
	export const CHAR_RADIO_SET: number = 10;
	// sub-pixel resolution kit 
	export const CHAR_SUBP_NW: number = 226;
	export const CHAR_SUBP_NE: number = 227;
	export const CHAR_SUBP_N: number = 228;
	export const CHAR_SUBP_SE: number = 229;
	export const CHAR_SUBP_DIAG: number = 230;
	export const CHAR_SUBP_E: number = 231;
	export const CHAR_SUBP_SW: number = 232;
	// miscellaneous 
	export const CHAR_SMILIE : number =  1;
	export const CHAR_SMILIE_INV : number =  2;
	export const CHAR_HEART : number =  3;
	export const CHAR_DIAMOND : number =  4;
	export const CHAR_CLUB : number =  5;
	export const CHAR_SPADE : number =  6;
	export const CHAR_BULLET : number =  7;
	export const CHAR_BULLET_INV : number =  8;
	export const CHAR_MALE : number =  11;
	export const CHAR_FEMALE : number =  12;
	export const CHAR_NOTE : number =  13;
	export const CHAR_NOTE_DOUBLE : number =  14;
	export const CHAR_LIGHT : number =  15;
	export const CHAR_EXCLAM_DOUBLE : number =  19;
	export const CHAR_PILCROW : number =  20;
	export const CHAR_SECTION : number =  21;
	export const CHAR_POUND : number =  156;
	export const CHAR_MULTIPLICATION : number =  158;
	export const CHAR_FUNCTION : number =  159;
	export const CHAR_RESERVED : number =  169;
	export const CHAR_HALF : number =  171;
	export const CHAR_ONE_QUARTER : number =  172;
	export const CHAR_COPYRIGHT : number =  184;
	export const CHAR_CENT : number =  189;
	export const CHAR_YEN : number =  190;
	export const CHAR_CURRENCY : number =  207;
	export const CHAR_THREE_QUARTERS : number =  243;
	export const CHAR_DIVISION : number =  246;
	export const CHAR_GRADE : number =  248;
	export const CHAR_UMLAUT : number =  249;
	export const CHAR_POW1 : number =  251;
	export const CHAR_POW3 : number =  252;
	export const CHAR_POW2 : number =  253;
	export const CHAR_BULLET_SQUARE : number =  254;    

	/**
		Class: Console
		An offscreen console that cannot be rendered on screen, but can be blit on other consoles.
	*/
    export class Console {
        private _width: number;
        private _height: number;
		/**
			Property: text
			Matrix of <number> storing the ascii code. The character at coordinate x,y is text[x][y].
		*/
        text: number[][];

		/**
			Property: fore
			Matrix of <Core.Color> storing the foreground color (characters color). The character color at coordinate x,y is fore[x][y].
		*/
        fore: Core.Color[][];

		/**
			Property: back
			Matrix of <Core.Color> storing the background color. The background color at coordinate x,y is back[x][y].
		*/
        back: Core.Color[][];

		/**
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

		/**
			Property: height
			The number of rows (read-only)
		*/
        get height(): number { return this._height; }

		/**
			Property: width
			The number of columns (read-only)
		*/
        get width(): number { return this._width; }

		/**
			Function: contains
			Check if a position is inside the console
		*/
        contains(pos: Core.Position): boolean {
            return pos.x >= 0 && pos.y >= 0 && pos.x < this._width && pos.y < this._height;
        }

		/**
			Function: render
			To be implemented by non offscreen consoles extending this class.
		*/
        render() {
            // empty
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
        getPositionFromPixels(x: number, y: number, pos: Core.Position): Core.Position { return undefined; }

		/**
			Function: print
			Print a string on the console. If the string starts before the first column (x < 0) or ends after the last rows, it"s truncated.

			Parameters:
			x - the column of the string"s first character
			y - the row
			text - the string to print
			color - *optional* (default white)
		*/
        print(x: number, y: number, text: string, color: Core.Color = 0xFFFFFF) {
            let begin = 0;
            let end = text.length;
            if (x + end > this.width) {
                end = this.width - x;
            }
            if (x < 0) {
                end += x;
                x = 0;
            }
            this.clearFore(color, x, y, end, 1);
            for (let i = begin; i < end; ++i) {
                this.text[i + x][y] = text.charCodeAt(i);
            }
        }

		/**
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

		/**
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


		/**
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

		/**
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
            for (let desty = y; desty < y + srcHeight; ++desty) {
                for (let destx = x; destx < x + srcWidth; ++destx) {
                    let sourcex = xSrc + destx - x;
                    let sourcey = ySrc + desty - y;
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
            for (let cy = y; cy < y + height; ++cy) {
                for (let cx = x; cx < x + width; ++cx) {
                    table[cx][cy] = value;
                }
            }
        }

        private newTable(): any[][] {
            let table = [];
            for (let i = 0; i < this.width; ++i) {
                table[i] = [];
            }
            return table;
        }
    }
}
