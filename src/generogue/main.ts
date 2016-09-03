import * as Umbra from "../fwk/umbra/main";
import {Engine} from "./engine";
import {Constants} from "./base";
/**
    This function is called when the document has finished loading in the browser.
    It creates the root console, register the keyboard and mouse event callbacks, and starts the frame rendering loop.
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
        let engine = new Engine();
        app.run(engine, {consoleWidth: Constants.CONSOLE_WIDTH, consoleHeight: Constants.CONSOLE_HEIGHT});
    } catch (e) {
        Umbra.logger.critical("ERROR in " + e.fileName + ":" + e.lineNumber + " : " + e.message);
        Umbra.logger.critical(e.stack);
    }
});
