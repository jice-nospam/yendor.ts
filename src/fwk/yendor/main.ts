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
export * from "./persistence";
export * from "./persistence_local_storage";
export * from "./persistence_indexed_db";
export * from "./behavior";
export * from "./behavior_action";
export * from "./behavior_composite";
export * from "./behavior_decorator";

import * as Core from "../core/main";
import { Console, URL_PARAM_RENDERER, URL_PARAM_RENDERER_DIV } from "./console";
import { DivConsoleRenderer } from "./console_div";
import { PixiConsoleRenderer } from "./console_pixi";
import { Persistence } from "./persistence";
import {
    AbstractNode, AbstractCompositeNode, AbstractActionNode, AbstractConditionNode,
    AbstractDecoratorNode, Context, Tick, BehaviorTree,
} from "./behavior";
import { SelectorNode, SequenceNode, MemSelectorNode, MemSequenceNode } from "./behavior_composite";
import { ErrorNode, FailureNode, RunningNode, SuccessNode, WaitNode } from "./behavior_action";
import { InverterNode, MaxTicksNode } from "./behavior_decorator";

/**
 * Section: yendor.ts
 */

export const VERSION = "0.8.0";

export let isBrowser = new Function("try {return this===window;}catch(e){ return false;}");

/**
 * Property: urlParams
 * A map storing all parameters from the URL. If the game is started with :
 * > http://server/index.html?param=value
 * You can retrieve the value with :
 * > Yendor.urlParams["param"]
 */
export let urlParams: { [index: string]: string; };
let frameLoop: (callback: (elapsedTime: number) => void) => void;
/**
 * Function: init
 * Initialize the library. Must be called before anything else.
 */
export function init() {
    /**
     * Provides requestAnimationFrame in a cross browser way.
     * http://paulirish.com/2011/requestanimationframe-for-smart-animating/
     */

    frameLoop = (function () {
        return window.requestAnimationFrame ||
            (<any>window).webkitRequestAnimationFrame ||
            (<any>window).mozRequestAnimationFrame ||
            (<any>window).oRequestAnimationFrame ||
            (<any>window).msRequestAnimationFrame ||
            function (callback: (elapsedTime: number) => void) {
                window.setTimeout(callback, 1000 / 60, new Date().getTime());
            };
    })();
    urlParams = parseUrlParams();
}

function registerPersistentClasses() {
    Persistence.registerClass(Core.Position);
    Persistence.registerClass(Core.Rect);
    Persistence.registerClass(AbstractNode);
    Persistence.registerClass(AbstractConditionNode);
    Persistence.registerClass(AbstractCompositeNode);
    Persistence.registerClass(AbstractActionNode);
    Persistence.registerClass(AbstractDecoratorNode);
    Persistence.registerClass(Context);
    Persistence.registerClass(BehaviorTree);
    Persistence.registerClass(Tick);
    Persistence.registerClass(SelectorNode);
    Persistence.registerClass(SequenceNode);
    Persistence.registerClass(MemSequenceNode);
    Persistence.registerClass(MemSelectorNode);
    Persistence.registerClass(ErrorNode);
    Persistence.registerClass(FailureNode);
    Persistence.registerClass(RunningNode);
    Persistence.registerClass(SuccessNode);
    Persistence.registerClass(WaitNode);
    Persistence.registerClass(InverterNode);
    Persistence.registerClass(MaxTicksNode);
}
registerPersistentClasses();

function parseUrlParams(): { [index: string]: string; } {
    let params: string[] = window.location.search.substring(1).split("&");
    let paramMap: { [index: string]: string; } = {};
    for (let param of params) {
        let p = param.split("=");
        if (p.length === 2) {
            paramMap[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
        }
    }
    return paramMap;
}

/**
 * Function: createConsole
 * Create a console. If the renderer is not defined by the 'renderer' URL parameter,
 * it is automatically defined.
 * Possible values for the 'renderer' parameter are :
 * - 'pixi/webgl' : the fastest provided you have a recent browser and working openGL drivers.
 * - 'pixi/canvas' : should work on slightly older browser. Doesn't require openGL drivers.
 * - 'yendor/div' : very slow but should work on any browser.
 * Parameters:
 * width - number of columns
 * height - number of rows
 * foreground - default color for text
 * background - default color for text background
 * divSelector - jquery selector for the div containing the console
 * fontUrl - bitmap font containing the characters to use
 */
export function createConsole(width: number, height: number, foreground: Core.Color, background: Core.Color,
    divSelector: string, fontUrl: string): Console {
    if (urlParams[URL_PARAM_RENDERER] === URL_PARAM_RENDERER_DIV) {
        return new Console(width, height, foreground, background, new DivConsoleRenderer(divSelector));
    } else {
        return new Console(width, height, foreground, background, new PixiConsoleRenderer(foreground, background,
            divSelector, fontUrl, urlParams[URL_PARAM_RENDERER]));
    }
}

/**
 * Interface: FrameRenderer
 * Renders the game screen
 */
export interface IFrameRenderer {
    (elapsedTime: number): void;
}

let renderer: IFrameRenderer;
function frameFunc(elapsedTime: number) {
    frameLoop(frameFunc);
    renderer(elapsedTime);
}

/**
 * Function: loop
 * Start the frame rendering loop.
 */
export function loop(theRenderer: IFrameRenderer) {
    renderer = theRenderer;
    frameLoop(frameFunc);
}
