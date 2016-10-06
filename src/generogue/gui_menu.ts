/**
 * Section: GUI
 */
import * as Yendor from "../fwk/yendor/main";
import * as Umbra from "../fwk/umbra/main";
import * as Gui from "../fwk/gui/main";
import * as Constants from "./base";

/**
 * =============================================================================
 * Group: main menu
 * =============================================================================
 */
export class MainMenu extends Gui.Widget {
    constructor() {
        super();
        this.showOnEventType(Constants.EVENT_OPEN_MAIN_MENU);
        this.hide();

        let popup: Gui.Popup = this.addChild(new Gui.Popup({}));
        let frame: Gui.Frame = popup.addChild(new Gui.Frame({}));
        let vpanel: Gui.VPanel = frame.addChild(new Gui.VPanel({}));
        vpanel.addChild(new Gui.Button({
            autoHideWidget: this,
            callback: (_data) => {Umbra.SceneManager.getRunningScene().logSceneGraph(); return true; },
            label: "Resume game",
            textAlign: Gui.TextAlignEnum.CENTER,
        }));
        vpanel.addChild(new Gui.Button({
            autoHideWidget: this,
            eventType: Constants.EVENT_NEW_GAME,
            label: "New game",
            textAlign: Gui.TextAlignEnum.CENTER,
        }));
        if ( Yendor.urlParams[Umbra.URL_PARAM_DEBUG]) {
            vpanel.addChild(new Gui.Button({
                autoHideWidget: this,
                eventType: Constants.EVENT_OPEN_DEBUG_MENU,
                label: "debug",
                textAlign: Gui.TextAlignEnum.CENTER,
            }));
        }
    }
    public onRender(_con: Yendor.Console) {
        this.center();
    }

    public onUpdate(_time: number): void {
    }
}
