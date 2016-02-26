/// <reference path="../decl/jquery.d.ts" />
/// <reference path="../core/core.ts" />
/// <reference path="console.ts" />
/// <reference path="console_pixi.ts" />
/// <reference path="console_div.ts" />
/// <reference path="rng.ts" />
/// <reference path="bsp.ts" />
/// <reference path="fov.ts" />
/// <reference path="path.ts" />
/// <reference path="scheduler.ts" />

/*
	Section: yendor.ts
*/
module Yendor {
    "use strict";

    export const VERSION = "0.5.0";

	/*
		Property: urlParams
		A map storing all parameters from the URL. If the game is started with :
		> http://server/index.html?param=value
		You can retrieve the value with :
		> Yendor.urlParams["param"]
	*/
    export var urlParams: { [index: string]: string; };
    var frameLoop: (callback: (elapsedTime: number) => void) => void;
	/*
		Function: init

		Initialize the library. Must be called before anything else.
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

    function parseUrlParams(): { [index: string]: string; } {
        var params: string[] = window.location.search.substring(1).split("&");
        var paramMap: { [index: string]: string; } = {};
        for (var i: number = 0, len: number = params.length; i < len; ++i) {
            var p = params[i].split("=");
            if (p.length === 2) {
                paramMap[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
            }
        }
        return paramMap;
    }

	/*
		Function: createConsole
		Create a console. If the renderer is not defined by the 'renderer' URL parameter, it is automatically defined.

		Possible values for the 'renderer' parameter are :
		- 'pixi/webgl' : the fastest provided you have a recent browser and working openGL drivers.
		- 'pixi/canvas' : should work on slightly older browser. Doesn't require openGL drivers.
		- 'yendor/div' : very slow but should work on any browser.

		Parameters:
		width - number of columns
		height - number of rows
		foreground - default color for text
		background - default color for text background
		divSelector - jquery selector for the div containing the console
		fontUrl - bitmap font containing the characters to use
	*/
    export function createConsole(width: number, height: number,
        foreground: Core.Color, background: Core.Color, divSelector: string, fontUrl: string): Console {
        if (urlParams[URL_PARAM_RENDERER] === URL_PARAM_RENDERER_DIV) {
            return new DivConsole(width, height, foreground, background, divSelector);
        } else {
            return new PixiConsole(width, height, foreground, background, divSelector, fontUrl);
        }
    }

	/*
		Interface: FrameRenderer
		Renders the game screen
	*/
    export interface FrameRenderer {
        (elapsedTime: number): void;
    }

    var renderer: FrameRenderer;
    function frameFunc(elapsedTime: number) {
        frameLoop(frameFunc);
        renderer(elapsedTime);
    }

	/*
		Function: loop

		Start the frame rendering loop.
	*/
    export function loop(theRenderer: FrameRenderer) {
        renderer = theRenderer;
        frameLoop(frameFunc);
    }
}
