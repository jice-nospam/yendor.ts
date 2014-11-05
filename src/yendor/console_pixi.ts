/// <reference path="../decl/pixi.d.ts" />
/// <reference path="../yendor/yendor.ts" />

/*
	Section: Console
*/
module Yendor {
	/*
		Class: PixiConsole
		A console that can be rendered as WebGL or canvas using pixi.js.
	*/
	export class PixiConsole extends Console {
		private canvasSelector: string;
		private canvas: HTMLCanvasElement;
		private renderer: PIXI.IPixiRenderer;
		private stage: PIXI.Stage;
		private font: PIXI.BaseTexture;
		private chars: PIXI.Texture[];
		private cells: PIXI.Sprite[][];

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
			canvasSelector - JQuery selector for the canvas where to render this console
			fontUrl - URL of the image containing the font
		*/
		constructor( _width: number, _height: number,
			foreground: Color, background: Color, canvasSelector: string, fontUrl: string ) {
			super(_width, _height, foreground, background);
			this.canvasSelector = canvasSelector;
			this.canvas = <HTMLCanvasElement>$(canvasSelector)[0];
			this.stage = new PIXI.Stage(0x888888);
			this.renderer = PIXI.autoDetectRenderer(640,480, this.canvas);
			var gameContainer = new PIXI.SpriteBatch();
			this.font = PIXI.BaseTexture.fromImage(fontUrl, false, PIXI.scaleModes.NEAREST);
			this.charWidth = this.font.width/16;
			this.charHeight = this.font.width/16;
			this.stage.addChild(gameContainer);
			this.cells = [];
			this.chars=[];
			for ( var x=0; x < 16; x++) {
				for ( var y=0; y < 16; y++) {
					var rect=new PIXI.Rectangle(y*this.charHeight, x*this.charWidth, this.charWidth, this.charHeight);
					this.chars[x+y*16]=new PIXI.Texture(this.font,rect);
				}
			}
			for ( var x=0; x < this.width; x++) {
				this.cells[x] = [];
				for ( var y=0; y < this.height; y++) {
					var rect=new PIXI.Rectangle(0, 0, this.charWidth, this.charHeight);
					var cell=new PIXI.Sprite(this.chars[32]);
					cell.position.x = x * this.charWidth;
					cell.position.y = y * this.charHeight;
					cell.tint=0xFF0000;
					this.cells[x][y]=cell;
					gameContainer.addChild(cell);
				}
			}
		}

		/*
			Function: render
			Update the content of the canvas
		*/
		render() {
			for ( var x=0; x < this.width; x++) {
				for ( var y=0; y < this.height; y++) {
					var ascii = this.text[y].charCodeAt(x);
					this.cells[x][y].texture = this.chars[ascii];
					this.cells[x][y].tint = 0xFF0000; //ColorUtils.toNumber(this.fore[x][y]);
				}
			}
			this.renderer.render(this.stage);
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
			var dx:number = x - $(this.canvasSelector).offset().left;
			var dy:number = y - $(this.canvasSelector).offset().top;
			return new Position(Math.floor(dx/this.charWidth), Math.floor(dy/this.charHeight));
		}
	}
}
