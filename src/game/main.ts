/// <reference path="../decl/jquery.d.ts" />
/// <reference path="../yendor/yendor.ts" />
/// <reference path="base.ts" />
/// <reference path="eventbus.ts" />
/// <reference path="actor.ts" />
/// <reference path="item.ts" />
/// <reference path="creature.ts" />
/// <reference path="map.ts" />
/// <reference path="gui.ts" />
var	root: Yendor.Console;
var rng: Yendor.Random;
module Game {
	"use strict";

	/*
		Property: VERSION
		This is mainly the savegame format version. To be incremented when the format changes
		to keep the game from trying to load data with an old format.
		This should be a numeric value (x.y.z not supported).
	*/
	var VERSION: string = "0.6";
	/*
		Class: Engine
		Handles frame rendering and world updating.
	*/
	class Engine implements EventListener, GuiManager {
		private map: Map;
		private status : GameStatus;
		private persister: Persister = new LocalStoragePersister();
		private guis: { [index: string]: Gui; } = {};
		private dungeonLevel: number = 1;

		/*
			Constructor: constructor
		*/
		constructor() {
			this.resetGame();
			this.map = new Map();
			this.initEventBus();
			this.createStatusPanel();

			var savedVersion = this.persister.loadFromKey(Constants.PERSISTENCE_VERSION_KEY);
			if ( savedVersion && savedVersion.toString() === VERSION ) {
				this.loadGame();
			} else {
				this.createNewGame();
			}
			this.createOtherGui();
			this.computePlayerFov();
		}

		private initEventBus() {
			EventBus.instance.init(this.map);
			EventBus.instance.registerListener(this, EventType.CHANGE_STATUS);
			EventBus.instance.registerListener(this, EventType.REMOVE_ACTOR);
			EventBus.instance.registerListener(this, EventType.NEW_GAME);
			EventBus.instance.registerListener(this, EventType.NEXT_LEVEL);
			EventBus.instance.registerListener(this, EventType.PREV_LEVEL);
			EventBus.instance.registerListener(this, EventType.GAIN_XP);
		}

		private createStatusPanel() {
			var statusPanel: Gui = new StatusPanel( Constants.CONSOLE_WIDTH, Constants.STATUS_PANEL_HEIGHT );
			statusPanel.show();
			this.addGui(statusPanel, Constants.STATUS_PANEL_ID, 0, Constants.CONSOLE_HEIGHT - Constants.STATUS_PANEL_HEIGHT);
		}

		private createOtherGui() {
			var inventoryPanel: Gui = new InventoryPanel( Constants.INVENTORY_PANEL_WIDTH, Constants.INVENTORY_PANEL_HEIGHT );
			this.addGui(inventoryPanel, Constants.INVENTORY_ID, Math.floor(Constants.CONSOLE_WIDTH / 2 - Constants.INVENTORY_PANEL_WIDTH / 2), 0);

			var tilePicker: Gui = new TilePicker(this.map);
			this.addGui(tilePicker, Constants.TILE_PICKER_ID);

			var mainMenu: Menu = new MainMenu();
			this.addGui(mainMenu, Constants.MAIN_MENU_ID);
		}

		private resetGame() {
			ActorManager.instance.clear();
			this.status = GameStatus.STARTUP;
		}

		private createNewGame() {
			ActorManager.instance.createStairs();
			ActorManager.instance.createPlayer();
			this.map.init( Constants.CONSOLE_WIDTH, Constants.CONSOLE_HEIGHT - Constants.STATUS_PANEL_HEIGHT );
			var dungeonBuilder: BspDungeonBuilder = new BspDungeonBuilder(this.dungeonLevel);
			dungeonBuilder.build(this.map);
		}

		private loadGame() {
			this.dungeonLevel = this.persister.loadFromKey(Constants.PERSISTENCE_DUNGEON_LEVEL);
			this.persister.loadFromKey(Constants.PERSISTENCE_MAP_KEY, this.map);
			ActorManager.instance.load(this.persister);
			this.persister.loadFromKey(Constants.STATUS_PANEL_ID, this.guis[Constants.STATUS_PANEL_ID]);
		}

		private saveGame() {
			this.persister.saveToKey(Constants.PERSISTENCE_DUNGEON_LEVEL, this.dungeonLevel);
			this.persister.saveToKey(Constants.PERSISTENCE_VERSION_KEY, VERSION);
			this.persister.saveToKey(Constants.PERSISTENCE_MAP_KEY, this.map);
			ActorManager.instance.save(this.persister);
			this.persister.saveToKey(Constants.STATUS_PANEL_ID, this.guis[Constants.STATUS_PANEL_ID]);
		}

		private deleteSavedGame() {
			this.persister.deleteKey(Constants.PERSISTENCE_DUNGEON_LEVEL);
			this.persister.deleteKey(Constants.PERSISTENCE_VERSION_KEY);
			this.persister.deleteKey(Constants.PERSISTENCE_MAP_KEY);
			ActorManager.instance.deleteSavedGame(this.persister);
			this.persister.deleteKey(Constants.STATUS_PANEL_ID);
		}

		private computePlayerFov() {
			this.map.computeFov(ActorManager.instance.getPlayer().x, ActorManager.instance.getPlayer().y, Constants.FOV_RADIUS);
		}

		private newLevel() {
			this.resetGame();
			this.createNewGame();
			this.computePlayerFov();
		}

		/*
			Function: gotoNextLevel
			Go down one level
		*/
		private gotoNextLevel() {
			this.dungeonLevel ++;
			this.resetGame();
			ActorManager.instance.createStairs();
			// don't reset the player
			var player: Actor = ActorManager.instance.getPlayer();
			ActorManager.instance.addCreature(player);
			player.destructible.heal(player.destructible.maxHp / 2);
			log("You take a moment to rest, and recover your strength.", "orange");
			log("After a rare moment of peace, you descend deeper\ninto the heart of the dungeon...", "orange");
			log("Level..." + this.dungeonLevel, "red");
			this.map.init( Constants.CONSOLE_WIDTH, Constants.CONSOLE_HEIGHT - Constants.STATUS_PANEL_HEIGHT );
			var dungeonBuilder: BspDungeonBuilder = new BspDungeonBuilder(this.dungeonLevel);
			dungeonBuilder.build(this.map);
			this.computePlayerFov();
		}

		/*
			Function: gotoPrevLevel
			Go up one level
		*/
		private gotoPrevLevel() {
			log("The stairs have collapsed. You can't go up anymore...");
		}

		/*
			GuiManager interface
		*/
		addGui(gui: Gui, name: string, x?: number, y?: number) {
			if ( x !== undefined && y !== undefined ) {
				gui.moveTo(x, y);
			}
			this.guis[name] = gui;
		}

		renderGui(rootConsole: Yendor.Console) {
			for (var guiName in this.guis) {
				if ( this.guis.hasOwnProperty(guiName) ) {
					var gui: Gui = this.guis[guiName];
					if ( gui.isVisible()) {
						gui.render(this.map, rootConsole);
					}
				}
			}
		}

		/*
			Function: processEvent
			Handle <CHANGE_STATUS> events (see <EventListener>)

			Parameters:
				event - the CHANGE_STATUS event
		*/
		processEvent(event: Event<any>) {
			switch ( event.type ) {
				case EventType.CHANGE_STATUS :
					this.status = event.data;
					break;
				case EventType.REMOVE_ACTOR :
					var item: Actor = event.data;
					ActorManager.instance.removeItem(item);
					break;
				case  EventType.NEW_GAME :
					this.guis[ Constants.STATUS_PANEL_ID ].clear();
					this.dungeonLevel = 1;
					this.newLevel();
					break;
				case EventType.NEXT_LEVEL :
					this.status = GameStatus.NEW_TURN;
					this.gotoNextLevel();
					break;
				case EventType.PREV_LEVEL :
					this.status = GameStatus.NEW_TURN;
					this.gotoPrevLevel();
					break;
				case EventType.GAIN_XP :
					ActorManager.instance.getPlayer().addXp(event.data);
					break;
				default: break;
			}
		}

		/*
			Function: handleKeypress
			Triggered when the player presses a key. Updates the game world and possibly starts a new turn for NPCs.

			Parameters:
			event - the KeyboardEvent
		*/
		handleKeypress(event: KeyboardEvent) {
			if (event.key === "MozPrintableKey") {
				// fix for old firefox versions
				if ( event.keyCode >= KeyEvent.DOM_VK_A && event.keyCode <= KeyEvent.DOM_VK_Z ) {
					event.key = String.fromCharCode(event.keyCode).toLowerCase();
				}
			}
			if (! Gui.getActiveModal() ) {
				if ( !this.handleGlobalShortcuts(event) ) {
					EventBus.instance.publishEvent(new Event<KeyboardEvent>(EventType.KEY_PRESSED, event));
					ActorManager.instance.getPlayer().ai.update(ActorManager.instance.getPlayer(), this.map);
				}
			} else {
				EventBus.instance.publishEvent(new Event<KeyboardEvent>(EventType.KEY_PRESSED, event));
			}
			if ( this.status === GameStatus.NEW_TURN )  {
				this.handleNewTurn();
			}
		}

		private handleGlobalShortcuts(event: KeyboardEvent): boolean {
			if ( event.keyCode === KeyEvent.DOM_VK_ESCAPE ) {
				// ESC : open game menu
				EventBus.instance.publishEvent(new Event<void>(EventType.OPEN_MAIN_MENU));
				return true;
			} else if ( event.keyCode === KeyEvent.DOM_VK_I ) {
				// i : use item from inventory
				EventBus.instance.publishEvent(new Event<OpenInventoryEventData>(EventType.OPEN_INVENTORY,
					{ title: "use an item", itemListener: this.useItem.bind(this) } ));
				return true;
			} else if ( event.keyCode === KeyEvent.DOM_VK_D ) {
				// d : drop item from inventory
				EventBus.instance.publishEvent(new Event<OpenInventoryEventData>(EventType.OPEN_INVENTORY,
					{ title: "drop an item", itemListener: this.dropItem.bind(this) } ));
				return true;
			}
			return false;
		}

		private useItem(item: Actor) {
			if (item.pickable) {
				item.pickable.use(item, ActorManager.instance.getPlayer());
			}
		}

		private dropItem(item: Actor) {
			if ( item.pickable ) {
				item.pickable.drop(item, ActorManager.instance.getPlayer());
			}
		}

		/*
			Function: handleNewFrame
			Render a new frame. Frame rate is not tied to game turns to allow animations between turns.
			This function is called by the browser before a screen repaint.
			The number of callbacks is usually 60 times per second, but will generally match the display refresh rate 
			in most web browsers as per W3C recommendation. The callback rate may be reduced to a lower rate when running in background tabs.

			Parameters:
			time - elapsed time since the last frame in milliseconds
		*/
		handleNewFrame (time: number) {
			if ( this.status === GameStatus.STARTUP ) {
				ActorManager.instance.getPlayer().ai.update(ActorManager.instance.getPlayer(), this.map);
				this.status = GameStatus.IDLE;
			}
			this.render();
			root.render();
		}

		/*
			Function: handleMouseMove
			Triggered by mouse motion events.

			Parameters:
			event - the JQueryMouseEventObject
		*/
		handleMouseMove(event: JQueryMouseEventObject) {
			var pos: Yendor.Position = root.getPositionFromPixels( event.pageX, event.pageY );
			EventBus.instance.publishEvent(new Event<Yendor.Position>( EventType.MOUSE_MOVE, pos));
		}

		/*
			Function: handleMouseClick
			Triggered by mouse button click events.

			Parameters:
			event - the JQueryMouseEventObject
		*/
		handleMouseClick(event: JQueryMouseEventObject) {
			EventBus.instance.publishEvent(new Event<MouseButton>( EventType.MOUSE_CLICK, <MouseButton>event.which));
			if ( this.status === GameStatus.NEW_TURN )  {
				this.handleNewTurn();
			}
		}

		/*
			Function: render
			The actual frame rendering. Render objects in this order:
			- the map
			- the corpses
			- the living actors
			- the GUI
		*/
		private render() {
			root.clearText();
			this.map.render();
			ActorManager.instance.renderActors(this.map);
			this.renderGui(root);
		}



		/*
			Function: handleNewTurn
			Triggered when a new game turn starts. Updates all the world actors.
		*/
		private handleNewTurn() {
			ActorManager.instance.updateActors(this.map);
			this.status = GameStatus.IDLE;
			if (!ActorManager.instance.isPlayerDead()) {
				this.saveGame();
			} else {
				this.deleteSavedGame();
			}
		}
	}

	/*
		Section: Game startup

		Function: log
		Utility to send a LOG_MESSAGE event on the event bus.
	*/
	log = function(text: string, color: Yendor.Color = "white") {
		EventBus.instance.publishEvent(new Event<Message>(EventType.LOG_MESSAGE, new Message(color, text)));
	};

	/*
		This function is called when the document has finished loading in the browser.
		It creates the root console, register the keyboard and mouse event callbacks, and starts the frame rendering loop.
	*/
	$(function() {
		try {
			Yendor.init();
			rng = new Yendor.ComplementaryMultiplyWithCarryRandom();
			root = new Yendor.PixiConsole( Constants.CONSOLE_WIDTH, Constants.CONSOLE_HEIGHT, "#ffffff", "#000000", "#console", "terminal.png" );

			var engine = new Engine();
			$(document).keydown(engine.handleKeypress.bind(engine));
			$(document).mousemove(engine.handleMouseMove.bind(engine));
			$(document).click(engine.handleMouseClick.bind(engine));
			Yendor.loop(engine.handleNewFrame.bind(engine));
		} catch (e) {
			console.log("ERROR in " + e.fileName + ":" + e.lineNumber + " : " + e.message);
			console.log(e.stack);
		}
	});
}
