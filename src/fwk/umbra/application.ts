/**
 * Section: Application
 */
import * as $ from "jquery";
import * as Yendor from "../yendor/main";
import * as Core from "../core/main";
import * as Constants from "./constants";
import {Scene, SceneManager} from "./scene";
import {logger} from "./main";
import {resetInput} from "./input";

export interface IApplicationOptions {
    consoleWidth?: number;
    consoleHeight?: number;
    defaultBackgroundColor?: Core.Color;
    defaultForegroundColor?: Core.Color;
    renderDivSelector?: string;
    fontFileName?: string;
    ticksPerSecond?: number;

    /**
     * Field: backgroundAnimation
     * Whether the scene should be rendered every frame or only after an update
     */
    backgroundAnimation?: boolean;
}
export class Application {
    private static DEFAULT_OPTIONS: IApplicationOptions = {
        consoleHeight: Constants.DEFAULT_CONSOLE_HEIGHT,
        consoleWidth: Constants.DEFAULT_CONSOLE_WIDTH,
        defaultBackgroundColor: Constants.DEFAULT_BACKGROUND_COLOR,
        defaultForegroundColor: Constants.DEFAULT_FOREGROUND_COLOR,
        fontFileName: Constants.DEFAULT_FONT_FILE_NAME,
        renderDivSelector: Constants.DEFAULT_DIV_SELECTOR,
        ticksPerSecond: Constants.DEFAULT_TICKS_PER_SECOND,
    };

    protected console: Yendor.Console;
    protected _gameTime: number = 0;
    protected _elapsedTime: number = 0;
    protected options: IApplicationOptions;
    protected tickLength: number;
    protected paused: boolean = false;
    protected dirtyFrame: boolean = true;

    public getConsole(): Yendor.Console {
        return this.console;
    }

    get gameTime() { return this._gameTime; }
    get elapsedTime() { return this._elapsedTime; }

    public run(startingScene: Scene, options: IApplicationOptions = Application.DEFAULT_OPTIONS): void {
        $(window).focus(this.onGainFocus.bind(this));
        $(window).blur(this.onLoseFocus.bind(this));
        this.options = <IApplicationOptions> {
            backgroundAnimation : options.backgroundAnimation || Constants.DEFAULT_BACKGROUND_ANIMATION,
            consoleHeight: options.consoleHeight ? options.consoleHeight : Constants.DEFAULT_CONSOLE_HEIGHT,
            consoleWidth: options.consoleWidth ? options.consoleWidth : Constants.DEFAULT_CONSOLE_WIDTH,
            defaultBackgroundColor: options.defaultBackgroundColor || Constants.DEFAULT_BACKGROUND_COLOR,
            defaultForegroundColor: options.defaultForegroundColor || Constants.DEFAULT_FOREGROUND_COLOR,
            fontFileName: options.fontFileName ? options.fontFileName : Constants.DEFAULT_FONT_FILE_NAME,
            renderDivSelector: options.renderDivSelector ? options.renderDivSelector : Constants.DEFAULT_DIV_SELECTOR,
            ticksPerSecond: options.ticksPerSecond ? options.ticksPerSecond : Constants.DEFAULT_TICKS_PER_SECOND,
        };
        if ( Yendor.urlParams[Constants.URL_PARAM_FONT_FILENAME] ) {
            this.options.fontFileName = Yendor.urlParams[Constants.URL_PARAM_FONT_FILENAME];
        }
        this.dirtyFrame = true;
        this.tickLength = 1.0 / this.options.ticksPerSecond;
        this.console = Yendor.createConsole(
            this.options.consoleWidth || Constants.DEFAULT_CONSOLE_WIDTH,
            this.options.consoleHeight || Constants.DEFAULT_CONSOLE_HEIGHT,
            this.options.defaultForegroundColor || Constants.DEFAULT_FOREGROUND_COLOR,
            this.options.defaultBackgroundColor || Constants.DEFAULT_BACKGROUND_COLOR,
            this.options.renderDivSelector || Constants.DEFAULT_DIV_SELECTOR,
            this.options.fontFileName || Constants.DEFAULT_FONT_FILE_NAME);
        SceneManager.runScene(startingScene);
        Yendor.loop((time) => this.onNewFrame(time));
    }

    /**
     * Function: onLoseFocus
     * Called when the game window (or browser tab) loses focus
     */
    protected onLoseFocus(): void {
        this.paused = true;
    }

    /**
     * Function: onGainFocus
     * Called when the game window (or browser tab) gains focus
     */
    protected onGainFocus(): void {
        this.paused = false;
        resetInput();
    }

    /**
     * Function: onNewFrame
     * Called when the browser renders a new animation frame
     */
    protected onNewFrame(time: number): void {
        try {
            this._elapsedTime = time - this._gameTime;
            let scene: Scene = SceneManager.getRunningScene();
            if (this._elapsedTime >= this.tickLength) {
                this._gameTime = time;
                // update the game only options.ticksPerSecond per second
                if (!this.paused) {
                    scene.updateHierarchy(time);
                    scene.computeBoundingBox();
                    scene.expand(this.console.width, this.console.height);
                    resetInput();
                    this.dirtyFrame = true;
                }
            }
            // but render every frame to allow background animations (torch flickering, ...)
            if (!this.paused && this.dirtyFrame) {
                scene.renderHierarchy(this.console);
                this.console.render();
                if ( !this.options.backgroundAnimation ) {
                    this.dirtyFrame = false;
                }
            }
        } catch (err) {
            logger.critical(err.fileName + ":" + err.lineNumber + "\n" + err.message);
        }
    }
}
