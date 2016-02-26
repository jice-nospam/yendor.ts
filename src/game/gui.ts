/*
	Section: GUI
*/
module Game {
    "use strict";

	/********************************************************************************
	 * Group: generic GUI stuff
	 ********************************************************************************/
    export class GuiManager {
        private guis: { [index: string]: Gui; } = {};
        addGui(gui: Gui, name: string, x?: number, y?: number) {
            if (x !== undefined && y !== undefined) {
                gui.moveTo(x, y);
            }
            this.guis[name] = gui;
        }

        getGui(name: string): Gui {
            return this.guis[name];
        }

        renderGui(rootConsole: Yendor.Console) {
            for (var guiName in this.guis) {
                if (this.guis.hasOwnProperty(guiName)) {
                    var gui: Gui = this.guis[guiName];
                    if (gui.isVisible()) {
                        gui.render(rootConsole);
                    }
                }
            }
        }

        createStatusPanel() {
            var statusPanel: Gui = new StatusPanel(Constants.CONSOLE_WIDTH, Constants.STATUS_PANEL_HEIGHT);
            statusPanel.show();
            this.addGui(statusPanel, Constants.STATUS_PANEL_ID, 0, Constants.CONSOLE_HEIGHT - Constants.STATUS_PANEL_HEIGHT);
        }

        createOtherGui() {
            var inventoryPanel: Gui = new InventoryPanel(Constants.INVENTORY_PANEL_WIDTH, Constants.INVENTORY_PANEL_HEIGHT);
            this.addGui(inventoryPanel, Constants.INVENTORY_ID, Math.floor(Constants.CONSOLE_WIDTH / 2 - Constants.INVENTORY_PANEL_WIDTH / 2), 0);

            var tilePicker: Gui = new TilePicker();
            this.addGui(tilePicker, Constants.TILE_PICKER_ID);

            var mainMenu: Menu = new MainMenu();
            this.addGui(mainMenu, Constants.MAIN_MENU_ID);
        }
    }

    export class Gui extends Core.Position implements Umbra.EventListener {
        private static activeModal: Gui;

        enableEvents: boolean = true;

        protected __console: Yendor.Console;

        private _width: number;
        private _height: number;
        private _visible: boolean = false;
        private modal: boolean = false;

        static getActiveModal(): Gui { return Gui.activeModal; }

        constructor(_width: number, _height: number) {
            super();
            this._width = _width;
            this._height = _height;
            this.__console = new Yendor.Console(_width, _height);
        }

        get width() { return this._width; }
        get height() { return this._height; }

        isVisible() { return this._visible; }
        isModal() { return this.modal; }
        protected setModal() { this.modal = true; }
        set visible(newValue: boolean) { this._visible = newValue; }
        protected resize(width: number, height: number) {
            if (this.console.width !== width || this.console.height !== height) {
                this.__console = new Yendor.Console(width, height);
                this._width = width;
                this._height = height;
            }
        }

        show() {
            if (this.modal) {
                if (Gui.activeModal) {
                    Gui.activeModal.hide();
                }
                Gui.activeModal = this;
                Engine.instance.actorManager.pause();
            }
            this._visible = true;
        }
        hide() {
            if (this.modal) {
                Gui.activeModal = undefined;
                Engine.instance.actorManager.resume();
            }
            this._visible = false;
        }

        get console() { return this.__console; }

        clear() {
            // empty
        }

		/*
			Function: render
			To be overloaded by extending classes.
		*/
        render(destination: Yendor.Console) {
            this.__console.blit(destination, this.x, this.y);
        }
    }

	/********************************************************************************
	 * Group: status panel
	 ********************************************************************************/
    export class Message implements Persistent {
        className: string;
        private _color: Core.Color;
        private _text: string;
        constructor(_color: Core.Color, _text: string) {
            this.className = "Message";
            this._color = _color;
            this._text = _text;
        }

        get text() { return this._text; }
        get color() { return this._color; }
        darkenColor() {
            this._color = Core.ColorUtils.multiply(this._color, Constants.LOG_DARKEN_COEF);
        }
    }

    export class StatusPanel extends Gui implements Umbra.EventListener, Persistent {
        private static MESSAGE_X = Constants.STAT_BAR_WIDTH + 2;
        className: string;
        private messageHeight: number;
        private messages: Message[] = [];
        private mouseLookText: string = "";
        constructor(width: number, height: number) {
            super(width, height);
            this.className = "StatusPanel";
            this.messageHeight = height - 1;
            Umbra.EventManager.registerEventListener(this, EventType[EventType.LOG_MESSAGE]);
        }

        onLogMessage(msg: Message) {
            var lines = msg.text.split("\n");
            if (this.messages.length + lines.length > this.messageHeight) {
                this.messages.splice(0, this.messages.length + lines.length - this.messageHeight);
            }
            for (var i: number = 0; i < this.messages.length; ++i) {
                this.messages[i].darkenColor();
            }
            for (var j: number = 0; j < lines.length; ++j) {
                this.messages.push(new Message(msg.color, lines[j]));
            }
        }

        handleMouseMove() {
            var mousePos: Core.Position = Umbra.Input.getMouseCellPosition();
            if (Engine.instance.map.contains(mousePos.x, mousePos.y) && Engine.instance.map.isExplored(mousePos.x, mousePos.y)) {
                var actorsOnCell: Actor[] = Engine.instance.actorManager.filter(function(actor: Actor): boolean {
                    return actor.x === mousePos.x && actor.y === mousePos.y;
                });
                this.handleMouseLook(actorsOnCell, mousePos);
            }
        }

        render(destination: Yendor.Console) {
            this.console.clearBack(0x000000);
            this.console.clearText();
            var player: Player = Engine.instance.actorManager.getPlayer();
            this.handleMouseMove();
            this.console.print(0, 0, this.mouseLookText);
            this.renderBar(1, 1, Constants.STAT_BAR_WIDTH, "HP", player.destructible.hp,
                player.destructible.maxHp, Constants.HEALTH_BAR_BACKGROUND, Constants.HEALTH_BAR_FOREGROUND);
            this.renderBar(1, 2, Constants.STAT_BAR_WIDTH, "XP(" + player.xpLevel + ")", player.destructible.xp,
                player.getNextLevelXp(), Constants.XP_BAR_BACKGROUND, Constants.XP_BAR_FOREGROUND);
            this.renderConditions(player.ai.conditions);
            this.renderMessages();
            super.render(destination);
        }

        clear() {
            this.messages = [];
            this.mouseLookText = "";
        }

        private renderConditions(conditions: Condition[]) {
            if (!conditions) {
                return;
            }
            for (var i: number = 0, len: number = conditions.length; i < len && i < 4; ++i) {
                var cond: Condition = conditions[i];
                this.renderBar(1, 3 + i, Constants.STAT_BAR_WIDTH, cond.getName(),
                    cond.time, cond.initialTime, Constants.CONDITION_BAR_BACKGROUND,
                    Constants.CONDITION_BAR_FOREGROUND, false);
            }
        }

        private handleMouseLook(actors: Actor[], pos: Core.Position) {
            var len: number = actors.length;
            this.mouseLookText = "";
            if (Yendor.urlParams[Constants.URL_PARAM_DEBUG]) {
                this.mouseLookText = "topo:" + Engine.instance.topologyMap.getObjectId(pos) + "|";
            }

            for (var i: number = 0; i < len; ++i) {
                var actor: Actor = actors[i];
                if (Engine.instance.map.shouldRenderActor(actor)) {
                    if (i > 0) {
                        this.mouseLookText += ",";
                    }
                    this.mouseLookText += actor.getDescription();
                }
            }
        }

        private renderMessages() {
            for (var i: number = 0; i < this.messages.length; ++i) {
                var msg: Message = this.messages[i];
                this.console.print(StatusPanel.MESSAGE_X, i + 1, msg.text, msg.color);
            }
        }

        private renderBar(x: number, y: number, width: number, name: string, value: number,
            maxValue: number, foreColor: Core.Color, backColor: Core.Color, displayValues: boolean = true) {
            this.console.clearBack(backColor, x, y, width, 1);
            var barWidth = Math.floor(value / maxValue * width);
            if (barWidth > 0) {
                this.console.clearBack(foreColor, x, y, barWidth, 1);
            }
            var label: string = name;
            if (displayValues && maxValue !== -1) {
                label += " : " + Math.floor(value) + "/" + Math.floor(maxValue);
            }
            this.console.print(x + Math.floor((width - label.length) / 2), y, label);
        }
    }

	/********************************************************************************
	 * Group: inventory
	 ********************************************************************************/
    export interface ItemListener {
        (item: Actor): void;
    }
    export interface OpenInventoryEventData {
        title: string;
        itemListener: ItemListener;
    }

    export class InventoryPanel extends Gui {
        private title: string = "=== inventory - ESC to close ===";
        private selectedItem: number;
        private itemListener: ItemListener;
        enableEvents: boolean = true;
		/*
			Property: inventory
			Stacked list of items
		*/
        private inventory: Actor[][];

        constructor(width: number, height: number) {
            super(width, height);
            this.setModal();
            Umbra.EventManager.registerEventListener(this, EventType[EventType.OPEN_INVENTORY]);
        }

        onOpenInventory(data: OpenInventoryEventData) {
            this.itemListener = data.itemListener;
            this.title = "=== " + data.title + " - ESC to close ===";
            this.show();
        }

        checkKeyboardInput() {
            if (Umbra.Input.wasButtonPressed(PlayerAction[PlayerAction.CANCEL])) {
                this.hide();
                Umbra.Input.resetInput();
            } else {
                for (var keyCode: number = Umbra.KeyCode.DOM_VK_A; keyCode <= Umbra.KeyCode.DOM_VK_Z; ++keyCode) {
                    if (Umbra.Input.wasKeyPressed(keyCode)) {
                        var item: Actor = this.getByShortcut(keyCode - Umbra.KeyCode.DOM_VK_A);
                        if (item) {
                            this.selectItem(item);
                            break;
                        }
                    }
                }
            }
        }

        handleMouseMove() {
            if (Umbra.Input.wasMouseMoved()) {
                this.selectItemAtPos(Umbra.Input.getMouseCellPosition());
            }
        }

        private selectItemByIndex(index: number) {
            if (index >= 0 && index < this.inventory.length) {
                var item: Actor = this.inventory[index][0];
                this.selectItem(item);
            }
        }

        private selectItem(item: Actor) {
            this.hide();
            this.itemListener(item);
        }

        show() {
            super.show();
            var player: Actor = Engine.instance.actorManager.getPlayer();
            this.buildStackedInventory(player.container);
        }

        hide() {
            super.hide();
        }

        private selectItemAtPos(pos: Core.Position) {
            this.selectedItem = pos.y - (this.y + 1);
        }

        render(destination: Yendor.Console) {
            this.checkKeyboardInput();
            if (this.selectedItem !== undefined && Umbra.Input.wasMouseButtonReleased(Umbra.MouseButton.LEFT)) {
                this.selectItemByIndex(this.selectedItem);
                Umbra.Input.resetInput();
            }
            this.console.clearBack(Constants.INVENTORY_BACKGROUND);
            this.console.clearText();
            this.x = Math.floor(destination.width / 2 - this.width / 2);
            this.y = Math.floor(destination.height / 2 - this.height / 2);
            var y: number = 1;
            this.console.print(Math.floor(this.width / 2 - this.title.length / 2), 0, this.title);
            var player: Actor = Engine.instance.actorManager.getPlayer();
            this.handleMouseMove();
            for (var i: number = 0; i < this.inventory.length; i++) {
                var list: Actor[] = this.inventory[i];
                this.renderItem(list[0], i, y, list.length);
                y++;
            }
            var capacity: string = "capacity " + (Math.floor(10 * player.container.computeTotalWeight()) / 10)
                + "/" + player.container.capacity;
            this.console.print(Math.floor(this.width / 2 - capacity.length / 2), this.height - 1, capacity);
            super.render(destination);
        }

        private renderItem(item: Actor, entryNum: number, y: number, count: number = 1) {
            var itemDescription = "(" + String.fromCharCode(item.pickable.shortcut + "a".charCodeAt(0)) + ") " + item.ch + " ";
            if (count > 1) {
                itemDescription += count + " ";
            }
            itemDescription += item.getDescription();

            this.console.print(2, y, itemDescription, Constants.INVENTORY_FOREGROUND);
            if (entryNum === this.selectedItem) {
                this.console.clearBack(Constants.INVENTORY_BACKGROUND_ACTIVE, 0, y, -1, 1);
                this.console.clearFore(Constants.INVENTORY_FOREGROUND_ACTIVE, 0, y, -1, 1);
            }
            if (item.equipment && item.equipment.isEquipped()) {
                this.console.clearBack(Constants.INVENTORY_BACKGROUND_EQUIPPED, 5, y, 3, 1);
            }
            this.console.fore[6][y] = item.col;
        }

        private getByShortcut(shortcut: number): Actor {
            for (var i: number = 0; i < this.inventory.length; i++) {
                var list: Actor[] = this.inventory[i];
                if (list[0].pickable.shortcut === shortcut) {
                    return list[0];
                }
            }
            return undefined;
        }

        /*
              Function: getFreeShortcut

              Returns:
              the first available shortcut
        */
        private getFreeShortcut(): number {
            var shortcut: number = 0;
            var available: boolean = true;
            do {
                available = (this.getByShortcut(shortcut) === undefined);
                if (!available) {
                    shortcut++;
                }
            } while (!available);
            return shortcut;
        }

        private buildStackedInventory(container: Container) {
            var player: Actor = Engine.instance.actorManager.getPlayer();
            this.inventory = [];
            for (var i: number = 0; i < player.container.size(); ++i) {
                var item: Actor = player.container.get(i);
                var found: boolean = false;
                if (item.isStackable()) {
                    for (var j: number = 0; j < this.inventory.length; ++j) {
                        if (this.inventory[j][0].isStackable() && this.inventory[j][0].name === item.name) {
                            item.pickable.shortcut = this.inventory[j][0].pickable.shortcut;
                            this.inventory[j].push(item);
                            found = true;
                            break;
                        }
                    }
                }
                if (!found) {
                    var itemTab: Actor[] = [];
                    itemTab.push(item);
                    this.inventory.push(itemTab);
                }
            }
            this.inventory.sort(function(a: Actor[], b: Actor[]) { return a[0].name.localeCompare(b[0].name); });
            this.defineShortcuts();
        }

        private defineShortcuts() {
            for (var i: number = 0; i < this.inventory.length; i++) {
                var list: Actor[] = this.inventory[i];
                if (list[0].pickable.shortcut === undefined) {
                    list[0].pickable.shortcut = this.getFreeShortcut();
                }
            }
        }
    }

	/********************************************************************************
	 * Group: tilePicker
	 ********************************************************************************/

    export interface TilePickerEventData {
        origin?: Core.Position;
        // maximum distance from origin
        range?: number;
        // display some blast radius indicator around selected position
        radius?: number;
    }
	/*
		Class: TilePicker
		A background Gui that sleeps until it receives a PICK_TILE event containing a TilePickerListener.
		It then listens to mouse events until the player left-clicks a tile.
		Then it sends a TILE_SELECTED event containing the tile position.
	*/
    export class TilePicker extends Gui {
        private tilePos: Core.Position = new Core.Position();
        private tileIsValid: boolean = false;
        private data: TilePickerEventData;
        enableEvents: boolean = true;
        constructor() {
            super(Constants.CONSOLE_WIDTH, Constants.CONSOLE_HEIGHT);
            this.setModal();
            Umbra.EventManager.registerEventListener(this, EventType[EventType.PICK_TILE]);
        }

        render(console: Yendor.Console) {
            this.handleMouseMove();
            this.handleMouseClick();
            this.checkKeyboardInput();
            if (console.contains(this.tilePos)) {
                console.text[this.tilePos.x][this.tilePos.y] = this.tileIsValid ? "+".charCodeAt(0) : "x".charCodeAt(0);
                console.fore[this.tilePos.x][this.tilePos.y] = this.tileIsValid ? Constants.TILEPICKER_OK_COLOR : Constants.TILEPICKER_KO_COLOR;
            }
            var hasRange: boolean = (this.data && this.data.range && this.data.origin) ? true : false;
            var hasRadius: boolean = (this.data && this.data.radius) ? true : false;
            if (hasRange || hasRadius) {
                // render the range and/or radius
                var pos: Core.Position = new Core.Position();
                for (pos.x = 0; pos.x < Engine.instance.map.width; ++pos.x) {
                    for (pos.y = 0; pos.y < Engine.instance.map.height; ++pos.y) {
                        var atRange: boolean = hasRange ? Core.Position.distance(this.data.origin, pos) <= this.data.range : true;
                        var inRadius: boolean = this.tileIsValid && hasRadius ? Core.Position.distance(this.tilePos, pos) <= this.data.radius : false;
                        var coef = inRadius ? 1.2 : atRange ? 1 : 0.8;
                        if (coef !== 1) {
                            console.back[pos.x][pos.y] = Core.ColorUtils.multiply(console.back[pos.x][pos.y], coef);
                            console.fore[pos.x][pos.y] = Core.ColorUtils.multiply(console.fore[pos.x][pos.y], coef);
                        }
                    }
                }
            }
        }

        onPickTile(data?: TilePickerEventData) {
            this.data = data;
            this.show();
            this.tileIsValid = true;
            var player: Actor = Engine.instance.actorManager.getPlayer();
            this.tilePos.x = player.x;
            this.tilePos.y = player.y;
        }

        private deactivate() {
            this.hide();
        }

        checkKeyboardInput() {
            var action: PlayerAction = getLastPlayerAction();
            var move: Core.Position = convertActionToPosition(action);
            if (move.y === -1 && this.tilePos.y > 0) {
                this.tilePos.y--;
            } else if (move.y === 1 && this.tilePos.y < Engine.instance.map.height - 1) {
                this.tilePos.y++;
            }
            if (move.x === -1 && this.tilePos.x > 0) {
                this.tilePos.x--;
            } else if (move.x === 1 && this.tilePos.x < Engine.instance.map.width - 1) {
                this.tilePos.x++;
            }
            switch (action) {
                case PlayerAction.CANCEL:
                    this.deactivate();
                    Umbra.Input.resetInput();
                    break;
                case PlayerAction.VALIDATE:
                    if (this.tileIsValid) {
                        this.doSelectTile(this.tilePos);
                        this.deactivate();
                        Umbra.Input.resetInput();
                    }
                    break;
            }
            this.tileIsValid = this.checkTileValidity();
        }

        handleMouseClick() {
            if (Umbra.Input.wasMouseButtonReleased(Umbra.MouseButton.LEFT)) {
                if (this.tileIsValid) {
                    this.doSelectTile(this.tilePos);
                    this.deactivate();
                }
            } else if (Umbra.Input.wasMouseButtonReleased(Umbra.MouseButton.RIGHT)) {
                this.deactivate();
            }
        }

        handleMouseMove() {
            if (Umbra.Input.wasMouseMoved()) {
                var mouseCellPos: Core.Position = Umbra.Input.getMouseCellPosition();
                this.tilePos.x = mouseCellPos.x;
                this.tilePos.y = mouseCellPos.y;
                this.tileIsValid = this.checkTileValidity();
            }
        }

        private checkTileValidity(): boolean {
            if (!Engine.instance.map.isInFov(this.tilePos.x, this.tilePos.y)) {
                return false;
            }
            if (this.data && this.data.origin && this.data.range
                && Core.Position.distance(this.data.origin, this.tilePos) > this.data.range) {
                return false;
            }
            return true;
        }

        private doSelectTile(pos: Core.Position) {
            Umbra.EventManager.publishEvent(EventType[EventType.TILE_SELECTED], pos);
        }
    }

	/********************************************************************************
	 * Group: menu
	 ********************************************************************************/

	/*
		Interface: MenuItem
		An entry in the menu.
	*/
    export interface MenuItem {
        label: string;
        eventType?: EventType;
        disabled?: boolean;
    }

	/*
		Class: Menu
		A generic popup menu
	*/
    export class Menu extends Gui {
        private items: MenuItem[];
        private activeItemIndex: number;
        enableEvents: boolean = true;

        constructor(items: MenuItem[] = [], x: number = -1, y: number = -1) {
            super(1, items.length + 2);
            this.items = items;
            if (items.length > 0) {
                this.activeItemIndex = 0;
            }
            this.resizeMenu();
            this.setModal();
            this.setPosition(x, y);
        }

        private computeWidth(): number {
            var maxWidth: number = 2;
            for (var i = 0; i < this.items.length; i++) {
                if (maxWidth < this.items[i].label.length + 2) {
                    maxWidth = this.items[i].label.length + 2;
                }
            }
            return maxWidth;
        }

        private resizeMenu() {
            var maxWidth = this.computeWidth();
            super.resize(maxWidth, this.items.length + 2);
        }

        private drawMenu() {
            this.console.clearBack(Constants.MENU_BACKGROUND);
            for (var j = 0; j < this.items.length; j++) {
                var itemx: number = Math.floor(this.width / 2 - this.items[j].label.length / 2);
                this.console.print(itemx, j + 1, this.items[j].label);
            }
        }

        private setPosition(x: number, y: number) {
            if (x === -1) {
                x = Math.floor(Constants.CONSOLE_WIDTH / 2 - this.width / 2);
            }
            if (y === -1) {
                y = Math.floor(Constants.CONSOLE_HEIGHT / 2 - this.height / 2);
            }
            this.moveTo(x, y);
        }

        show() {
            this.resizeMenu();
            this.drawMenu();
            super.show();
        }

        hide() {
            super.hide();
        }

        render(destination: Yendor.Console) {
            this.checkKeyboardInput();
            this.console.clearBack(Constants.MENU_BACKGROUND);
            this.handleMouseMove();
            this.handleMouseClick();
            for (var i = 0; i < this.items.length; i++) {
                if (this.items[i].disabled) {
                    this.console.clearFore(Constants.MENU_FOREGROUND_DISABLED, 0, i + 1, -1, 1);
                } else if (i === this.activeItemIndex) {
                    this.console.clearFore(Constants.MENU_FOREGROUND_ACTIVE, 0, i + 1, -1, 1);
                    this.console.clearBack(Constants.MENU_BACKGROUND_ACTIVE, 0, i + 1, -1, 1);
                } else {
                    this.console.clearFore(Constants.MENU_FOREGROUND, 0, i + 1, -1, 1);
                }
            }
            super.render(destination);
        }

        handleMouseMove() {
            if (Umbra.Input.wasMouseMoved()) {
                var mouseCellPos: Core.Position = Umbra.Input.getMouseCellPosition();
                if (mouseCellPos.x >= this.x && mouseCellPos.x < this.x + this.width
                    && mouseCellPos.y >= this.y + 1 && mouseCellPos.y < this.y + this.height - 1) {
                    this.activeItemIndex = mouseCellPos.y - this.y - 1;
                } else {
                    this.activeItemIndex = undefined;
                }
            }
        }

        handleMouseClick() {
            if (Umbra.Input.wasMouseButtonReleased(Umbra.MouseButton.LEFT)) {
                this.activateActiveItem();
            }
        }

        checkKeyboardInput() {
            var action: PlayerAction = getLastPlayerAction();
            switch (action) {
                case PlayerAction.CANCEL:
                    this.hide();
                    break;
                case PlayerAction.MOVE_NORTH:
                    if (this.activeItemIndex) {
                        this.activeItemIndex--;
                    } else {
                        this.activeItemIndex = this.items.length - 1;
                    }
                    break;
                case PlayerAction.MOVE_SOUTH:
                    if (this.activeItemIndex !== undefined && this.activeItemIndex < this.items.length - 1) {
                        this.activeItemIndex++;
                    } else {
                        this.activeItemIndex = 0;
                    }
                    break;
                case PlayerAction.VALIDATE:
                    this.activateActiveItem();
                    break;
            }
        }

        private activateActiveItem() {
            if (this.activeItemIndex !== undefined) {
                var item: MenuItem = this.items[this.activeItemIndex];
                if (!item.disabled) {
                    this.hide();
                    if (item.eventType) {
                        Umbra.EventManager.publishEvent(EventType[item.eventType], item);
                    }
                }
            } else {
                // close the menu if user clicks out of it
                this.hide();
            }
        }
    }

    export class MainMenu extends Menu {
        constructor() {
            super([
                { label: "Resume game" },
                { label: "New game", eventType: EventType.NEW_GAME }
            ]);
            Umbra.EventManager.registerEventListener(this, EventType[EventType.OPEN_MAIN_MENU]);
        }

        onOpenMainMenu() {
            this.show();
        }
    }
}
