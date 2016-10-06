import * as $ from "jquery";
import * as Umbra from "../fwk/umbra/main";
import {Engine} from "./engine";
/**
 * This function is called when the document has finished loading in the browser.
 * It creates the root console, register the keyboard and mouse event callbacks, and starts the frame rendering loop.
 */
$(function() {
    let app: Umbra.Application;
    try {
        app = new Umbra.Application();
        Umbra.init(app);
    } catch (e) {
        console.log("ERROR in " + e.fileName + ":" + e.lineNumber + " : " + e.message);
        console.log(e.stack);
        return;
    }
    try {
        const CONSOLE_WIDTH: number = 80;
        const CONSOLE_HEIGHT: number = 34;
        // to get console size within application, use Umbra.application.getConsole().width/height
        let engine = new Engine();
        app.run(engine, {
            consoleHeight: CONSOLE_HEIGHT,
            consoleWidth: CONSOLE_WIDTH,
        });
    } catch (e) {
        Umbra.logger.critical("ERROR in " + e.fileName + ":" + e.lineNumber + " : " + e.message);
        Umbra.logger.critical(e.stack);
    }
});
