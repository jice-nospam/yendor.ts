define(["require", "exports", "jquery", "../fwk/umbra/main", "../fwk/gui/main", "../fwk/actors/main", "./scene_title", "./constants"], function (require, exports, $, Umbra, Gui, Actors, scene_title_1, Constants) {
    "use strict";
    /**
     * This function is called when the document has finished loading in the browser.
     * It creates the root console, register the keyboard and mouse event callbacks, and starts the frame rendering loop.
     */
    $(function () {
        let app;
        try {
            app = new Umbra.Application();
            Umbra.init(app);
        }
        catch (e) {
            console.log("ERROR in " + e.fileName + ":" + e.lineNumber + " : " + e.message);
            console.log(e.stack);
            return;
        }
        try {
            const CONSOLE_WIDTH = 80;
            const CONSOLE_HEIGHT = 50;
            Gui.setConfiguration({
                color: {
                    background: Constants.MENU_BACKGROUND,
                    backgroundActive: Constants.MENU_BACKGROUND_ACTIVE,
                    backgroundDisabled: Constants.MENU_BACKGROUND,
                    foreground: Constants.MENU_FOREGROUND,
                    foregroundActive: Constants.MENU_FOREGROUND_ACTIVE,
                    foregroundDisabled: Constants.MENU_FOREGROUND_DISABLED,
                    titleForeground: Constants.TITLE_FOREGROUND,
                },
                input: {
                    cancelAxisName: Actors.PlayerActionEnum[Actors.PlayerActionEnum.CANCEL],
                    focusNextWidgetAxisName: Actors.PlayerActionEnum[Actors.PlayerActionEnum.MOVE_SOUTH],
                    focusPreviousWidgetAxisName: Actors.PlayerActionEnum[Actors.PlayerActionEnum.MOVE_NORTH],
                    validateAxisName: Actors.PlayerActionEnum[Actors.PlayerActionEnum.VALIDATE],
                },
            });
            let startScene = new scene_title_1.TitleScene();
            app.run(startScene, {
                consoleHeight: CONSOLE_HEIGHT,
                consoleWidth: CONSOLE_WIDTH,
            });
        }
        catch (e) {
            Umbra.logger.critical("ERROR in " + e.fileName + ":" + e.lineNumber + " : " + e.message);
            Umbra.logger.critical(e.stack);
        }
    });
});
//# sourceMappingURL=main.js.map