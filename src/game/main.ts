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
		This should be an integer.
	*/
	var VERSION: string = "1";
	/*
		Class: Engine
		Handles frame rendering and world updating.
	*/
	class Engine implements EventListener {
		private map: Map;
		private status : GameStatus;
		private persister: Persister = new LocalStoragePersister();
		private dungeonLevel: number = 1;

		constructor() {
			this.resetGame();
			this.map = new Map();
			this.initEventBus();
			GuiManager.instance.createStatusPanel();

			var savedVersion = this.persister.loadFromKey(Constants.PERSISTENCE_VERSION_KEY);
			if ( savedVersion && savedVersion.toString() === VERSION ) {
				this.loadGame();
			} else {
				this.createNewGame();
			}
			GuiManager.instance.createOtherGui(this.map);
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

			// this helps debugging items
			var player: Actor = ActorManager.instance.getPlayer();
			ActorManager.instance.addItem(Actor.createBow(player.x, player.y, "short bow", 3, "arrow", true));
			ActorManager.instance.addItem(Actor.createShield(player.x, player.y, "wooden shield", 1));
			ActorManager.instance.addItem(Actor.createBow(player.x, player.y, "crossbow", 2, "bolt"));
			ActorManager.instance.addItem(Actor.createMissile(player.x, player.y, "bone arrow", 1, "arrow"));
			ActorManager.instance.addItem(Actor.createSword(player.x, player.y, "short sword", 3));
		}

		private loadGame() {
			this.dungeonLevel = this.persister.loadFromKey(Constants.PERSISTENCE_DUNGEON_LEVEL);
			this.persister.loadFromKey(Constants.PERSISTENCE_MAP_KEY, this.map);
			ActorManager.instance.load(this.persister);
			this.persister.loadFromKey(Constants.STATUS_PANEL_ID, GuiManager.instance.getGui(Constants.STATUS_PANEL_ID));
		}

		private saveGame() {
			this.persister.saveToKey(Constants.PERSISTENCE_DUNGEON_LEVEL, this.dungeonLevel);
			this.persister.saveToKey(Constants.PERSISTENCE_VERSION_KEY, VERSION);
			this.persister.saveToKey(Constants.PERSISTENCE_MAP_KEY, this.map);
			ActorManager.instance.save(this.persister);
			this.persister.saveToKey(Constants.STATUS_PANEL_ID, GuiManager.instance.getGui(Constants.STATUS_PANEL_ID));
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
			Go down one level in the dungeon
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
					GuiManager.instance.getGui(Constants.STATUS_PANEL_ID ).clear();
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
			Function: convertKeyToAction
			This function maps keyboard input into actual game actions.
		*/
		private convertKeyToAction(event: KeyboardEvent): PlayerAction {
			switch (event.keyCode) {
				// cardinal movements				
				case KeyEvent.DOM_VK_LEFT:
				case KeyEvent.DOM_VK_NUMPAD4:
				case KeyEvent.DOM_VK_H:
					return PlayerAction.MOVE_WEST;
				case KeyEvent.DOM_VK_RIGHT:
				case KeyEvent.DOM_VK_NUMPAD6:
				case KeyEvent.DOM_VK_L:
					return PlayerAction.MOVE_EAST;
				case KeyEvent.DOM_VK_UP:
				case KeyEvent.DOM_VK_NUMPAD8:
				case KeyEvent.DOM_VK_K:
					return PlayerAction.MOVE_NORTH;
				case KeyEvent.DOM_VK_DOWN:
				case KeyEvent.DOM_VK_NUMPAD2:
				case KeyEvent.DOM_VK_J:
					return PlayerAction.MOVE_SOUTH;
				// diagonal movements
				case KeyEvent.DOM_VK_NUMPAD7:
				case KeyEvent.DOM_VK_Y:
					return PlayerAction.MOVE_NW;
				case KeyEvent.DOM_VK_NUMPAD9:
				case KeyEvent.DOM_VK_U:
					return PlayerAction.MOVE_NE;
				case KeyEvent.DOM_VK_NUMPAD1:
				case KeyEvent.DOM_VK_B:
					return PlayerAction.MOVE_SW;
				case KeyEvent.DOM_VK_NUMPAD3:
				case KeyEvent.DOM_VK_N:
					return PlayerAction.MOVE_SE;
				// other movements
				case KeyEvent.DOM_VK_NUMPAD5:
				case KeyEvent.DOM_VK_SPACE:
					return PlayerAction.WAIT;
				case KeyEvent.DOM_VK_G :
					return PlayerAction.GRAB;
				case KeyEvent.DOM_VK_I :
					return PlayerAction.USE_ITEM;
				case KeyEvent.DOM_VK_D :
					return PlayerAction.DROP_ITEM;
				case KeyEvent.DOM_VK_T :
					return PlayerAction.THROW_ITEM;
				case KeyEvent.DOM_VK_ENTER :
				case KeyEvent.DOM_VK_RETURN :
					return PlayerAction.VALIDATE;
				case KeyEvent.DOM_VK_ESCAPE :
					return PlayerAction.CANCEL;
				case KeyEvent.DOM_VK_F :
					return PlayerAction.FIRE;
				default:
					if ( event.key === ">" ) {
						return PlayerAction.MOVE_DOWN;
					} else if ( event.key === "<" ) {
						return PlayerAction.MOVE_UP;
					}
				break;
			}
			return undefined;
		}

		/*
			Function: handleKeypress
			Triggered when the player presses a key. Updates the game world and possibly starts a new turn for NPCs.

			Parameters:
			event - the KeyboardEvent
		*/
		handleKeypress(event: KeyboardEvent) {
			var input: KeyInput = {
				action : this.convertKeyToAction(event),
				keyCode : event.keyCode,
				char : event.key
			};
			if (! Gui.getActiveModal() ) {
				if ( !this.handleGlobalShortcuts(input) ) {
					EventBus.instance.publishEvent(new Event<KeyInput>(EventType.KEYBOARD_INPUT, input));
					ActorManager.instance.getPlayer().ai.update(ActorManager.instance.getPlayer(), this.map);
				}
			} else {
				EventBus.instance.publishEvent(new Event<KeyInput>(EventType.KEYBOARD_INPUT, input));
			}
			if ( this.status === GameStatus.NEW_TURN )  {
				this.handleNewTurn();
			}
		}

		private handleGlobalShortcuts(input: KeyInput): boolean {
			if ( input.action === PlayerAction.CANCEL ) {
				EventBus.instance.publishEvent(new Event<void>(EventType.OPEN_MAIN_MENU));
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
			GuiManager.instance.renderGui(root, this.map);
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
			root = Yendor.createConsole( Constants.CONSOLE_WIDTH, Constants.CONSOLE_HEIGHT, "#ffffff", "#000000", "#console", "terminal.png" );

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
