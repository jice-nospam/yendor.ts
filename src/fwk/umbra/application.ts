/**
	Section: Application
*/
import * as Yendor from "../yendor/main";
import * as Core from "../core/main";
import * as con from "./constants";
import * as sce from "./scene";
import * as inp from "./input";
import {logger} from "./main";

export interface ApplicationOptions {
    consoleWidth?: number;
    consoleHeight?: number;
    defaultBackgroundColor?: Core.Color;
    defaultForegroundColor?: Core.Color;
    renderDivSelector?: string;
    fontFileName?: string;
    ticksPerSecond?: number;
    /**
        Field: backgroundAnimation
        Whether the scene should be rendered every frame or only after an update
    */
    backgroundAnimation?: boolean;
}
export class Application {
    protected console: Yendor.Console;
    protected _gameTime: number = 0;
    protected _elapsedTime: number = 0;
    protected options: ApplicationOptions;
    protected tickLength: number;
    protected paused: boolean = false;
    protected dirtyFrame: boolean = true;
    private static DEFAULT_OPTIONS: ApplicationOptions = {
        consoleWidth: con.DEFAULT_CONSOLE_WIDTH,
        consoleHeight: con.DEFAULT_CONSOLE_HEIGHT,
        defaultBackgroundColor: con.DEFAULT_BACKGROUND_COLOR,
        defaultForegroundColor: con.DEFAULT_FOREGROUND_COLOR,
        fontFileName: con.DEFAULT_FONT_FILE_NAME,
        renderDivSelector: con.DEFAULT_DIV_SELECTOR,
        ticksPerSecond: con.DEFAULT_TICKS_PER_SECOND
    };

    getConsole(): Yendor.Console {
        return this.console;
    }

    get gameTime() { return this._gameTime; }
    get elapsedTime() { return this._elapsedTime; }

    run(startingScene: sce.Scene, options: ApplicationOptions = Application.DEFAULT_OPTIONS): void {
        $(window).focus(this.onGainFocus.bind(this));
        $(window).blur(this.onLoseFocus.bind(this));
        this.options = <ApplicationOptions>{
            consoleWidth: options.consoleWidth ? options.consoleWidth : con.DEFAULT_CONSOLE_WIDTH,
            consoleHeight: options.consoleHeight ? options.consoleHeight : con.DEFAULT_CONSOLE_HEIGHT,
            defaultBackgroundColor: options.defaultBackgroundColor ? options.defaultBackgroundColor : con.DEFAULT_BACKGROUND_COLOR,
            defaultForegroundColor: options.defaultForegroundColor ? options.defaultForegroundColor : con.DEFAULT_FOREGROUND_COLOR,
            renderDivSelector: options.renderDivSelector ? options.renderDivSelector : con.DEFAULT_DIV_SELECTOR,
            fontFileName: options.fontFileName ? options.fontFileName : con.DEFAULT_FONT_FILE_NAME,
            ticksPerSecond: options.ticksPerSecond ? options.ticksPerSecond : con.DEFAULT_TICKS_PER_SECOND,
            backgroundAnimation : options.backgroundAnimation ? options.backgroundAnimation : con.DEFAULT_BACKGROUND_ANIMATION,
        };
        this.dirtyFrame = true;
        this.tickLength = 1.0 / this.options.ticksPerSecond;
        this.console = Yendor.createConsole(this.options.consoleWidth, this.options.consoleHeight,
            this.options.defaultForegroundColor, this.options.defaultBackgroundColor, this.options.renderDivSelector, this.options.fontFileName);
        sce.SceneManager.runScene(startingScene);
        Yendor.loop((time) => this.onNewFrame(time));
    }

    /**
        Function: onLoseFocus
        Called when the game window (or browser tab) loses focus
    */
    protected onLoseFocus(): void {
        this.paused = true;
    }

    /**
        Function: onGainFocus
        Called when the game window (or browser tab) gains focus
    */
    protected onGainFocus(): void {
        this.paused = false;
        inp.resetInput();
    }

    /**
        Function: onNewFrame
        Called when the browser renders a new animation frame
    */
    protected onNewFrame(time: number): void {
        try {
            this._elapsedTime = time - this._gameTime;
            let scene: sce.Scene = sce.SceneManager.getRunningScene();
            // but render every frame to allow background animations (torch flickering, ...)
            if (!this.paused && this.dirtyFrame) {
                scene.renderHierarchy(this.console);
                this.console.render();
                if ( !this.options.backgroundAnimation ) {
                    this.dirtyFrame = false;
                }
            }
            if (this._elapsedTime >= this.tickLength) {
                this._gameTime = time;
                // update the game only options.ticksPerSecond per second
                if (!this.paused) {
                    scene.updateHierarchy(time);
                    inp.resetInput();
                    this.dirtyFrame = true;
                }
            }
        } catch (err) {
            logger.critical(err);
        }
    }
}
