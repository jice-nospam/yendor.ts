/**
 * Section: GUI
 */
import * as Yendor from "../fwk/yendor/main";
import * as Gui from "../fwk/gui/main";
import * as Actors from "../fwk/actors/main";
import {SlotContainerPanel, MultiSlotContainerPanel} from "./gui_inventory";
import {NumberSelector} from "./gui_input_number";

/**
 * =============================================================================
 * Group: inventory
 * =============================================================================
 */
export class LootPanel extends Gui.Widget implements Actors.ILootHandler {
    private looter: Actors.Actor;
    private looted: Actors.Actor[]|Actors.Actor;
    private looterPanel: SlotContainerPanel;
    private lootedPanel: MultiSlotContainerPanel;

    constructor(private numberSelector: NumberSelector) {
        super();
        this.setModal();
    }

    public onInit() {
        super.onInit();
        this.hide();

        let popup: Gui.Popup = this.addChild(new Gui.Popup({cancelAction: this.onCancel.bind(this)}));
        let hpanel: Gui.HPanel = popup.addChild(new Gui.HPanel({}));
        this.looterPanel = hpanel.addChild(new SlotContainerPanel(this.numberSelector));
        this.lootedPanel = hpanel.addChild(new MultiSlotContainerPanel(this.numberSelector));
    }

    public lootContainer(looter: Actors.Actor, looted: Actors.Actor[]|Actors.Actor) {
        this.looter = looter;
        this.looted = looted;
        this.looterPanel.initForCreature(looter, this.onSelectLooterItem.bind(this));
        this.lootedPanel.initForCreatures(looted, this.onSelectLootedItem.bind(this));
        this.show();
    }

    public onRender(_destination: Yendor.Console) {
        this.center();
    }

    private onSelectLooterItem(item: Actors.Actor) {
        item.pickable.pick(item, this.lootedPanel.getCurrentContainer(), true);
    }

    private onSelectLootedItem(item: Actors.Actor) {
        item.pickable.pick(item, this.looter, true);
    }

    private onCancel(): boolean {
        Gui.Draggable.resetDrag();
        return true;
    }
}
