/**
	Section: GUI
*/
module Game {
    "use strict";

	/********************************************************************************
	 * Group: inventory
	 ********************************************************************************/
    export interface ItemListener {
        (item: Actor): void;
    }
    export interface OpenInventoryEventData {
        /** custom title for the inventory window */
        title: string;
        /** listener to call when an actor is selected */
        itemListener?: ItemListener;
        /** event to publish when an actor is selected (associated data = the selected actor) */
        eventType?: EventType;
        /** display only items of this class */
        itemClassFilter?: string;
    }

    export class InventoryPanel extends Gizmo.Widget implements Umbra.EventListener {
        private selectedItem: number;
        private itemListener: ItemListener;
        private eventType: EventType;
		/**
			Property: inventory
			Stacked list of items
		*/
        private inventory: Actor[][];
        private title: string;
        private capacityMessage: string;
        private buttons: Gizmo.ButtonOption[];

        constructor() {
            super();
            this.hide();
            this.showOnEventType(EventType[EventType.OPEN_INVENTORY], function(data: OpenInventoryEventData) {
                this.itemListener = data.itemListener;
                this.eventType = data.eventType;
                this.title = data.title + " - ESC to close";
                let player: Actor = Engine.instance.actorManager.getPlayer();
                this.capacityMessage = "capacity " + (Math.floor(10 * player.container.computeTotalWeight()) / 10)
                    + "/" + player.container.capacity;
                this.buildStackedInventory(player.container, data.itemClassFilter);
            }.bind(this));
        }

        onRender(destination: Yendor.Console) {
            let bbox: Core.Rect = Gizmo.popupMenu(this, destination, this.buttons, this.title, this.capacityMessage);
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

        private buildStackedInventory(container: Container, itemClassFilter?: string) {
            let player: Actor = Engine.instance.actorManager.getPlayer();
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

        private createButtons(): Gizmo.ButtonOption[] {
            let options: Gizmo.ButtonOption[] = [];
            for (let i: number = 0, len: number = this.inventory.length; i < len; ++i) {
                let itemStack: Actor[] = this.inventory[i];
                let item: Actor = itemStack[0];
                options.push({
                    label: this.computeItemLabel(item, itemStack.length),
                    autoHideWidget: this,
                    eventType: this.eventType ? EventType[this.eventType] : undefined,
                    callback: this.itemListener ? this.itemListener.bind(this) : undefined,
                    eventData: item,
                    asciiShortcut: "a".charCodeAt(0) + item.pickable.shortcut
                });
            }
            return options;
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
}
