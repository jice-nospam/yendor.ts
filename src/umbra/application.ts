/*
	Section: Application
*/
module Umbra {
    "use strict";
    export interface ApplicationOptions {
        consoleWidth?: number;
        consoleHeight?: number;
        defaultBackgroundColor?: Core.Color;
        defaultForegroundColor?: Core.Color;
        renderDivSelector?: string;
        fontFileName?: string;
        ticksPerSecond?: number;
    }
    export class Application {
        protected console: Yendor.Console;
        protected gameTime: number = 0;
        protected options: ApplicationOptions;
        protected tickLength: number;
        protected paused: boolean = false;
        protected dirtyFrame: boolean = true;
        private static DEFAULT_OPTIONS: ApplicationOptions = {
            consoleWidth: DEFAULT_CONSOLE_WIDTH,
            consoleHeight: DEFAULT_CONSOLE_HEIGHT,
            defaultBackgroundColor: DEFAULT_BACKGROUND_COLOR,
            defaultForegroundColor: DEFAULT_FOREGROUND_COLOR,
            fontFileName: DEFAULT_FONT_FILE_NAME,
            renderDivSelector: DEFAULT_DIV_SELECTOR,
            ticksPerSecond: DEFAULT_TICKS_PER_SECOND
        };

        getConsole(): Yendor.Console {
            return this.console;
        }

        run(startingScene: Scene, options: ApplicationOptions = Application.DEFAULT_OPTIONS): void {
            $(window).focus(this.onGainFocus.bind(this));
            $(window).blur(this.onLoseFocus.bind(this));
            Input.application = this;
            this.options = <ApplicationOptions>{
                consoleWidth: options.consoleWidth ? options.consoleWidth : DEFAULT_CONSOLE_WIDTH,
                consoleHeight: options.consoleHeight ? options.consoleHeight : DEFAULT_CONSOLE_HEIGHT,
                defaultBackgroundColor: options.defaultBackgroundColor ? options.defaultBackgroundColor : DEFAULT_BACKGROUND_COLOR,
                defaultForegroundColor: options.defaultForegroundColor ? options.defaultForegroundColor : DEFAULT_FOREGROUND_COLOR,
                renderDivSelector: options.renderDivSelector ? options.renderDivSelector : DEFAULT_DIV_SELECTOR,
                fontFileName: options.fontFileName ? options.fontFileName : DEFAULT_FONT_FILE_NAME,
                ticksPerSecond: options.ticksPerSecond ? options.ticksPerSecond : DEFAULT_TICKS_PER_SECOND
            };
            this.tickLength = 1.0 / this.options.ticksPerSecond;
            this.console = Yendor.createConsole(this.options.consoleWidth, this.options.consoleHeight,
                this.options.defaultForegroundColor, this.options.defaultBackgroundColor, this.options.renderDivSelector, this.options.fontFileName);
            SceneManager.runScene(startingScene);
            Yendor.loop(this.onNewFrame.bind(this));
        }

		/*
			Function: onLoseFocus
			Called when the game window (or browser tab) loses focus
		*/
        protected onLoseFocus(): void {
            this.paused = true;
            console.log("umbra: focus lost");
        }

		/*
			Function: onGainFocus
			Called when the game window (or browser tab) gains focus
		*/
        protected onGainFocus(): void {
            this.paused = false;
            Umbra.Input.resetInput();
            console.log("umbra: focus gained");
        }

		/*
			Function: onNewFrame
			Called when the browser renders a new animation frame
		*/
        protected onNewFrame(time: number): void {
            var elapsed: number = time - this.gameTime;
            var scene: Scene = SceneManager.getRunningScene();
            // but render every frame to allow background animations (torch flickering, ...)
            if (!this.paused) {
                scene.renderHierarchy(this.console);
                this.console.render();
            }
            if (elapsed >= this.tickLength) {
                this.gameTime = time;
                // update the game only options.ticksPerSecond per second
                if (!this.paused) {
                    // TODO remove this cyclic dependency
                    Gizmo.initFrame();
                    scene.updateHierarchy(time);
                    Umbra.Input.resetInput();
                }
            }
        }
    }
}
