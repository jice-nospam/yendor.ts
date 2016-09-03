/**
	Section: GUI
*/
import * as Core from "../fwk/core/main";
import * as Yendor from "../fwk/yendor/main";
import * as Umbra from "../fwk/umbra/main";
import * as Gui from "../fwk/gui/main";
import * as Actors from "../fwk/actors/main";
import {Actor, SpecialActors} from "../fwk/actors/main";
import {Constants} from "./base";

/********************************************************************************
 * Group: inventory
 ********************************************************************************/
export class InventoryPanel extends Gui.Widget implements Umbra.EventListener, Actors.InventoryItemPicker {
    private selectedItem: number;
    private owner: Actor;
    /**
        Property: inventory
        Stacked list of items
    */
    private inventory: Actor[][];
    private title: string;
    private capacityMessage: string;
    private buttons: Gui.ButtonOption[];
    private resolve: (value?: Actors.Actor) => void;

    constructor() {
        super();
        this.hide();
    }

    pickItemFromInventory(title: string, wearer: Actors.Actor, itemClassFilter?: string): Promise<Actor> {
        return new Promise<Actors.Actor>((resolve) => {
            this.resolve = resolve;
            this.owner = wearer;
            this.title = title + " - ESC to close";
            this.capacityMessage = "capacity " + (Math.floor(10 * this.owner.container.computeTotalWeight()) / 10)
                + "/" + this.owner.container.capacity;
            this.buildStackedInventory(this.owner.container, itemClassFilter);
            this.show();
        });
    }

    hide() {
        super.hide();
    }

    onRender(destination: Yendor.Console) {
        let bbox: Core.Rect = Gui.popupMenu(this, destination, this.buttons, this.title, this.capacityMessage);
        for (let i: number = 0, len: number = this.inventory.length; i < len; ++i) {
            let list: Actor[] = this.inventory[i];
            let item: Actor = list[0];
            this.renderItemColors(destination, item, i, bbox.x, bbox.y + 1 + i);
        }
    }

    onUpdate(time: number): void {
    }

    private computeItemLabel(item: Actor, count: number = 1) {
        let itemDescription = "(" + String.fromCharCode(item.pickable.shortcut + "a".charCodeAt(0)) + ") " + item.ch + " ";
        if (count > 1) {
            itemDescription += count + " ";
        }
        itemDescription += item.getDescription();
        return itemDescription;
    }

    private renderItemColors(con: Yendor.Console, item: Actor, entryNum: number, x: number, y: number) {
        if (entryNum === this.selectedItem) {
            con.clearBack(Constants.INVENTORY_BACKGROUND_ACTIVE, x, y, -1, 1);
            con.clearFore(Constants.INVENTORY_FOREGROUND_ACTIVE, x, y, -1, 1);
        }
        if (item.equipment && item.equipment.isEquipped()) {
            con.clearBack(Constants.INVENTORY_BACKGROUND_EQUIPPED, x + 2, y, 3, 1);
        }
        con.fore[x + 6][y] = item.col;
    }

    private isShortcutAvailable(shortcut: number): boolean {
        for (let i: number = 0, len: number = this.inventory.length; i < len; ++i) {
            let itemStack: Actor[] = this.inventory[i];
            if (itemStack[0].pickable.shortcut === shortcut) {
                return false;
            }
        }
        return true;
    }

    /**
             Function: getFreeShortcut

            Returns:
            the first available shortcut
    */
    private getFreeShortcut(): number {
        let shortcut: number = 0;
        let available: boolean = true;
        do {
            available = this.isShortcutAvailable(shortcut);
            if (!available) {
                shortcut++;
            }
        } while (!available);
        return shortcut;
    }

    private addItemToStack(item: Actor): boolean {
        for (let j: number = 0, invlen: number = this.inventory.length; j < invlen; ++j) {
            if (this.inventory[j][0].name === item.name) {
                item.pickable.shortcut = this.inventory[j][0].pickable.shortcut;
                this.inventory[j].push(item);
                return true;
            }
        }
        return false;
    }

    private buildStackedInventory(container: Actors.Container, itemClassFilter?: string) {
        let player: Actor = Actor.specialActors[SpecialActors.PLAYER];
        this.inventory = [];
        for (let i: number = 0, len: number = player.container.size(); i < len; ++i) {
            let item: Actor = player.container.get(i);
            if (!itemClassFilter || item.isA(itemClassFilter)) {
                let found: boolean = item.isStackable() && this.addItemToStack(item);
                if (!found) {
                    let itemTab: Actor[] = [];
                    itemTab.push(item);
                    this.inventory.push(itemTab);
                }
            }
        }
        this.inventory.sort(function(a: Actor[], b: Actor[]) { return a[0].name.localeCompare(b[0].name); });
        this.defineShortcuts();
        this.buttons = this.createButtons();
    }

    private createButtons(): Gui.ButtonOption[] {
        let options: Gui.ButtonOption[] = [];
        for (let i: number = 0, len: number = this.inventory.length; i < len; ++i) {
            let itemStack: Actor[] = this.inventory[i];
            let item: Actor = itemStack[0];
            options.push({
                label: this.computeItemLabel(item, itemStack.length),
                autoHideWidget: this,
                //eventType: this.eventType ? EventType[this.eventType] : undefined,
                //callback: this.itemListener ? this.itemListener.bind(this) : undefined,
                callback: this.selectItem.bind(this),
                eventData: item,
                asciiShortcut: "a".charCodeAt(0) + item.pickable.shortcut
            });
        }
        return options;
    }

    private selectItem(item: Actors.Actor) {
        this.resolve(item);
    }

    private defineShortcuts() {
        for (let i: number = 0; i < this.inventory.length; i++) {
            let itemStack: Actor[] = this.inventory[i];
            if (itemStack[0].pickable.shortcut === undefined) {
                itemStack[0].pickable.shortcut = this.getFreeShortcut();
            }
        }
    }
}
