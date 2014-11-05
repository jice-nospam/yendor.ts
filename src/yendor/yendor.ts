/// <reference path="../decl/jquery.d.ts" />
/// <reference path="console.ts" />
/// <reference path="console_pixi.ts" />
/// <reference path="rng.ts" />
/// <reference path="bsp.ts" />
/// <reference path="fov.ts" />
module Yendor {
	export var VERSION = '0.0.2';
	var frameLoop : (callback: (elapsedTime:number) => void) => void;
	/*
		Function: init

		Create the main console inside an HTML element.

		Parameters:
	 	divSelector - a CSS selector for the HTML element containing the console.
		width - number of columns.
		height - number of rows.
		foreground - default foreground color.
		background - default background color.

		Returns:

			The Yendor.Console created.
	 */
	export function init( divSelector : string, width:number, height : number, 
		foreground : Color, background : Color ) : Console {
		var div:HTMLElement = $(divSelector)[0];
		div.style.fontFamily='monospace';
		div.style.whiteSpace='pre';
		div.style.display='table';
		/*
		Provides requestAnimationFrame in a cross browser way.
		http://paulirish.com/2011/requestanimationframe-for-smart-animating/
		*/

		frameLoop = (function(){ 
			return window.requestAnimationFrame || 
			(<any>window).webkitRequestAnimationFrame || 
			(<any>window).mozRequestAnimationFrame || 
			(<any>window).oRequestAnimationFrame || 
			window.msRequestAnimationFrame || 
			function(callback){ 
				window.setTimeout(callback, 1000 / 60, new Date().getTime()); 
			}; 
		})(); 	
		return new PixiConsole( width, height, foreground, background, divSelector, 'terminal.png' );
	}

	export interface FrameRenderer {
		(elapsedTime:number): void;
	}

	var renderer : FrameRenderer;
	function frameFunc (elapsedTime : number) {
		frameLoop(frameFunc);
		renderer(elapsedTime);
	}

	export function loop( theRenderer : FrameRenderer ) {
		renderer = theRenderer;
		frameLoop(frameFunc);
	}
}