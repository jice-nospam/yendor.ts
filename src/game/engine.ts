module Game {
    "use strict";

	/*
		Property: SAVEFILE_VERSION
		This is the savegame format version. To be incremented when the format changes
		to keep the game from trying to load data with an old format.
		This should be an integer.
	*/
    const SAVEFILE_VERSION: string = "12";

    export abstract class DungeonScene extends Umbra.Scene {
        protected _map: Map;
        protected _topotologyMap: TopologyMap;
        protected _rng: Yendor.Random;
        protected _actorManager: ActorManager;
        // singleton getters
        get map() { return this._map; }
        get topologyMap() { return this._topotologyMap; }
        get rng() { return this._rng; }
        get actorManager() { return this._actorManager; }

        onInit(): void {
            this._rng = new Yendor.ComplementaryMultiplyWithCarryRandom();
            this._actorManager = new ActorManager();
            this._map = new Map();
        }

    }

	/*
		Class: Engine
		Handles frame rendering and world updating.
	*/
    export class Engine extends DungeonScene implements Umbra.EventListener {
        static instance: Engine;

        enableEvents: boolean = true;

        private guiManager: GuiManager;
        private status: GameStatus;
        private persister: Persister = new LocalStoragePersister();
        private dungeonLevel: number = 1;
        private gameTime: number = 0;

        onInit(): void {
            super.onInit();
            Engine.instance = this;
            // Umbra player input configuration
            Umbra.Input.registerAxes([
                // cardinal movements
                { name: PlayerAction[PlayerAction.MOVE_WEST], positiveButton: Umbra.KeyCode.DOM_VK_LEFT, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.MOVE_WEST], positiveButton: Umbra.KeyCode.DOM_VK_NUMPAD4, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.MOVE_WEST], positiveButton: Umbra.KeyCode.DOM_VK_H, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.MOVE_EAST], positiveButton: Umbra.KeyCode.DOM_VK_RIGHT, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.MOVE_EAST], positiveButton: Umbra.KeyCode.DOM_VK_NUMPAD6, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.MOVE_EAST], positiveButton: Umbra.KeyCode.DOM_VK_L, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.MOVE_NORTH], positiveButton: Umbra.KeyCode.DOM_VK_UP, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.MOVE_NORTH], positiveButton: Umbra.KeyCode.DOM_VK_NUMPAD8, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.MOVE_NORTH], positiveButton: Umbra.KeyCode.DOM_VK_K, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.MOVE_SOUTH], positiveButton: Umbra.KeyCode.DOM_VK_DOWN, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.MOVE_SOUTH], positiveButton: Umbra.KeyCode.DOM_VK_NUMPAD2, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.MOVE_SOUTH], positiveButton: Umbra.KeyCode.DOM_VK_J, type: Umbra.AxisType.KEY_OR_BUTTON },
                // diagonal movements
                { name: PlayerAction[PlayerAction.MOVE_NW], positiveButton: Umbra.KeyCode.DOM_VK_NUMPAD7, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.MOVE_NW], positiveButton: Umbra.KeyCode.DOM_VK_Y, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.MOVE_SW], positiveButton: Umbra.KeyCode.DOM_VK_NUMPAD1, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.MOVE_SW], positiveButton: Umbra.KeyCode.DOM_VK_B, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.MOVE_NE], positiveButton: Umbra.KeyCode.DOM_VK_NUMPAD9, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.MOVE_NE], positiveButton: Umbra.KeyCode.DOM_VK_U, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.MOVE_SE], positiveButton: Umbra.KeyCode.DOM_VK_NUMPAD3, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.MOVE_SE], positiveButton: Umbra.KeyCode.DOM_VK_N, type: Umbra.AxisType.KEY_OR_BUTTON },
                // other movements
                { name: PlayerAction[PlayerAction.WAIT], positiveButton: Umbra.KeyCode.DOM_VK_NUMPAD5, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.WAIT], positiveButton: Umbra.KeyCode.DOM_VK_SPACE, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.GRAB], positiveButton: Umbra.KeyCode.DOM_VK_G, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.USE_ITEM], positiveButton: Umbra.KeyCode.DOM_VK_I, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.DROP_ITEM], positiveButton: Umbra.KeyCode.DOM_VK_D, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.THROW_ITEM], positiveButton: Umbra.KeyCode.DOM_VK_T, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.VALIDATE], positiveButton: Umbra.KeyCode.DOM_VK_ENTER, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.VALIDATE], positiveButton: Umbra.KeyCode.DOM_VK_RETURN, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.CANCEL], positiveButton: Umbra.KeyCode.DOM_VK_ESCAPE, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.FIRE], positiveButton: Umbra.KeyCode.DOM_VK_F, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.ZAP], positiveButton: Umbra.KeyCode.DOM_VK_Z, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.ACTIVATE], positiveButton: Umbra.KeyCode.DOM_VK_E, type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.MOVE_DOWN], positiveButton: ">", type: Umbra.AxisType.KEY_OR_BUTTON },
                { name: PlayerAction[PlayerAction.MOVE_UP], positiveButton: "<", type: Umbra.AxisType.KEY_OR_BUTTON },
            ]);
            this.initEventBus();
            this.guiManager = new GuiManager();
            this.guiManager.createStatusPanel();

            var savedVersion = this.persister.loadFromKey(Constants.PERSISTENCE_VERSION_KEY);
            if (savedVersion && savedVersion.toString() === SAVEFILE_VERSION) {
                this.loadGame();
            } else {
                this.createNewGame();
            }
            this.guiManager.createOtherGui();
        }

        private initEventBus() {
            Umbra.EventManager.registerEventListener(this, EventType[EventType.CHANGE_STATUS]);
            Umbra.EventManager.registerEventListener(this, EventType[EventType.NEW_GAME]);
            Umbra.EventManager.registerEventListener(this, EventType[EventType.GAIN_XP]);
        }

        private createNewGame() {
            this._actorManager.clear();
            this._actorManager.createStairs();
            this._actorManager.createPlayer();
            this._map.init(Constants.CONSOLE_WIDTH, Constants.CONSOLE_HEIGHT - Constants.STATUS_PANEL_HEIGHT);
            var dungeonBuilder: BspDungeonBuilder = new BspDungeonBuilder(this.dungeonLevel);
            dungeonBuilder.build(this._map);
            this._topotologyMap = dungeonBuilder.topologyMap;
            this.status = GameStatus.RUNNING;

            // this helps debugging items
            if (Yendor.urlParams[Constants.URL_PARAM_DEBUG]) {
                var player: Actor = this._actorManager.getPlayer();
                [ActorType.MAP_REVEAL_STAFF, ActorType.SHORT_SWORD, ActorType.FIREBALL_SCROLL, ActorType.CONFUSION_SCROLL,
                    ActorType.WOODEN_SHIELD, ActorType.TELEPORT_STAFF,
                    ActorType.LIFE_DETECT_STAFF, ActorType.REGENERATION_POTION,
                    ActorType.SHORT_BOW
                ].forEach((type: ActorType) => { this._actorManager.addItem(ActorFactory.create(type, player.x, player.y)); });
            }
        }

        private loadGame() {
            this.dungeonLevel = this.persister.loadFromKey(Constants.PERSISTENCE_DUNGEON_LEVEL);
            this.persister.loadFromKey(Constants.PERSISTENCE_MAP_KEY, this._map);
            ActorFactory.load(this.persister);
            this._actorManager.load(this.persister);
            // TODO save/restore topologyMap
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
                ActorFactory.save(this.persister);
                this._actorManager.save(this.persister);
                this.persister.saveToKey(Constants.STATUS_PANEL_ID, this.guiManager.getGui(Constants.STATUS_PANEL_ID));
            }
        }

        private deleteSavedGame() {
            this.persister.deleteKey(Constants.PERSISTENCE_DUNGEON_LEVEL);
            this.persister.deleteKey(Constants.PERSISTENCE_VERSION_KEY);
            this.persister.deleteKey(Constants.PERSISTENCE_MAP_KEY);
            ActorFactory.deleteSavedGame(this.persister);
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
            this.dungeonLevel++;
            this._actorManager.clear();
            this._actorManager.createStairs();
            // don't reset the player
            var player: Actor = this._actorManager.getPlayer();
            this._actorManager.addCreature(player);
            player.destructible.heal(player.destructible.maxHp / 2);
            log("You take a moment to rest, and recover your strength.", Constants.LOG_WARN_COLOR);
            log("After a rare moment of peace, you descend deeper\ninto the heart of the dungeon...", Constants.LOG_WARN_COLOR);
            log("Level..." + this.dungeonLevel, Constants.LOG_WARN_COLOR);
            this._map.init(Constants.CONSOLE_WIDTH, Constants.CONSOLE_HEIGHT - Constants.STATUS_PANEL_HEIGHT);
            var dungeonBuilder: BspDungeonBuilder = new BspDungeonBuilder(this.dungeonLevel);
            dungeonBuilder.build(this._map);
        }

        onChangeStatus(status: GameStatus) {
            this.status = status;
        }

        onNewGame() {
            this.guiManager.getGui(Constants.STATUS_PANEL_ID).clear();
            this.dungeonLevel = 1;
            this.createNewGame();
        }

        onGainXp(amount: number) {
            this._actorManager.getPlayer().addXp(amount);
        }

        private hasBackgroundAnimation(): boolean {
            // TODO
            return false;
        }

		/*
			Function: handleKeyboardInput
			Checks if the player pressed a key and resume actors simulation when needed.
		*/
        private handleKeyboardInput(): void {
            if (Umbra.Input.getLastAxisName() !== undefined && !Gui.getActiveModal()) {
                if (!this.handleGlobalShortcuts()) {
                    this.actorManager.resume();
                }
            }
        }

        private handleGlobalShortcuts(): boolean {
            if (getLastPlayerAction() === PlayerAction.CANCEL) {
                Umbra.Input.resetInput();
                Umbra.EventManager.publishEvent(EventType[EventType.OPEN_MAIN_MENU]);
                return true;
            }
            return false;
        }
        
		/*
			Function: onUpdate
			Update the game world

			Parameters:
			time - elapsed time since the last update in milliseconds
		*/
        onUpdate(time: number): void {
            this.handleKeyboardInput();
            if (this.status === GameStatus.NEXT_LEVEL) {
                this.gotoNextLevel();
                this.status = GameStatus.RUNNING;
            }
            if (!this._actorManager.isPaused()) {
                this._actorManager.updateActors();
            }
        }

        /*
			Function: onRender
			The actual frame rendering. Render objects in this order:
			- the map
			- the corpses
			- the living actors
			- the GUI
		*/
        onRender(con: Yendor.Console): void {
            con.clearText();
            this.computePlayerFov();
            this._map.render(con);
            this._actorManager.renderActors(con);
            this.guiManager.renderGui(con);
        }

        onTerm(): void {
            // empty
        }
    }
}
