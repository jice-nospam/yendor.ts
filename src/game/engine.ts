/// <reference path="../game/base.ts" />
/// <reference path="../game/eventbus.ts" />
/// <reference path="../game/actor.ts" />
/// <reference path="../game/effects.ts" />
/// <reference path="../game/item.ts" />
/// <reference path="../game/creature.ts" />
/// <reference path="../game/map.ts" />
/// <reference path="../game/gui.ts" />
module Game {
	"use strict";

	/*
		Property: SAVEFILE_VERSION
		This is the savegame format version. To be incremented when the format changes
		to keep the game from trying to load data with an old format.
		This should be an integer.
	*/
	var SAVEFILE_VERSION: string = "8";

	/*
		Class: Engine
		Handles frame rendering and world updating.
	*/
	export class Engine implements EventListener {
		private static _instance: Engine;
		static get instance() {
			if (! Engine._instance) {
				Engine._instance = new Engine();
				Engine._instance.init();
			}
			return Engine._instance;
		}

		private _map: Map;
		private _rng: Yendor.Random;
		private _eventBus: EventBus;
		private _actorManager: ActorManager;

		private guiManager: GuiManager;
		private status : GameStatus;
		private persister: Persister = new LocalStoragePersister();
		private dungeonLevel: number = 1;
		private gameTime : number = 0;
		private	root: Yendor.Console;

		// singleton getters
		get map() { return this._map; }
		get rng() { return this._rng; }
		get eventBus() { return this._eventBus; }
		get actorManager() { return this._actorManager; }

		private init() {
			this._rng = new Yendor.ComplementaryMultiplyWithCarryRandom();
			this.root = Yendor.createConsole( Constants.CONSOLE_WIDTH, Constants.CONSOLE_HEIGHT, 0xffffff, 0x000000, "#console", "terminal.png" );
			this._actorManager = new ActorManager();
			this._map = new Map();
			this.initEventBus();
			this.guiManager = new GuiManager();
			this.guiManager.createStatusPanel();

			var savedVersion = this.persister.loadFromKey(Constants.PERSISTENCE_VERSION_KEY);
			if ( savedVersion && savedVersion.toString() === SAVEFILE_VERSION ) {
				this.loadGame();
			} else {
				this.createNewGame();
			}
			this.guiManager.createOtherGui();
			this.computePlayerFov();
		}

		private initEventBus() {
			this._eventBus = new EventBus();
			this._eventBus.registerListener(this, EventType.CHANGE_STATUS);
			this._eventBus.registerListener(this, EventType.NEW_GAME);
			this._eventBus.registerListener(this, EventType.GAIN_XP);
		}

		private createNewGame() {
			this._actorManager.clear();
			this._actorManager.createStairs();
			this._actorManager.createPlayer();
			this._map.init( Constants.CONSOLE_WIDTH, Constants.CONSOLE_HEIGHT - Constants.STATUS_PANEL_HEIGHT );
			var dungeonBuilder: BspDungeonBuilder = new BspDungeonBuilder(this.dungeonLevel);
			dungeonBuilder.build(this._map);
			this.status = GameStatus.RUNNING;

			// this helps debugging items
			if ( Yendor.urlParams[Constants.URL_PARAM_DEBUG] ) {
				var player: Actor = this._actorManager.getPlayer();
				[	ActorType.MAP_REVEAL_STAFF, ActorType.SHORT_SWORD, ActorType.FIREBALL_SCROLL, ActorType.CONFUSION_SCROLL,
					ActorType.WOODEN_SHIELD, ActorType.TELEPORT_STAFF,
					ActorType.LIFE_DETECT_STAFF, ActorType.REGENERATION_POTION,
					ActorType.SHORT_BOW
				].forEach((type: ActorType) => { this._actorManager.addItem(ActorFactory.create(type, player.x, player.y)); });
			}
		}

		private loadGame() {
			this.dungeonLevel = this.persister.loadFromKey(Constants.PERSISTENCE_DUNGEON_LEVEL);
			this.persister.loadFromKey(Constants.PERSISTENCE_MAP_KEY, this._map);
			this._actorManager.load(this.persister);
			this.persister.loadFromKey(Constants.STATUS_PANEL_ID, this.guiManager.getGui(Constants.STATUS_PANEL_ID));
			this.status = GameStatus.RUNNING;
		}

		saveGame() {
			if (this._actorManager.isPlayerDead()) {
				this.deleteSavedGame();
			} else {
				this.persister.saveToKey(Constants.PERSISTENCE_DUNGEON_LEVEL, this.dungeonLevel);
				this.persister.saveToKey(Constants.PERSISTENCE_VERSION_KEY, SAVEFILE_VERSION);
				this.persister.saveToKey(Constants.PERSISTENCE_MAP_KEY, this._map);
				this._actorManager.save(this.persister);
				this.persister.saveToKey(Constants.STATUS_PANEL_ID, this.guiManager.getGui(Constants.STATUS_PANEL_ID));
			}
		}

		private deleteSavedGame() {
			this.persister.deleteKey(Constants.PERSISTENCE_DUNGEON_LEVEL);
			this.persister.deleteKey(Constants.PERSISTENCE_VERSION_KEY);
			this.persister.deleteKey(Constants.PERSISTENCE_MAP_KEY);
			this._actorManager.deleteSavedGame(this.persister);
			this.persister.deleteKey(Constants.STATUS_PANEL_ID);
		}

		private computePlayerFov() {
			this._map.computeFov(this._actorManager.getPlayer().x, this._actorManager.getPlayer().y, Constants.FOV_RADIUS);
		}

		/*
			Function: gotoNextLevel
			Go down one level in the dungeon
		*/
		private gotoNextLevel() {
			this.dungeonLevel ++;
			this._actorManager.clear();
			this._actorManager.createStairs();
			// don't reset the player
			var player: Actor = this._actorManager.getPlayer();
			this._actorManager.addCreature(player);
			player.destructible.heal(player.destructible.maxHp / 2);
			log("You take a moment to rest, and recover your strength.", Constants.LOG_WARN_COLOR);
			log("After a rare moment of peace, you descend deeper\ninto the heart of the dungeon...", Constants.LOG_WARN_COLOR);
			log("Level..." + this.dungeonLevel, Constants.LOG_WARN_COLOR);
			this._map.init( Constants.CONSOLE_WIDTH, Constants.CONSOLE_HEIGHT - Constants.STATUS_PANEL_HEIGHT );
			var dungeonBuilder: BspDungeonBuilder = new BspDungeonBuilder(this.dungeonLevel);
			dungeonBuilder.build(this._map);
			this.computePlayerFov();
		}

		onCHANGE_STATUS(status: GameStatus) {
			this.status = status;
		}

		onNEW_GAME() {
			this.guiManager.getGui(Constants.STATUS_PANEL_ID ).clear();
			this.dungeonLevel = 1;
			this.createNewGame();
			this.computePlayerFov();
		}

		onGAIN_XP(amount: number) {
			this._actorManager.getPlayer().addXp(amount);
		}

		private hasBackgroundAnimation(): boolean {
			// TODO
			return false;
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
				case KeyEvent.DOM_VK_Z :
					return PlayerAction.ZAP;
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
					this._eventBus.publishEvent(EventType.KEYBOARD_INPUT, input);
				}
			} else {
				// modal gui captures all key events
				this._eventBus.postEvent(EventType.KEYBOARD_INPUT, Gui.getActiveModal(), input);
			}
		}

		private handleGlobalShortcuts(input: KeyInput): boolean {
			if ( input.action === PlayerAction.CANCEL ) {
				this._eventBus.publishEvent(EventType.OPEN_MAIN_MENU);
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
			if ( this.status === GameStatus.NEXT_LEVEL ) {
				this.gotoNextLevel();
				this.status = GameStatus.RUNNING;
			}
			this.gameTime += time;
			if ( this.gameTime >= Constants.TICK_LENGTH ) {
				// update the game only TICKS_PER_SECOND per second
				this.gameTime = 0;
				if (!this._actorManager.isPaused()) {
					this._actorManager.updateActors();
				}
			}
			if (this.gameTime === 0 || this.hasBackgroundAnimation()) {
				// but render every frame to allow background animations (torch flickering, ...)
				this.render();
				this.root.render();
			}
		}

		/*
			Function: handleMouseMove
			Triggered by mouse motion events.

			Parameters:
			event - the JQueryMouseEventObject
		*/
		handleMouseMove(event: JQueryMouseEventObject) {
			var pos: Yendor.Position = this.root.getPositionFromPixels( event.pageX, event.pageY );
			this._eventBus.publishEvent(EventType.MOUSE_MOVE, pos);
		}

		/*
			Function: handleMouseClick
			Triggered by mouse button click events.

			Parameters:
			event - the JQueryMouseEventObject
		*/
		handleMouseClick(event: JQueryMouseEventObject) {
			this._eventBus.publishEvent(EventType.MOUSE_CLICK, <MouseButton>event.which);
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
			this.root.clearText();
			this._map.render(this.root);
			this._actorManager.renderActors(this.root);
			this.guiManager.renderGui(this.root);
		}
	}
}
