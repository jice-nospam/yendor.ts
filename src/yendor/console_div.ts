/// <reference path="../yendor/yendor.ts" />

/*
	Section: DivConsole
*/
module Yendor {
	/*
		Class: DivConsole
		A console that can be rendered as divs (one per row) filled with spans.
	*/
	export class DivConsole extends Console {
		private divSelector: string;
		private div: HTMLElement;

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
			divSelector - JQuery selector for the element where to render this console
		*/
		constructor( _width: number, _height: number,
			foreground: Color, background: Color, divSelector: string ) {
			super(_width, _height, foreground, background);
			this.divSelector = divSelector;
			this.div = $(divSelector)[0];
			this.div.style.fontFamily = "monospace";
			this.div.style.whiteSpace = "pre";
			this.div.style.display = "table";
			this.computeCharSize();
		}

		/*
			Function: computeCharSize
			Compute the size of a character in pixels. This is needed to convert mouse coordinates from pixels to console position.
		*/
		private computeCharSize() {
			// insert a single (invisible) character in the console
			this.text[0][0] = "@";
			this.fore[0][0] = "black";
			this.render();
			// get the resulting span size
			var oldId = this.div.id;
			this.div.id = "__yendor_div";
			var span: JQuery = $("#__yendor_div div.line span");
			this.charWidth = span.width();
			this.charHeight = span.height();
			console.log("Char size : " + this.charWidth + " x " + this.charHeight);
			// restore the console
			this.div.id = oldId;
			this.text[0][0] = " ";
			this.fore[0][0] = this.fore[0][1];
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
		getPositionFromPixels( x: number, y: number ) : Position {
			var dx: number = x - $(this.divSelector).offset().left;
			var dy: number = y - $(this.divSelector).offset().top;
			return new Position(Math.floor(dx / this.charWidth), Math.floor(dy / this.charHeight));
		}


		/*
			Function: getHTML

			Returns:
			A HTML representation of the console
		*/
		getHTML(): string {
			var s = "";
			for (var i = 0; i < this.height; i++) {
				s += "<div class='line'>" + this.getLineHTML(i) + "</div>";
			}
			return s;
		}

		private getLineHTML( line: number ): string {
			var currentFore = this.fore[0][line];
			var currentBack = this.back[0][line];
			var s = "<span style='color:" + currentFore + ";background-color:" + currentBack + "'>" + this.text[line][0];
			for ( var i = 1; i < this.width; i++ ) {
				var nextFore = this.fore[i][line];
				var nextBack = this.back[i][line];
				if ( nextFore !== currentFore || nextBack !== currentBack ) {
					currentFore = nextFore;
					currentBack = nextBack;
					s += "</span><span style='color:" + currentFore + ";background-color:" + currentBack + "'>";
				}
				s += this.text[line][i];
			}
			s += "</span>";
			return s;
		}
	}
}
