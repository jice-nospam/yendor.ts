/// <reference path="../decl/jquery.d.ts" />
/// <reference path="console.ts" />
/// <reference path="console_pixi.ts" />
/// <reference path="console_div.ts" />
/// <reference path="rng.ts" />
/// <reference path="bsp.ts" />
/// <reference path="fov.ts" />
module Yendor {
	"use strict";

	export var VERSION = "0.0.3";
	var frameLoop : (callback: (elapsedTime: number) => void) => void;
	/*
		Function: init

		Initialize the library.

	 */
	export function init() {
		/*
		Provides requestAnimationFrame in a cross browser way.
		http://paulirish.com/2011/requestanimationframe-for-smart-animating/
		*/

		frameLoop = (function() {
			return window.requestAnimationFrame ||
			(<any>window).webkitRequestAnimationFrame ||
			(<any>window).mozRequestAnimationFrame ||
			(<any>window).oRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			function(callback: (elapsedTime: number) => void) {
				window.setTimeout(callback, 1000 / 60, new Date().getTime());
			};
		})();
	}

	export interface FrameRenderer {
		(elapsedTime: number): void;
	}

	var renderer : FrameRenderer;
	function frameFunc (elapsedTime : number) {
		frameLoop(frameFunc);
		renderer(elapsedTime);
	}

	/*
		Function: loop

		Start the frame rendering loop.
	*/
	export function loop( theRenderer : FrameRenderer ) {
		renderer = theRenderer;
		frameLoop(frameFunc);
	}
}
