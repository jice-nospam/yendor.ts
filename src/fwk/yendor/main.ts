/// <reference path="../../decl/jquery.d.ts" />

export * from "./rng";
export * from "./console";
export * from "./console_pixi";
export * from "./console_div";
export * from "./bsp";
export * from "./fov";
export * from "./path";
export * from "./noise";
export * from "./scheduler";
export * from "./heap";

import * as Core from "../core/main";
import * as con from "./console";
import * as divCon from "./console_div";
import * as pixCon from "./console_pixi";
/**
	Section: yendor.ts
*/

export const VERSION = "0.6.0";

/**
    Property: urlParams
    A map storing all parameters from the URL. If the game is started with :
    > http://server/index.html?param=value
    You can retrieve the value with :
    > Yendor.urlParams["param"]
*/
export let urlParams: { [index: string]: string; };
let frameLoop: (callback: (elapsedTime: number) => void) => void;
/**
    Function: init

    Initialize the library. Must be called before anything else.
    */
export function init() {
    /**
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
    let params: string[] = window.location.search.substring(1).split("&");
    let paramMap: { [index: string]: string; } = {};
    for (let i: number = 0, len: number = params.length; i < len; ++i) {
        let p = params[i].split("=");
        if (p.length === 2) {
            paramMap[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
        }
    }
    return paramMap;
}

/**
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
    foreground: Core.Color, background: Core.Color, divSelector: string, fontUrl: string): con.Console {
    if (urlParams[con.URL_PARAM_RENDERER] === con.URL_PARAM_RENDERER_DIV) {
        return new divCon.DivConsole(width, height, foreground, background, divSelector);
    } else {
        return new pixCon.PixiConsole(width, height, foreground, background, divSelector, fontUrl, urlParams[con.URL_PARAM_RENDERER]);
    }
}

/**
    Interface: FrameRenderer
    Renders the game screen
*/
export interface FrameRenderer {
    (elapsedTime: number): void;
}

let renderer: FrameRenderer;
function frameFunc(elapsedTime: number) {
    frameLoop(frameFunc);
    renderer(elapsedTime);
}

/**
    Function: loop

    Start the frame rendering loop.
*/
export function loop(theRenderer: FrameRenderer) {
    renderer = theRenderer;
    frameLoop(frameFunc);
}
