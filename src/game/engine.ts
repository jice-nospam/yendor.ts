module Game {
    "use strict";

	/*
		Property: SAVEFILE_VERSION
		This is the savegame format version. To be incremented when the format changes
		to keep the game from trying to load data with an old format.
		This should be an integer.
	*/
    const SAVEFILE_VERSION: string = "15";

    export abstract class DungeonScene extends Umbra.Scene {
        protected _map: Map;
        protected _mapRenderer: MapRendererNode;
        protected _topotologyMap: TopologyMap;
        protected _rng: Yendor.Random;
        protected _actorManager: ActorManagerNode;
        // singleton getters
        get map() { return this._map; }
        get topologyMap() { return this._topotologyMap; }
        get rng() { return this._rng; }
        get actorManager() { return this._actorManager; }
        get mapRenderer() { return this._mapRenderer; }

        onInit(): void {
            this._rng = new Yendor.ComplementaryMultiplyWithCarryRandom();
            this._actorManager = new ActorManagerNode();
            this._map = new Map();
            this._mapRenderer = new DungeonRendererNode(new LightDungeonShader());
            // adding nodes as children ensure they are updated/rendered by Umbra
            this.addChild(this._mapRenderer);
            this.addChild(this._actorManager);
            this.createGui();

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
            // Gizmo configuration
            Gizmo.setConfiguration(
                {
                    input: {
                        focusNextWidgetAxisName: PlayerAction[PlayerAction.MOVE_SOUTH],
                        focusPreviousWidgetAxisName: PlayerAction[PlayerAction.MOVE_NORTH],
                        cancelAxisName: PlayerAction[PlayerAction.CANCEL],
                        validateAxisName: PlayerAction[PlayerAction.VALIDATE]
                    },
                    color: {
                        background: Constants.MENU_BACKGROUND,
                        backgroundActive: Constants.MENU_BACKGROUND_ACTIVE,
                        backgroundDisabled: Constants.MENU_BACKGROUND,
                        foreground: Constants.MENU_FOREGROUND,
                        foregroundActive: Constants.MENU_FOREGROUND_ACTIVE,
                        foregroundDisabled: Constants.MENU_FOREGROUND_DISABLED,
                        titleForeground: Constants.TITLE_FOREGROUND
                    }
                }
            );
        }

        createGui() {
            this.addChild(new StatusPanel(Constants.CONSOLE_WIDTH, Constants.STATUS_PANEL_HEIGHT));
            this.addChild(new InventoryPanel());
            this.addChild(new MainMenu());
            this.addChild(new TilePicker());
        }
    }

	/*
		Class: Engine
		Handles frame rendering and world updating.
	*/
    export class Engine extends DungeonScene implements Umbra.EventListener {
        static instance: Engine;

        enableEvents: boolean = true;

        private status: GameStatus;
        public persister: Persister = new LocalStoragePersister();
        private dungeonLevel: number = 1;
        private gameTime: number = 0;

        onInit(): void {
            super.onInit();
            Engine.instance = this;

            Umbra.EventManager.registerEventListener(this, EventType[EventType.CHANGE_STATUS]);
            Umbra.EventManager.registerEventListener(this, EventType[EventType.NEW_GAME]);

            var savedVersion = this.persister.loadFromKey(Constants.PERSISTENCE_VERSION_KEY);
            if (savedVersion && savedVersion.toString() === SAVEFILE_VERSION) {
                this.loadGame();
            } else {
                this.onNewGame();
            }
        }

        onChangeStatus(status: GameStatus) {
            this.status = status;
            if (status === GameStatus.DEFEAT) {
                log("You died!", Constants.LOG_CRIT_COLOR);                
            }
        }

        onNewGame() {
            this.dungeonLevel = 1;
            this.deleteSavedGame();
            this._map.init(Constants.CONSOLE_WIDTH, Constants.CONSOLE_HEIGHT - Constants.STATUS_PANEL_HEIGHT);
            this._actorManager.reset(true);
            var dungeonBuilder: BspDungeonBuilder = new BspDungeonBuilder(this.dungeonLevel);
            dungeonBuilder.build(this._map);
            this._topotologyMap = dungeonBuilder.topologyMap;
            this.status = GameStatus.RUNNING;
            this._mapRenderer.onInit();

            // starting inventory
            var player: Actor = this._actorManager.getPlayer();
            var torch = ActorFactory.create(ActorType.TORCH, player.x, player.y);
            torch.pickable.pick(torch, player);

            // this helps debugging items
            if (Yendor.urlParams[Constants.URL_PARAM_DEBUG]) {
                [ActorType.STAFF_OF_MAPPING, ActorType.SUNROD, ActorType.CANDLE, ActorType.SCROLL_OF_CONFUSION,
                    ActorType.WOODEN_SHIELD, ActorType.STAFF_OF_TELEPORTATION,
                    ActorType.STAFF_OF_LIFE_DETECTION, ActorType.REGENERATION_POTION,
                    ActorType.SHORT_BOW
                ].forEach((type: ActorType) => { this._actorManager.addItem(ActorFactory.create(type, player.x, player.y)); });
            }
        }

        private loadGame() {
            this.dungeonLevel = this.persister.loadFromKey(Constants.PERSISTENCE_DUNGEON_LEVEL);
            this.persister.loadFromKey(Constants.PERSISTENCE_MAP_KEY, this._map);
            ActorFactory.load(this.persister);
            // TODO save/restore topologyMap
            Umbra.EventManager.publishEvent(EventType[EventType.LOAD_GAME]);
            this.status = GameStatus.RUNNING;
            this._topotologyMap = this.persister.loadFromKey(Constants.PERSISTENCE_TOPOLOGY_MAP);
        }

        saveGame() {
            if (this._actorManager.isPlayerDead()) {
                this.deleteSavedGame();
            } else {
                this.persister.saveToKey(Constants.PERSISTENCE_DUNGEON_LEVEL, this.dungeonLevel);
                this.persister.saveToKey(Constants.PERSISTENCE_VERSION_KEY, SAVEFILE_VERSION);
                this.persister.saveToKey(Constants.PERSISTENCE_MAP_KEY, this._map);
                this.persister.saveToKey(Constants.PERSISTENCE_TOPOLOGY_MAP, this._topotologyMap);
                ActorFactory.save(this.persister);
                Umbra.EventManager.publishEvent(EventType[EventType.SAVE_GAME]);
            }
        }

        private deleteSavedGame() {
            this.persister.deleteKey(Constants.PERSISTENCE_DUNGEON_LEVEL);
            this.persister.deleteKey(Constants.PERSISTENCE_VERSION_KEY);
            this.persister.deleteKey(Constants.PERSISTENCE_MAP_KEY);
            ActorFactory.deleteSavedGame(this.persister);
            Umbra.EventManager.publishEvent(EventType[EventType.DELETE_SAVEGAME]);
        }

		/*
			Function: gotoNextLevel
			Go down one level in the dungeon
		*/
        private gotoNextLevel() {
            this.dungeonLevel++;
            this._actorManager.reset(false);
            var player: Actor = this._actorManager.getPlayer();
            player.destructible.heal(player.destructible.maxHp / 2);
            log("You take a moment to rest, and recover your strength.", Constants.LOG_WARN_COLOR);
            log("After a rare moment of peace, you descend deeper\ninto the heart of the dungeon...", Constants.LOG_WARN_COLOR);
            log("Level..." + this.dungeonLevel, Constants.LOG_WARN_COLOR);
            this._map.init(Constants.CONSOLE_WIDTH, Constants.CONSOLE_HEIGHT - Constants.STATUS_PANEL_HEIGHT);
            var dungeonBuilder: BspDungeonBuilder = new BspDungeonBuilder(this.dungeonLevel);
            dungeonBuilder.build(this._map);
        }

		/*
			Function: handleKeyboardInput
			Handle main menu shortcut
		*/
        private handleKeyboardInput(): void {
            if (Gizmo.Widget.getActiveModal() === undefined && getLastPlayerAction() === PlayerAction.CANCEL) {
                Umbra.Input.resetInput();
                Umbra.EventManager.publishEvent(EventType[EventType.OPEN_MAIN_MENU]);
            }
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
        }
    }
}
