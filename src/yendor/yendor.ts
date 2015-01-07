/// <reference path="../decl/jquery.d.ts" />
/// <reference path="console.ts" />
/// <reference path="console_pixi.ts" />
/// <reference path="console_div.ts" />
/// <reference path="rng.ts" />
/// <reference path="bsp.ts" />
/// <reference path="fov.ts" />
/// <reference path="path.ts" />
/// <reference path="scheduler.ts" />
module Yendor {
	"use strict";

	export var VERSION = "0.2.0";

	export var urlParams : { [index: string]: string; };
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
		urlParams = parseUrlParams();
	}

	function parseUrlParams() {
		var params: string[] = window.location.search.substring(1).split("&");
		var paramMap: { [index: string]: string; } = {};
		for (var i = 0; i < params.length; ++i) {
			var p = params[i].split("=");
			if ( p.length === 2 ) {
				paramMap[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
			}
		}
		return paramMap;
	}

	export function createConsole(width: number, height: number,
			foreground: Color, background: Color, divSelector: string, fontUrl: string ): Console {
		if ( urlParams[URL_PARAM_RENDERER] === URL_PARAM_RENDERER_DIV ) {
			return new DivConsole(width, height, foreground, background, divSelector);
		} else {
			return new PixiConsole(width, height, foreground, background, divSelector, fontUrl);
		}
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
