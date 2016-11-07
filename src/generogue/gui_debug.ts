/**
 * Section: GUI
 */
import * as Yendor from "../fwk/yendor/main";
import * as Umbra from "../fwk/umbra/main";
import * as Gui from "../fwk/gui/main";
import * as Map from "../fwk/map/main";
import * as Constants from "./base";

/**
 * =============================================================================
 * Group: debug menu
 * =============================================================================
 */
export class DebugMenu extends Gui.Widget {
    constructor() {
        super();
        this.showOnEventType(Constants.EVENT_OPEN_DEBUG_MENU);
        this.hide();

        let popup: Gui.Popup = this.addChild(new Gui.Popup({}));
        let frame: Gui.Frame = popup.addChild(new Gui.Frame({}));
        let vpanel: Gui.VPanel = frame.addChild(new Gui.VPanel({}));
        vpanel.addChild(this.mapRenderModeButton("dbg map transp", Map.MapRenderModeEnum.TRANSPARENCY));
        vpanel.addChild(this.mapRenderModeButton("dbg map light", Map.MapRenderModeEnum.LIGHTMAP));
        vpanel.addChild(this.mapRenderModeButton("dbg map fov", Map.MapRenderModeEnum.FOV));
        vpanel.addChild(this.mapRenderModeButton("dbg map all", Map.MapRenderModeEnum.ALL_SEEING_EYE));
        vpanel.addChild(this.mapRenderModeButton("dbg map normal", Map.MapRenderModeEnum.NORMAL));
        vpanel.addChild(new Gui.Button({
            autoHideWidget: this,
            callback: (_data) => {
                Umbra.SceneManager.getRunningScene().logSceneGraph();
                return true;
            },
            label: "log scene graph",
        }));
    }

    public onRender(_con: Yendor.Console) {
        this.center();
    }

    public onUpdate(_time: number): void {
    }

    private mapRenderModeButton(label: string, mode: Map.MapRenderModeEnum): Gui.Button {
        return new Gui.Button({
            autoHideWidget: this,
            callback: (_data) => {
                Map.Map.current.renderer.setRenderMode(mode);
                return true;
            },
            label: label,
        });
    }
}
