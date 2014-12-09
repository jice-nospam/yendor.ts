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
	var VERSION: string = "0.5";
	/*
		Class: Engine
		Handles frame rendering and world updating.
	*/
	class Engine implements ActorManager, EventListener, GuiManager {
		player: Player;
		stairsUp: Actor;
		stairsDown: Actor;
		actors: Actor[];
		corpses: Actor[];
		items: Actor[];
		map: Map;
		status : GameStatus;
		persister: Persister = new LocalStoragePersister();
		guis: { [index: string]: Gui; } = {};

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
			this.map.computeFov(this.player.x, this.player.y, Constants.FOV_RADIUS);
		}

		private initEventBus() {
			EventBus.getInstance().init(this, this.map);
			EventBus.getInstance().registerListener(this, EventType.CHANGE_STATUS);
			EventBus.getInstance().registerListener(this, EventType.REMOVE_ACTOR);
			EventBus.getInstance().registerListener(this, EventType.NEW_GAME);
			EventBus.getInstance().registerListener(this, EventType.NEXT_LEVEL);
			EventBus.getInstance().registerListener(this, EventType.PREV_LEVEL);
			EventBus.getInstance().registerListener(this, EventType.GAIN_XP);
		}

		private createStatusPanel() {
			var statusPanel: Gui = new StatusPanel( Constants.CONSOLE_WIDTH, Constants.STATUS_PANEL_HEIGHT );
			statusPanel.show();
			this.addGui(statusPanel, Constants.STATUS_PANEL_ID, 0, Constants.CONSOLE_HEIGHT - Constants.STATUS_PANEL_HEIGHT);
		}

		private createOtherGui() {
			var inventoryPanel: Gui = new InventoryPanel( Constants.INVENTORY_PANEL_WIDTH, Constants.INVENTORY_PANEL_HEIGHT, this );
			this.addGui(inventoryPanel, Constants.INVENTORY_ID, Math.floor(Constants.CONSOLE_WIDTH / 2 - Constants.INVENTORY_PANEL_WIDTH / 2), 0);

			var tilePicker: Gui = new TilePicker(this.map);
			this.addGui(tilePicker, Constants.TILE_PICKER_ID);

			var mainMenu: Menu = new MainMenu();
			this.addGui(mainMenu, Constants.MAIN_MENU_ID);
		}

		private resetGame() {
			this.actors = [];
			this.corpses = [];
			this.items = [];
			this.status = GameStatus.STARTUP;
		}

		/*
			Function: createStairs
			Create the actors for up and down stairs. The position is not important, actors will be placed by the dungeon builder.
		*/
		private createStairs() {
			this.stairsUp = new Actor();
			this.stairsUp.init(0, 0, "<", "stairs up", "#FFFFFF");
			this.stairsUp.fovOnly = false;
			this.items.push(this.stairsUp);
			this.stairsDown = new Actor();
			this.stairsDown.init(0, 0, ">", "stairs down", "#FFFFFF");
			this.stairsDown.fovOnly = false;
			this.items.push(this.stairsDown);
		}

		private createPlayer() {
			this.player = new Player();
			this.player.init(Constants.CONSOLE_WIDTH / 2, Constants.CONSOLE_HEIGHT / 2, "@", "player", "#FFFFFF");
			this.actors.push(this.player);
		}

		private createNewGame() {
			this.createStairs();
			this.createPlayer();
			this.map.init( Constants.CONSOLE_WIDTH, Constants.CONSOLE_HEIGHT - Constants.STATUS_PANEL_HEIGHT );
			var dungeonBuilder: BspDungeonBuilder = new BspDungeonBuilder();
			dungeonBuilder.build(this.map, this);
		}

		private loadGame() {
			this.persister.loadFromKey(Constants.PERSISTENCE_MAP_KEY, this.map);
			this.actors = this.persister.loadFromKey(Constants.PERSISTENCE_ACTORS_KEY);
			this.player = <Player>this.actors[0];
			this.items = this.persister.loadFromKey(Constants.PERSISTENCE_ITEMS_KEY);
			this.stairsUp = this.items[0];
			this.stairsDown = this.items[1];
			this.corpses = this.persister.loadFromKey(Constants.PERSISTENCE_CORPSES_KEY);
			this.persister.loadFromKey(Constants.STATUS_PANEL_ID, this.guis[Constants.STATUS_PANEL_ID]);
		}

		private saveGame() {
			this.persister.saveToKey(Constants.PERSISTENCE_VERSION_KEY, VERSION);
			this.persister.saveToKey(Constants.PERSISTENCE_MAP_KEY, this.map);
			this.persister.saveToKey(Constants.PERSISTENCE_ACTORS_KEY, this.actors);
			this.persister.saveToKey(Constants.PERSISTENCE_ITEMS_KEY, this.items);
			this.persister.saveToKey(Constants.PERSISTENCE_CORPSES_KEY, this.corpses);
			this.persister.saveToKey(Constants.STATUS_PANEL_ID, this.guis[Constants.STATUS_PANEL_ID]);
		}

		private deleteSavedGame() {
			this.persister.deleteKey(Constants.PERSISTENCE_VERSION_KEY);
			this.persister.deleteKey(Constants.PERSISTENCE_MAP_KEY);
			this.persister.deleteKey(Constants.PERSISTENCE_ACTORS_KEY);
			this.persister.deleteKey(Constants.PERSISTENCE_ITEMS_KEY);
			this.persister.deleteKey(Constants.PERSISTENCE_CORPSES_KEY);
			this.persister.deleteKey(Constants.STATUS_PANEL_ID);
		}

		private newLevel() {
			this.resetGame();
			this.createNewGame();
			this.map.computeFov(this.player.x, this.player.y, Constants.FOV_RADIUS);
		}

		/*
			Function: gotoNextLevel
			Go down one level
		*/
		private gotoNextLevel() {
			this.resetGame();
			this.createStairs();
			// don't reset the player
			this.actors.push(this.player);
			this.player.destructible.heal(this.player.destructible.maxHp / 2);
			log("You take a moment to rest, and recover your strength.", "orange");
			log("After a rare moment of peace, you descend deeper\ninto the heart of the dungeon...", "red");
			this.map.init( Constants.CONSOLE_WIDTH, Constants.CONSOLE_HEIGHT - Constants.STATUS_PANEL_HEIGHT );
			var dungeonBuilder: BspDungeonBuilder = new BspDungeonBuilder();
			dungeonBuilder.build(this.map, this);
			this.map.computeFov(this.player.x, this.player.y, Constants.FOV_RADIUS);
		}

		/*
			Function: gotoPrevLevel
			Go up one level
		*/
		private gotoPrevLevel() {
			log("The stairs have collapsed. You can't go up anymore...");
		}

		/*
			ActorManager interface
		*/
		getPlayer() : Actor {
			return this.player;
		}

		addCreature( actor: Actor ) {
			this.actors.push(actor);
		}

		addItem( actor: Actor ) {
			this.items.push(actor);
		}

		getCreatures(): Actor[] {
			return this.actors;
		}

		getItems(): Actor[] {
			return this.items;
		}

		getCorpses(): Actor[] {
			return this.corpses;
		}

		getStairsUp(): Actor {
			return this.stairsUp;
		}

		getStairsDown(): Actor {
			return this.stairsDown;
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
						gui.render(this.map, this, rootConsole);
					}
				}
			}
		}

		/*
			Function: findClosestActor

			In the `actors` array, find the closest actor (except the player) from position `pos` within `range`.
			If range is 0, no range limitation.
		*/
		findClosestActor( pos: Yendor.Position, range: number, actors: Actor[] ) : Actor {
			var bestDistance: number = 1E8;
			var closestActor: Actor = undefined;
			var player: Actor = this.getPlayer();
			actors.forEach(function(actor: Actor) {
				if ( actor !== player ) {
					var distance: number = Yendor.Position.distance(pos, actor);
					if ( distance < bestDistance && (distance < range || range === 0) ) {
						bestDistance = distance;
						closestActor = actor;
					}
				}
			});
			return closestActor;
		}

		/*
			Function: findActorsOnCell

			Parameters:
			pos - a position on the map
			actors - the list of actors to scan (either actors, corpses or items)

			Returns:
			an array containing all the living actors on the cell

		*/
		findActorsOnCell( pos: Yendor.Position, actors: Actor[]) : Actor[] {
			var actorsOnCell: Actor[] = [];
			var nbActors: number = actors.length;
			for (var i: number = 0; i < nbActors; i++) {
				var actor: Actor = actors[i];
				if ( actor.x === pos.x && actor.y === pos.y ) {
					actorsOnCell.push(actor);
				}
			}
			return actorsOnCell;
		}

		/*
			Function: findActorsInRange
			Returns all actor near a position

			Parameters:
			pos - a position on the map
			range - maximum distance from position
			actors - actor array to look up

			Returns:
			an actor array containing all actor within range
		*/
		findActorsInRange( pos: Yendor.Position, range: number, actors: Actor[]): Actor[] {
			var actorsInRange: Actor[] = [];
			var nbActors: number = actors.length;
			for (var i: number = 0; i < nbActors; i++) {
				var actor: Actor = actors[i];
				if (Yendor.Position.distance(pos, actor) <= range ) {
					actorsInRange.push( actor );
				}
			}
			return actorsInRange;
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
					this.removeItem(item);
					break;
				case  EventType.NEW_GAME :
					this.guis[ Constants.STATUS_PANEL_ID ].clear();
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
					this.player.addXp(event.data);
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
					EventBus.getInstance().publishEvent(new Event<KeyboardEvent>(EventType.KEY_PRESSED, event));
					this.player.ai.update(this.player, this.map, this);
				}
			} else {
				EventBus.getInstance().publishEvent(new Event<KeyboardEvent>(EventType.KEY_PRESSED, event));
			}
			if ( this.status === GameStatus.NEW_TURN )  {
				this.handleNewTurn();
			}
		}

		private handleGlobalShortcuts(event: KeyboardEvent): boolean {
			if ( event.keyCode === KeyEvent.DOM_VK_ESCAPE ) {
				// ESC : open game menu
				this.guis[ Constants.MAIN_MENU_ID ].show();
				return true;
			} else if ( event.keyCode === KeyEvent.DOM_VK_I ) {
				// i : open inventory
				EventBus.getInstance().publishEvent(new Event<void>(EventType.OPEN_INVENTORY));
				return true;
			}
			return false;
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
				this.player.ai.update(this.player, this.map, this);
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
			EventBus.getInstance().publishEvent(new Event<Yendor.Position>( EventType.MOUSE_MOVE, pos));
		}

		/*
			Function: handleMouseClick
			Triggered by mouse button click events.

			Parameters:
			event - the JQueryMouseEventObject
		*/
		handleMouseClick(event: JQueryMouseEventObject) {
			EventBus.getInstance().publishEvent(new Event<MouseButton>( EventType.MOUSE_CLICK, <MouseButton>event.which));
			if ( this.status === GameStatus.NEW_TURN )  {
				this.handleNewTurn();
			}
		}

		private removeItem(item: Actor) {
			var idx: number = this.items.indexOf(item);
			if ( idx !== -1 ) {
				this.items.splice(idx, 1);
			}
		}

		private renderActors(actors: Actor[]) {
			var nbActors: number = actors.length;
			for (var i: number = 0; i < nbActors; i++) {
				var actor: Actor = actors[i];
				if ( this.map.shouldRenderActor(actor) ) {
					actor.render();
				}
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
			this.renderActors(this.corpses);
			this.renderActors(this.items);
			this.renderActors(this.actors);
			this.renderGui(root);
		}

		/*
			Function: updateActors
			Triggers actors' A.I. during a new game turn.
			Moves the dead actors from the actor list to the corpse list.
		*/
		private updateActors() {
			var nbActors: number = this.actors.length;
			for (var i = 1; i < nbActors; i++) {
				var actor: Actor = this.actors[i];
				actor.update( this.map, this );
				if ( actor.destructible && actor.destructible.isDead() ) {
					this.actors.splice(i, 1);
					i--;
					nbActors--;
					this.corpses.push(actor);
				}
			}
		}

		/*
			Function: handleNewTurn
			Triggered when a new game turn starts. Updates all the world actors.
		*/
		private handleNewTurn() {
			this.updateActors();
			this.status = GameStatus.IDLE;
			if (!this.player.destructible.isDead()) {
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
		EventBus.getInstance().publishEvent(new Event<Message>(EventType.LOG_MESSAGE, new Message(color, text)));
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
