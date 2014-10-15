/*
	Section: Console
*/
module Yendor {
	/*
		Interface: Color
		Typesafe string color wrapper. 
		Stores colors using CSS format #rgb, #rrggbb, rgb(r,g,b) or one of the 17 standard colors :
		- aqua
		- black
		- blue
		- fuchsia
		- gray
		- green
		- lime
		- maroon
		- navy
		- olive
		- orange
		- purple
		- red
		- silver
		- teal
		- white
		- yellow
	*/
	export interface Color extends String {}

	/*
		Class: ColorUtils
		Some color manipulation utilities.
	*/
	export class ColorUtils {
		/*
			Function: multiply
			Multiply a color with a number. 
			> (r,g,b) * n == (r*n, g*n, b*n)

			Parameters:
			color - the color
			coef - the factor

			Returns:
			A new color
		*/
		static multiply(color:Color, coef:number):Color {
			var rgb:number[] = ColorUtils.toRgb(color);
			var r:number = Math.round(rgb[0]*coef);
			var g:number = Math.round(rgb[1]*coef);
			var b:number = Math.round(rgb[2]*coef);
			return 'rgb('+r+','+g+','+b+')';
		}
		private static stdCol = {
			'aqua':[0,255,255],
			'black':[0,0,0],
			'blue':[0,0,255],
			'fuchsia':[255,0,255],
			'gray':[128,128,128],
			'green':[0,128,0],
			'lime':[0,255,0],
			'maroon':[128,0,0],
			'navy':[0,0,128],
			'olive':[128,128,0],
			'orange':[255,165,0],
			'purple':[128,0,128],
			'red':[255,0,0],
			'silver':[192,192,192],
			'teal':[0,128,128],
			'white':[255,255,255],
			'yellow':[255,255,0],
		};
		/*
			Function: toRgb
			Convert a string color into a [r,g,b] number array.

			Parameters:
			color - the color

			Returns:
			An array of 3 numbers [r,g,b] between 0 and 255.
		*/
		static toRgb(color:Color) : number[] {
			color = color.toLowerCase();
			var stdColValues:number[] = ColorUtils.stdCol[String(color)];
			if ( stdColValues ) {
				return stdColValues;
			}
			if (color.charAt(0)=='#') {
				// #FFF or #FFFFFF format
				if ( color.length == 4) {
					// expand #FFF to #FFFFFF
					color = '#'+color.charAt(1)+color.charAt(1)+color.charAt(2)+color.charAt(2)+color.charAt(3)+color.charAt(3);
				}
				var num:number = parseInt(color.substr(1),16);
				return [ num >> 16, num >> 8 & 0xFF, num & 0xFF ];
			} else if (color.indexOf('rgb(') == 0) {
				// rgb(r,g,b) format
				var rgbList = color.substr(4, color.length-5 ).split(',');
				return [ parseInt(rgbList[0]), parseInt(rgbList[1]), parseInt(rgbList[2])];
			}
			return [0,0,0];
		}
	}

	/*
		Class: Position
		Stores the position of a cell in the console (column, row)
	*/
	export class Position {
		/*
			Constructor: constructor

			Parameters:
			_x : the column
			_y : the row
		*/
		constructor( private _x: number=0, private _y: number=0 ) {}
		
		/*
			Property: x
		*/
		get x() { return this._x; }
		set x(newValue: number) { this._x = newValue; }

		/*
			Property: y
		*/
		get y() { return this._y; }
		set y(newValue: number) { this._y = newValue; }

		/*
			Function: moveTo
			Update this position.

			Parameters:
			x - the column
			y - the row
		*/
		moveTo( x:number, y:number ) {
			this.x = x;
			this.y = y;
		}

		static distance( p1: Position, p2: Position) : number {
			var dx:number = p1.x - p2.x;
			var dy:number = p1.y - p2.y;
			return Math.sqrt(dx*dx+dy*dy);
		}
	}

	/*
		Class: Console
		An offscreen console that cannot be rendered on screen, but can be blit on other consoles.
	*/
	export class Console {
		/*
			Constructor: constructor

			Parameters:
			width - the number of columns
			height - the number of rows
			foreground - *optional* (default : white) default foreground color
			background - *optional* (default : black) default background color
		*/
		constructor( private _width: number, private _height: number,
			foreground: Color = 'white', background:Color = 'black' ) {
			this.text = [];
			this.clearText();
			this.fore = this.newColorTable();
			this.back = this.newColorTable();
			this.clearFore(foreground) ;
			this.clearBack(background);
		}

		/*
			Property: text
			Array of <height> strings storing the characters. The character at coordinate x,y is text[y][x].
		*/
		text: string[];

		/*
			Property: fore
			Matrix of <Color> storing the foreground color (characters color). The character color at coordinate x,y is fore[x][y].
		*/
		fore: Color[][];

		/*
			Property: back
			Matrix of <Color> storing the background color. The background color at coordinate x,y is back[x][y].
		*/
		back: Color[][];

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
			Function: render
			To be implemented by non offscreen consoles extending this class.
		*/
		render() {}

		/*
			Function: getPositionFromPixels
			Convert mouse coordinates relative to the document to console position.
			To be implemented by non offscreen consoles extending this class.

			Parameters:
			x - the mouse x coordinate in pixels relative to the document
			y - the mouse y coordinate in pixels relative to the document

			Returns:
			The <Position> in the console.
		*/
		getPositionFromPixels( x: number, y:number ) : Position { return undefined; }

		/*
			Function: setChar
			Change a character in the console

			Parameters:
			x - the column
			y - the row
			char - the new character (must be a one character string)
		*/
		setChar(x:number, y:number, char:string) {
			var s = this.text[y].substr(0,x) + char[0] + this.text[y].substr(x+1);
			this.text[y] = s;
		}

		/*
			Function: print
			Print a string on the console. If the string starts before the first column (x < 0) or ends after the last rows, it's truncated.

			Parameters:
			x - the column of the string's first character
			y - the row
			text - the string to print
			color - *optional* (default white)
		*/
		print(x: number, y: number, text: string, color: Color='white') {
			var begin = 0;
			var end = text.length;
			if ( x+end > this.width ) {
				end = this.width-x;
			}
			if ( x < 0 ) {
				end += x;
				x = 0;
			}
			this.clearFore(color, x, y, end, 1);
			for ( var i = begin; i < end; ++i ) {
				this.setChar(x+i, y, text[i]);
			}
		}

		/*
			Function: clearText
			Erase all the text on the console (don't change foreground/background colors)
		*/
		clearText() {
			for (var i = 0; i < this.height; i++) {
				this.text[i] = this.emptyLine();
			}			
		}

		/*
			Function: clearFore
			Change all the foreground colors of a rectangular zone. If width and height are undefined, fills the area to the border of the console.
			Using
			> console.clearFore('red');
			fills the whole console foreground with red.

			Parameters:
			value - new foreground color
			x - *optional* (default 0) top left column
			y - *optional* (default 0) top left row
			width - *optional* the rectangle width
			height - *optional* the rectangle height
		*/
		clearFore( value: Color,
			x: number = 0, y: number=0, width: number = -1, height: number=-1 ) {
			this.clearColorTable( this.fore, value, x, y, width, height );
		}


		/*
			Function: clearBack
			Change all the background colors of a rectangular zone. If width and height are undefined, fills the area to the border of the console.
			Using
			> console.clearBack('red');
			fills the whole console background with red.

			Parameters:
			value - new background color
			x - *optional* (default 0) top left column
			y - *optional* (default 0) top left row
			width - *optional* the rectangle width
			height - *optional* the rectangle height
		*/
		clearBack( value: Color,
			x: number = 0, y: number=0, width: number = -1, height: number=-1 ) {
			this.clearColorTable( this.back, value, x, y, width, height );
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
		blit( console: Console, x: number = 0, y: number = 0, xSrc: number = 0, ySrc: number = 0,
				srcWidth: number = -1, srcHeight: number = -1) {
			if ( srcWidth == -1 ) {
				srcWidth = this.width;
			}
			if ( srcHeight == -1 ) {
				srcHeight = this.height;
			}
			if ( x + srcWidth > console.width ) {
				srcWidth = console.width - x;
			}
			if ( y + srcHeight > console.height ) {
				srcHeight = console.height - y;
			}
			for ( var desty = y; desty < y+srcHeight; ++desty ) {
				for ( var destx = x; destx < x+srcWidth; ++destx ) {
					var sourcex = xSrc + destx - x;
					var sourcey = ySrc + desty - y;
					console.setChar(destx,desty,this.text[sourcey][sourcex]);
					console.back[destx][desty] = this.back[sourcex][sourcey];
					console.fore[destx][desty] = this.fore[sourcex][sourcey];
				}
			}
		}

		private clearColorTable( table: Color[][], value: Color,
			x: number = 0, y: number=0, width: number = -1, height: number=-1 ) {
			if ( width == -1 ) {
				width = this.width - x;
			}
			if ( height == -1 ) {
				height = this.height - y;
			}
			for (var cy = y; cy < y + height; ++cy) {
				for (var cx = x; cx < x + width; ++cx) {
					table[cx][cy] = value;
				}
			}
		}

		private newColorTable(): Color[][] {
			var table = [];
			for (var i = 0; i < this.width; i++) {
				table[i] = [];
			}
			return table;
		}

		private emptyLine(): string {
			var s='';
			for (var i = 0; i < this.width; i++) {
				s += ' ';
			}
			return s;
		}
	}

	/*
		Class: DivConsole
		A console that can be renderer as divs (one per row) filled with spans.
	*/
	export class DivConsole extends Console {
		private divSelector: string;
		private div:HTMLElement;

		/*
			Property: charWidth
			A character's width in pixels.
		*/
		private charWidth: number;

		/*
			Property: charHeight
			A character's height in pixels.
		*/
		private charHeight: number;

		/*
			Constructor: constructor

			Parameters:
			width - number of columns
			height - number of rows
			foreground - default foreground color
			background - default background color
			div - HTML element where to render this console
		*/
		constructor( _width: number, _height: number,
			foreground: Color, background: Color, divSelector : string ) {
			super(_width, _height, foreground, background);
			this.divSelector = divSelector;
			this.div = $(divSelector)[0];
			this.computeCharSize();
		}

		/*
			Function: computeCharSize
			Compute the size of a character in pixels. This is needed to convert mouse coordinates from pixels to console position.
		*/
		private computeCharSize() {
			// insert a single (invisible) character in the console
			this.text[0][0]='@';
			this.fore[0][0]='black';
			this.render();
			// get the resulting span size
			var oldId = this.div.id;
			this.div.id='__yendor_div';
			var span:JQuery = $('#__yendor_div div.line span');
			this.charWidth = span.width();
			this.charHeight = span.height();
			console.log('Char size : '+this.charWidth+ ' x '+this.charHeight);
			// restore the console
			this.div.id=oldId;
			this.text[0][0]=' ';
			this.fore[0][0]=this.fore[0][1];
			this.render();
		}

		/*
			Function: render
			Update the content of the HTML element
		*/
		render() {
			this.div.innerHTML = this.getHTML();
		}

		/*
			Function: getPositionFromPixels
			Returns the column and row corresponding to a mouse position in the page.

			Parameters:
			x - the mouse x coordinate in pixels relative to the document
			y - the mouse y coordinate in pixels relative to the document

			Returns:
			The <Position> in the console.
		*/
		getPositionFromPixels( x: number, y:number ) : Position {
			var dx:number = x - $(this.divSelector).offset().left;
			var dy:number = y - $(this.divSelector).offset().top;
			return new Position(Math.floor(dx/this.charWidth), Math.floor(dy/this.charHeight));
		}


		/*
			Function: getHTML

			Returns:
			A HTML representation of the console
		*/
		getHTML(): string {
			var s = '';
			for (var i = 0; i < this.height; i++) {
				s += "<div class='line'>" + this.getLineHTML(i) + '</div>';
			}
			return s;
		}

		private getLineHTML( line: number ): string {
			var currentFore = this.fore[0][line];
			var currentBack = this.back[0][line];
			var s = '<span style="color:' + currentFore + ';background-color:' + currentBack + '">' + this.text[line][0];
			for ( var i = 1; i < this.width; i++ ) {
				var nextFore = this.fore[i][line];
				var nextBack = this.back[i][line];
				if ( nextFore != currentFore || nextBack != currentBack ) {
					currentFore = nextFore;
					currentBack = nextBack;
					s+='</span><span style="color:' + currentFore + ';background-color:' + currentBack + '">';
				}
				s += this.text[line][i];
			}
			s += '</span>';
			return s;
		}
	}
}