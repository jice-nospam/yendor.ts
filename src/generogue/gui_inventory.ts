/**
 * Section: GUI
 */
import * as Yendor from "../fwk/yendor/main";
import * as Umbra from "../fwk/umbra/main";
import * as Gui from "../fwk/gui/main";
import * as Actors from "../fwk/actors/main";
import {NumberSelector} from "./gui_input_number";
import {ACTOR_TYPES} from "./config_actors";
import {
    CONTAINER_SCREEN_MIN_WIDTH,
    CONTAINER_SCREEN_MIN_HEIGHT,
    EVENT_CHANGE_STATUS,
    INVENTORY_MANIPULATION_TIME,
    GameStatus,
} from "./base";

/**
 * =============================================================================
 * Group: inventory
 * =============================================================================
 */
/**
 * Class: ContainerPanel
 * Display the content of a container (bag or creature inventory).
 * Player can drag items and navigate sub-containers
 */
export class ContainerPanel extends Gui.Widget {
    private static CATEGORIES: string[] =
        [ACTOR_TYPES.CONTAINER, ACTOR_TYPES.WEAPON, ACTOR_TYPES.FLASK, ACTOR_TYPES.SCROLL, ACTOR_TYPES.LIGHT];

    private owner: Actors.Actor;
    /**
     * Property: inventory
     * Stacked list of items
     */
    private inventory: Actors.Actor[][];
    private rootActor: Actors.Actor;
    private itemClassFilter: string|undefined;
    private itemPanel: Gui.VPanel;
    private resolve: (value: Actors.Actor) => void;
    private autoHideWidget: Gui.Widget|undefined;

    constructor(private numberSelector: NumberSelector) {
        super();
    }

    public onInit() {
        super.onInit();
        this.itemPanel = this.addChild(new Gui.VPanel({
            minHeight: CONTAINER_SCREEN_MIN_HEIGHT,
            minWidth: CONTAINER_SCREEN_MIN_WIDTH,
        }));
    }

    public initFromContainer(wearer: Actors.Actor, resolve: (value: Actors.Actor) => void, autoHideWidget?: Gui.Widget,
                             itemClassFilter?: string) {
        this.owner = wearer;
        this.rootActor = wearer;
        this.itemClassFilter = itemClassFilter;
        this.resolve = resolve;
        this.autoHideWidget = autoHideWidget;
        this.buildStackedInventory(this.owner.container, itemClassFilter);
        this.show();
    }

    public onUpdate(_time: number): void {
        if (! Gui.Draggable.isDragging()) {
            this.buildStackedInventory(this.rootActor.container, this.itemClassFilter);
            this.itemPanel.initHierarchy();
        }
    }

    private displayParentContainer() {
        if ( this.rootActor.pickable ) {
            let container = Actors.Actor.fromId(this.rootActor.pickable.containerId);
            if ( container ) {
                this.setRootActor(container);
            }
        }
    }

    private computeItemLabel(item: Actors.Actor, count: number = 1, pad: string = ""): string {
        let itemDescription = item.ch + " ";
        if (count > 1) {
            itemDescription += count + " ";
        }
        itemDescription += item.getDescription(count);
        return pad + itemDescription;
    }

    private addItemToStack(item: Actors.Actor): boolean {
        for (let itemStack of this.inventory) {
            if (itemStack[0].name === item.name) {
                itemStack.push(item);
                return true;
            }
        }
        return false;
    }

    private buildStackedInventory(container: Actors.Container, itemClassFilter?: string) {
        this.inventory = [];
        for (let i: number = 0, len: number = container.size(); i < len; ++i) {
            let item: Actors.Actor|undefined = container.get(i);
            if (item && (!itemClassFilter || item.isA(itemClassFilter))) {
                let found: boolean = item.isStackable() && this.addItemToStack(item);
                if (!found) {
                    let itemTab: Actors.Actor[] = [];
                    itemTab.push(item);
                    this.inventory.push(itemTab);
                }
            }
        }
        this.inventory.sort(this.compareActors.bind(this));
        this.createButtons();
    }

    /**
     * Function: compareActors
     * comparator used to sort inventory
     */
    private compareActors(a: Actors.Actor[], b: Actors.Actor[]): number {
        let aLevel: number = this.getActorSortLevel(a[0], ContainerPanel.CATEGORIES);
        let bLevel: number = this.getActorSortLevel(b[0], ContainerPanel.CATEGORIES);
        let diff: number = aLevel - bLevel;
        if ( diff !== 0 ) {
            return Math.sign(diff);
        }
        return a[0].name.localeCompare(b[0].name);
    }

    private getActorSortLevel(a: Actors.Actor, categories: string[]): number {
        let i: number = 0;
        while (i < categories.length && !a.isA(categories[i])) {
            i++;
        }
        return i;
    }

    private createButtons() {
        this.itemPanel.clearChildren();
        let rootDragTarget: Gui.DragTarget = this.itemPanel.addChild(new Gui.DragTarget({
            data: this.rootActor,
            dropCallback: this.onDrop.bind(this),
        }));
        rootDragTarget.addChild(new Gui.Button({
            callback: this.selectItem.bind(this),
            eventData: this.rootActor,
            label: this.computeItemLabel(this.rootActor),
            postRender: this.postRenderItem.bind(this),
        }));
        for (let itemStack of this.inventory) {
            let item: Actors.Actor = itemStack[0];
            if (! item.equipment || !item.equipment.isEquipped()) {
                let draggableContainer: Gui.Widget = this.itemPanel;
                if ( item.container ) {
                    draggableContainer = this.itemPanel.addChild(new Gui.DragTarget({
                        data: item,
                        dropCallback: this.onDrop.bind(this),
                    }));
                }
                let draggable: Gui.Draggable = draggableContainer.addChild(new Gui.Draggable({
                    data: itemStack,
                }));
                draggable.addChild(new Gui.Button({
                    autoHideWidget: this.autoHideWidget,
                    callback: this.selectItem.bind(this),
                    eventData: item,
                    label: this.computeItemLabel(item, itemStack.length, " "),
                    postRender: this.postRenderItem.bind(this),
                }));
            }
        }
    }

    private onDrop(dropped: Gui.Draggable, _target: Gui.DragTarget, data: any) {
        let droppedActors: Actors.Actor[] = <Actors.Actor[]> dropped.getOptions().data;
        let targetActor: Actors.Actor = <Actors.Actor> data;
        if ( droppedActors.length > 1) {
            this.numberSelector.selectNumber("How many?", 0, droppedActors.length, 1).then((value: number) => {
                this.onDropItem(droppedActors, targetActor, value);
            });
        } else {
            this.onDropItem(droppedActors, targetActor, 1);
        }
    }

    private onDropItem(droppedActors: Actors.Actor[], targetActor: Actors.Actor, count: number) {
        let droppedActor: Actors.Actor = droppedActors[0];
        if ( droppedActor.pickable.containerId === targetActor.id) {
            let parentContainer: Actors.Actor|undefined = Actors.Actor.fromId(targetActor.pickable.containerId);
            if ( parentContainer ) {
                this.removeItemsFromContainer(droppedActors, parentContainer, targetActor, count);
                return;
            }
        } else {
            if (this.putItemsInContainer(droppedActors, targetActor, count, targetActor !== this.owner) === 0 ) {
                if ( targetActor === this.owner ) {
                    Umbra.logger.warn(Actors.transformMessage("You cannot take [the actor1].",
                        droppedActor));
                } else {
                    Umbra.logger.warn(Actors.transformMessage("You cannot put [the actor1] in [the actor2].",
                        droppedActor, targetActor));
                }
            }
        }
    }

    private removeItemsFromContainer(droppedActors: Actors.Actor[], parentContainer: Actors.Actor,
                                     targetActor: Actors.Actor, count: number) {
        let droppedCount: number = 0;
        for ( let i: number = 0; i < count; ++i) {
            if (droppedActors[i].pickable.pick(droppedActors[i], parentContainer, false)) {
                droppedCount ++;
            }
        }
        if ( droppedCount === 1 ) {
            this.owner.wait(INVENTORY_MANIPULATION_TIME);
            Umbra.EventManager.publishEvent(EVENT_CHANGE_STATUS, GameStatus.NEXT_TURN);
            Umbra.logger.info(Actors.transformMessage("You remove [the actor1] from [the actor2].",
                droppedActors[0], targetActor));
        } else if ( droppedCount > 1 ) {
            this.owner.wait(INVENTORY_MANIPULATION_TIME);
            Umbra.EventManager.publishEvent(EVENT_CHANGE_STATUS, GameStatus.NEXT_TURN);
            Umbra.logger.info(Actors.transformMessage("You remove"
                + droppedActors[0].getthename(droppedCount) + " from [the actor1].",
                targetActor));
        }
    }

    private putItemsInContainer(droppedActors: Actors.Actor[], targetActor: Actors.Actor,
                                count: number, withLog: boolean): number {
        let droppedCount: number = 0;
        for (let i: number = 0; i < count; ++i) {
            if (droppedActors[i].pickable.pick(droppedActors[i], targetActor, false)) {
                droppedCount ++;
            }
        }
        if ( withLog ) {
            if ( count === 1 ) {
                this.owner.wait(INVENTORY_MANIPULATION_TIME);
                Umbra.EventManager.publishEvent(EVENT_CHANGE_STATUS, GameStatus.NEXT_TURN);
                Umbra.logger.info(Actors.transformMessage("You put [the actor1] in [the actor2].",
                    droppedActors[0], targetActor));
            } else if ( count > 1 ) {
                this.owner.wait(INVENTORY_MANIPULATION_TIME);
                Umbra.logger.info(Actors.transformMessage("You put"
                    + droppedActors[0].getthename(count) + " in [the actor1].",
                    targetActor));
            }
        }
        return droppedCount;
    }

    private postRenderItem(con: Yendor.Console, x: number, y: number, options: Gui.IButtonOption, _active: boolean) {
        con.fore[x][y] = (<Actors.Actor> options.eventData).col;
        con.fore[x + 1][y] = (<Actors.Actor> options.eventData).col;
    }

    private setRootActor(actor: Actors.Actor) {
        this.rootActor = actor;
    }

    private selectItem(item: Actors.Actor): boolean {
        Gui.Draggable.resetDrag();
        if ( item.container ) {
            if ( item === this.rootActor ) {
                this.displayParentContainer();
            } else {
                this.setRootActor(item);
            }
        } else {
            if ( this.resolve ) {
                this.resolve(item);
                return true;
            }
        }
        return false;
    }
}

/**
 * Class: SlotsPanel
 * Display the available slots on a container with equiped items
 */
export class SlotsPanel extends Gui.Widget {
    private owner: Actors.Actor;
    private slotWidth: number;
    private itemPanel: Gui.VPanel;
    private resolve: (value: Actors.Actor) => void;
    private autoHideWidget: Gui.Widget|undefined;

    constructor() {
        super();
    }

    public onInit() {
        super.onInit();
        this.itemPanel = this.addChild(new Gui.VPanel({}));
    }

    public initFromContainer(container: Actors.Actor, resolve: (value: Actors.Actor) => void,
                             autoHideWidget?: Gui.Widget) {
        this.owner = container;
        this.resolve = resolve;
        this.autoHideWidget = autoHideWidget;
        if (this.createButtons()) {
            this.show();
        }
    }

    public onUpdate(_time: number): void {
        if (! Gui.Draggable.isDragging()) {
            this.createButtons();
            this.itemPanel.initHierarchy();
        }
    }

    private createButtons(): boolean {
        this.itemPanel.clearChildren();
        let slots: string[]|undefined = this.owner.container.getSlots();
        if (! slots || slots.length === 0) {
            return false;
        }
        this.slotWidth = this.getSlotsWidth(this.owner.container);
        for (let slot of  slots) {
            let item: Actors.Actor|undefined = this.owner.container.getFromSlot(slot);
            if (item) {
                let draggableContainer: Gui.Widget = this.itemPanel;
                if ( item.container ) {
                    draggableContainer = this.itemPanel.addChild( new Gui.DragTarget({
                        data: item,
                        dropCallback: this.onDrop.bind(this),
                    }));
                }
                let draggable: Gui.Draggable = draggableContainer.addChild(new Gui.Draggable({
                    data: item,
                }));
                draggable.addChild(new Gui.Button({
                    autoHideWidget: this.autoHideWidget,
                    callback: this.selectItem.bind(this),
                    eventData: item,
                    label: this.computeEquippedItemLabel(slot, this.slotWidth, item, 1),
                    postRender: this.postRenderEquippedItem.bind(this),
                }));
            } else {
                this.itemPanel.addChild(new Gui.Button({
                    autoHideWidget: this.autoHideWidget,
                    label: this.computeEquippedItemLabel(slot, this.slotWidth, undefined, 1),
                    postRender: this.postRenderEquippedItem.bind(this),
                }));
            }
        }
        return true;
    }

    private onDrop(dropped: Gui.Draggable, _target: Gui.DragTarget, data: any) {
        let droppedActor: Actors.Actor = <Actors.Actor> dropped.getOptions().data;
        let targetActor: Actors.Actor = <Actors.Actor> data;
        // TODO equip by dragging
        if (droppedActor.pickable.pick(droppedActor, targetActor, false)) {
            this.owner.wait(INVENTORY_MANIPULATION_TIME);
            Umbra.EventManager.publishEvent(EVENT_CHANGE_STATUS, GameStatus.NEXT_TURN);
            if ( targetActor !== this.owner ) {
                Umbra.logger.info(Actors.transformMessage("You put [the actor1] in [the actor2].",
                    droppedActor, targetActor));
            }
            return;
        }
        if ( targetActor === this.owner ) {
            Umbra.logger.warn(Actors.transformMessage("You cannot take [the actor1].",
                droppedActor));
        } else {
            Umbra.logger.warn(Actors.transformMessage("You cannot put [the actor1] in [the actor2].",
                droppedActor, targetActor));
        }
    }

    private postRenderEquippedItem(con: Yendor.Console, x: number, y: number, options: Gui.IButtonOption,
                                   _active: boolean) {
        let item: Actors.Actor = <Actors.Actor> options.eventData;
        if (item) {
            con.fore[x + this.slotWidth + 2][y] = item.col;
        }
        con.text[x + this.slotWidth][y] = Yendor.CHAR_VLINE;
        con.fore[x + this.slotWidth][y] = Gui.getConfiguration().color.foregroundDisabled;
    }

    private getSlotsWidth(container: Actors.Container) {
        let w: number = 0;
        let slots: string[]|undefined = container.getSlots();
        if ( slots ) {
            for (let slot of slots) {
                if ( slot.length > w ) {
                    w = slot.length;
                }
            }
        }
        return w;
    }

    private computeEquippedItemLabel(slot: string, slotWidth: number, item: Actors.Actor|undefined,
                                     count: number): string {
        let itemDescription = slot;
        if ( item ) {
            let spaces: number = 2 + slotWidth - slot.length;
            while (spaces > 0) {
                itemDescription += " ";
                spaces--;
            }
            itemDescription += item.ch + " ";
            if (count > 1) {
                itemDescription += count + " ";
            }
            itemDescription += item.getDescription(count);
        }
        return itemDescription;
    }

    private selectItem(item: Actors.Actor): boolean {
        Gui.Draggable.resetDrag();
        if ( this.resolve ) {
            this.resolve(item);
        }
        return true;
    }
}

/**
 * Class: SlotContainerPanel
 * Associates a ContainerPanel and SlotsPanel for a creature or container
 */
export class SlotContainerPanel extends Gui.Widget {
    protected resolve: (value?: Actors.Actor) => void;
    protected frame: Gui.Frame;

    private owner: Actors.Actor;
    private containerPanel: ContainerPanel;
    private slotsPanel: SlotsPanel;
    private equipmentSeparator: Gui.HSeparator;

    constructor(private numberSelector: NumberSelector, private frameOption: Gui.IFrameOption = {}) {
        super();
    }

    public onInit() {
        super.onInit();
        this.frame = this.addChild(new Gui.Frame(this.frameOption));
        let vpanel: Gui.VPanel = this.frame.addChild(new Gui.VPanel({}));
        this.containerPanel = vpanel.addChild(new ContainerPanel(this.numberSelector));
        this.equipmentSeparator = vpanel.addChild(new Gui.HSeparator("Equipment"));
        this.slotsPanel = vpanel.addChild(new SlotsPanel());
    }

    public initForCreature(wearer: Actors.Actor, resolve: (value: Actors.Actor) => void,
                           autoHideWidget?: Gui.Widget, itemClassFilter?: string) {
        this.resolve = resolve;
        this.owner = wearer;
        this.setFrameTitle(wearer.getthename() + " ");
        this.containerPanel.initFromContainer(wearer, resolve, autoHideWidget, itemClassFilter);
        this.slotsPanel.initFromContainer(wearer, resolve, autoHideWidget);
        if (wearer.container.getSlots() === undefined) {
            this.slotsPanel.hide();
            this.equipmentSeparator.hide();
        } else {
            this.slotsPanel.show();
            this.equipmentSeparator.show();
        }
        this.show();
    }

    public onUpdate(time: number) {
        super.onUpdate(time);
        this.setFrameFooter((Math.floor(10 * this.owner.container.computeTotalWeight()) / 10)
            + "/" + this.owner.container.capacity);
    }

    public setFrameTitle(title: string) {
        (<Gui.IFrameOption> this.frame.getOptions()).title = title;
    }

    public getFrameTitle(): string|undefined {
        return (<Gui.IFrameOption> this.frame.getOptions()).title;
    }

    public setFrameFooter(footer: string) {
        (<Gui.IFrameOption> this.frame.getOptions()).footer = footer;
    }
}

export class MultiSlotContainerPanel extends SlotContainerPanel {
    private creatures: Actors.Actor[];
    private currentCreature: number = 0;
    private autoHideWidget: Gui.Widget|undefined;
    private itemClassFilter: string|undefined;
    private nextItemButton: Gui.Button;
    private prevItemButton: Gui.Button;

    constructor(numberSelector: NumberSelector, frameOption: Gui.IFrameOption = {}) {
        super(numberSelector, frameOption);
    }

    public onInit() {
        super.onInit();
        this.nextItemButton = this.addChild(new Gui.Button({
            callback: this.nextCreature.bind(this),
            label: ">",
        }));
        this.nextItemButton.setZOrder(this.getZOrder() + 1);
        this.nextItemButton.setExpandFlag(Umbra.ExpandEnum.NONE);
        this.prevItemButton = this.addChild(new Gui.Button({
            callback: this.prevCreature.bind(this),
            label: "<",
        }));
        this.prevItemButton.setZOrder(this.getZOrder() + 1);
        this.prevItemButton.setExpandFlag(Umbra.ExpandEnum.NONE);
    }

    public getCurrentContainer(): Actors.Actor {
        return this.creatures[this.currentCreature];
    }

    public initForCreatures(creatures: Actors.Actor[]|Actors.Actor, resolve: (value: Actors.Actor) => void,
                            autoHideWidget?: Gui.Widget, itemClassFilter?: string) {
        this.creatures = Array.isArray(creatures) ? creatures : [creatures];
        this.resolve = resolve;
        this.autoHideWidget = autoHideWidget;
        this.itemClassFilter = itemClassFilter;
        this.setCurrentCreature(0);
    }
    private setCurrentCreature(index: number) {
        this.currentCreature = index;
        super.initForCreature(this.creatures[index], this.resolve, this.autoHideWidget, this.itemClassFilter);
        if (this.creatures.length > 1) {
            let title: string = this.creatures[index].getthename() + " " + (index + 1) + "/"
                + this.creatures.length + " ";
            this.setFrameTitle(title);
            this.nextItemButton.hide();
            this.prevItemButton.hide();
            this.computeBoundingBox();
            this.nextItemButton.moveTo(Math.floor((this.boundingBox.w + title.length) / 2) - 1, 0);
            this.prevItemButton.moveTo(Math.floor((this.boundingBox.w - title.length) / 2), 0);
            this.prevItemButton.show();
            this.nextItemButton.show();
        } else {
            this.nextItemButton.hide();
            this.prevItemButton.hide();
        }
    }

    private nextCreature(_data: any): boolean {
        this.setCurrentCreature((this.currentCreature + 1) % this.creatures.length);
        return true;
    }

    private prevCreature(_data: any): boolean {
        this.setCurrentCreature(this.currentCreature === 0 ? this.creatures.length - 1 : this.currentCreature - 1);
        return true;
    }
}

export class InventoryPanel extends Gui.Widget implements Actors.IInventoryItemPicker {
    private panel: SlotContainerPanel;

    constructor(private numberSelector: NumberSelector) {
        super();
        this.setModal();
    }

    public onInit() {
        super.onInit();
        let popup: Gui.Popup = this.addChild(new Gui.Popup({cancelAction: this.onCancel.bind(this)}));
        this.panel = popup.addChild(new SlotContainerPanel(this.numberSelector, {
            leftButton: {
                label: "Close",
                autoHideWidget: this,
            },
        }));
        this.hide();
    }

    public pickItemFromInventory(title: string, wearer: Actors.Actor, itemClassFilter?: string): Promise<Actors.Actor> {
        return new Promise<Actors.Actor>((resolve) => {
            this.panel.initForCreature(wearer, resolve, this, itemClassFilter);
            this.panel.setFrameTitle(title + " - ESC to close");
            this.show();
        });
    }

    public onRender(_destination: Yendor.Console) {
        this.center();
    }

    private onCancel(): boolean {
        Gui.Draggable.resetDrag();
        return true;
    }

}
