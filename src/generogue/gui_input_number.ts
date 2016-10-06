/**
 * Section: GUI
 */
import * as Yendor from "../fwk/yendor/main";
import * as Gui from "../fwk/gui/main";
import * as Actors from "../fwk/actors/main";

/**
 * =============================================================================
 * Group: input
 * =============================================================================
 */

/**
 * Class: InputNumber
 * A background Gui that sleeps until selectNumber is called.
 * It then displays a popup with a slider.
 * Then it resolves the promise with the selected number.
 */
export class NumberSelector extends Gui.Widget implements Actors.INumberSelector {
    private resolve: (value?: number) => void;
    private frame: Gui.Frame;
    private slider: Gui.Slider;
    private label: Gui.Label<Gui.ILabelOption>;

    constructor() {
        super();
        this.setModal();
    }

    public onInit() {
        super.onInit();
        let popup: Gui.Popup = this.addChild(new Gui.Popup({cancelAction: this.onCancel.bind(this)}));
        this.frame = popup.addChild(new Gui.Frame({}));
        let vpanel: Gui.VPanel = this.frame.addChild(new Gui.VPanel({}));
        this.label = vpanel.addChild(new Gui.Label<Gui.ILabelOption>({label: "0"}));
        this.slider = vpanel.addChild(new Gui.Slider({maxValue: 0, minValue: 0}));
        vpanel.addChild(new Gui.Button({
            autoHideWidget: this,
            callback: this.onPressOk.bind(this),
            label: "Ok",
            textAlign: Gui.TextAlignEnum.CENTER,
        }));
        this.hide();
    }

    public onRender(_destination: Yendor.Console) {
        this.center();
    }

    public onUpdate(time: number) {
        super.onUpdate(time);
        this.label.getOptions().label = Math.floor(this.slider.getValue()).toFixed(0);
    }

    public selectNumber( message: string, minValue: number, maxValue: number, initialValue?: number): Promise<number> {
        return new Promise<number>((resolve) => {
            this.resolve = resolve;
            (<Gui.IFrameOption> this.frame.getOptions()).title = message;
            this.slider.getOptions().minValue = minValue;
            this.slider.getOptions().maxValue = maxValue;
            this.slider.setValue(initialValue === undefined ? minValue : initialValue);
            this.show();
        });
    }

    private onPressOk(_data: any): boolean {
        this.resolve(Math.floor(this.slider.getValue()));
        return true;
    }

    private onCancel(): boolean {
        // Gui.Draggable.resetDrag();
        return true;
    }
}
