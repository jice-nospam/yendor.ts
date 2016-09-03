import * as Core from "../fwk/core/main";
import * as Yendor from "../fwk/yendor/main";
import * as Umbra from "../fwk/umbra/main";
import * as Gui from "../fwk/gui/main";
import * as Actors from "../fwk/actors/main";
import * as Map from "../fwk/map/main";
import { Constants, GameStatus } from "./base";
import {StatusPanel} from "./gui_status";
import {InventoryPanel} from "./gui_inventory";
import {TilePicker} from "./gui_tilepicker";
import {MainMenu} from "./gui_menu";
import {EventType} from "./custom_events"; // TODO
import {ActorType} from "./config_actors";
import * as conf from "./config_dungeons";
import {registerPersistentClasses} from "./config_persistent";

/**
    Property: SAVEFILE_VERSION
    This is the savegame format version. To be incremented when the format changes
    to keep the game from trying to load data with an old format.
    This should be an integer.
*/
const SAVEFILE_VERSION: string = "16";

export abstract class DungeonScene extends Map.MapScene implements Umbra.EventListener {
    protected _topotologyMap: Map.TopologyMap;
    protected dungeonLevel: number = 1;

    constructor() {
        super(new Map.DungeonRendererNode(new Map.LightDungeonShader(new Map.BasicMapShader())), new Core.LocalStoragePersister());
    }


    // singleton getters
    get topologyMap() { return this._topotologyMap; }
    onInit(): void {
        super.onInit();
    }

    protected buildMap(dungeonLevel: number, map: Map.Map): Map.TopologyMap {
        map.init(Constants.CONSOLE_WIDTH, Constants.CONSOLE_HEIGHT - Constants.STATUS_PANEL_HEIGHT);
        this.renderer.initForNewMap();
        let dungeonBuilder: Map.BspDungeonBuilder = new Map.BspDungeonBuilder(dungeonLevel, {
            creatureProbabilities: conf.creatureProbabilities,
            itemProbabilities: conf.itemProbabilities,
            wallLightProbabilities: conf.wallLightProbabilities,
            doorProbabilities: conf.doorProbabilities,
            keyProbabilities: conf.keyProbabilities,
            roomMinSize: Constants.ROOM_MIN_SIZE,
            maxMonstersPerRoom: Constants.MAX_MONSTERS_PER_ROOM,
            maxItemsPerRoom: Constants.MAX_ITEMS_PER_ROOM,
            noMonster: Yendor.urlParams[Constants.URL_PARAM_NO_MONSTER] !== undefined,
            noItem: Yendor.urlParams[Constants.URL_PARAM_NO_ITEM] !== undefined,
            minTorches: Constants.DUNGEON_MIN_TORCHES,
            maxTorches: Constants.DUNGEON_MAX_TORCHES
        });
        dungeonBuilder.build(map);
        return dungeonBuilder.topologyMap;
    }

    newLevel() {
        // remove all actors but the player and its inventory (except unused keys)
        let player: Actors.Player = Actors.Actor.specialActors[Actors.SpecialActors.PLAYER];
        let toRemove: Actors.Actor[] = [];
        Actors.Actor.list.map((actor: Actors.Actor) => {
            if ( actor !== player && (actor.isA("key") || !player.contains(actor.id))) {
                toRemove.push(actor);
            }
        });
        toRemove.map((actor: Actors.Actor) => { actor.destroy(); });
        this.createStairs();
    }

    newGame() {
        while (Actors.Actor.list.length > 0) {
            Actors.Actor.list[Actors.Actor.list.length - 1].destroy();
        }
        this.createStairs();
        this.createPlayer();
    }

    /**
        Function: createStairs
        Create the actors for up and down stairs. The position is not important, actors will be placed by the dungeon builder.
    */
    createStairs() {
        Actors.Actor.specialActors[Actors.SpecialActors.STAIR_UP] = Actors.ActorFactory.create(ActorType[ActorType.STAIRS_UP]);
        Actors.Actor.specialActors[Actors.SpecialActors.STAIR_DOWN] = Actors.ActorFactory.create(ActorType[ActorType.STAIRS_DOWN]);
    }

    createPlayer() {
        let player: Actors.Actor = Actors.ActorFactory.create(ActorType[ActorType.PLAYER], this.playerTilePicker, this.playerInventoryPicker);
        Actors.Actor.specialActors[Actors.SpecialActors.PLAYER] = player;
        player.register();
    }
}

/**
    Class: Engine
    Handles frame rendering and world updating.
*/
export class Engine extends DungeonScene implements Umbra.EventListener {
    static instance: Engine;

    private status: GameStatus;
    private gameTime: number = 0;
    private gui: {
        status: StatusPanel,
        inventory: InventoryPanel,
        tilePicker: TilePicker,
        mainMenu: MainMenu
    };

    onInit(): void {
        this.status = GameStatus.INITIALIZING;
        registerPersistentClasses();

        super.onInit();
        this.createGui();
        Engine.instance = this;

        Umbra.EventManager.registerEventListener(this, EventType[EventType.CHANGE_STATUS]);
        Umbra.EventManager.registerEventListener(this, EventType[EventType.NEW_GAME]);

        if ( Yendor.urlParams[Constants.URL_PARAM_CLEAR_SAVEGAME] ) {
            this.onNewGame();
        } else {
            this.persister.loadFromKey(Constants.PERSISTENCE_VERSION_KEY).then((savedVersion) => {
                if (savedVersion && savedVersion.toString() === SAVEFILE_VERSION) {
                    this.loadGame();
                } else {
                    this.onNewGame();
                }
            });
        }
    }

    createGui() {
        this.gui = {
            status: new StatusPanel(),
            inventory: new InventoryPanel(),
            mainMenu : new MainMenu(),
            tilePicker: new TilePicker()
        }
        this.gui.status.init(Constants.CONSOLE_WIDTH, Constants.STATUS_PANEL_HEIGHT);
        this.playerInventoryPicker = this.gui.inventory;
        this.playerTilePicker = this.gui.tilePicker;
        this.addChild(this.gui.status);
        this.addChild(this.gui.inventory);
        this.addChild(this.gui.mainMenu);
        this.addChild(this.gui.tilePicker);
        // Gui configuration
        Gui.setConfiguration(
            {
                input: {
                    focusNextWidgetAxisName: Actors.PlayerAction[Actors.PlayerAction.MOVE_SOUTH],
                    focusPreviousWidgetAxisName: Actors.PlayerAction[Actors.PlayerAction.MOVE_NORTH],
                    cancelAxisName: Actors.PlayerAction[Actors.PlayerAction.CANCEL],
                    validateAxisName: Actors.PlayerAction[Actors.PlayerAction.VALIDATE]
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

    onChangeStatus(status: GameStatus) {
        this.status = status;
        if (status === GameStatus.DEFEAT) {
            Umbra.logger.critical("You died!");
        }
    }

    onNewGame() {
        this.dungeonLevel = 1;
        this.deleteSavedGame();
        this.newGame();
        this._topotologyMap = this.buildMap(this.dungeonLevel, this.map);
        this.status = GameStatus.RUNNING;
        this.gui.status.clear();

        // starting inventory
        let player: Actors.Actor = Actors.Actor.specialActors[Actors.SpecialActors.PLAYER];
        let torch = Actors.ActorFactory.create(ActorType[ActorType.TORCH]);
        torch.moveTo(player.pos.x, player.pos.y);
        torch.register();
        torch.pickable.pick(torch, player);

        // this helps debugging items
        if (Umbra.logger.isDebugEnabled()) {
            [ActorType.LANTERN, ActorType.LANTERN, ActorType.OIL_FLASK
            ].forEach((type: ActorType) => {
                let actor: Actors.Actor =  Actors.ActorFactory.create(ActorType[type]);
                actor.register();
                actor.moveTo(player.pos.x, player.pos.y);
            });
        }
    }

    private loadGame() {
        try {
            this.persister.loadFromKey(Constants.PERSISTENCE_DUNGEON_LEVEL).then((dungeonLevel) => {
                this.dungeonLevel = dungeonLevel;
                return this.persister.loadFromKey(Constants.PERSISTENCE_MAP_KEY, this._map);
            }).then((x) => {
                return Actors.ActorFactory.load(this.persister);
            }).then(() => {
                return Actors.Actor.load(this.persister);
            }).then(() => {
                Actors.Actor.specialActors[Actors.SpecialActors.PLAYER].ai.setPickers(this.playerTilePicker, this.playerInventoryPicker);
                return this.persister.loadFromKey(Constants.PERSISTENCE_TOPOLOGY_MAP);
            }).then((topologyMap) => {
                this._topotologyMap = topologyMap;
                this.persister.loadFromKey(Constants.PERSISTENCE_STATUS_PANEL, this.gui.status).then((x) => {
                    this.status = GameStatus.RUNNING;
                });
            });
        } catch (e) {
            Umbra.logger.critical("Error while loading game :" + e);
            this.onNewGame();
        }
    }

    onSaveGame(persister: Core.Persister) {
        if (Actors.Actor.specialActors[Actors.SpecialActors.PLAYER].destructible.isDead()) {
            this.deleteSavedGame();
        } else {
            persister.saveToKey(Constants.PERSISTENCE_DUNGEON_LEVEL, this.dungeonLevel);
            persister.saveToKey(Constants.PERSISTENCE_VERSION_KEY, SAVEFILE_VERSION);
            persister.saveToKey(Constants.PERSISTENCE_MAP_KEY, this._map);
            persister.saveToKey(Constants.PERSISTENCE_TOPOLOGY_MAP, this._topotologyMap);
            persister.saveToKey(Constants.PERSISTENCE_STATUS_PANEL, this.gui.status);
            Actors.ActorFactory.save(persister);
        }
    }

    private deleteSavedGame() {
        this.persister.deleteKey(Constants.PERSISTENCE_DUNGEON_LEVEL);
        this.persister.deleteKey(Constants.PERSISTENCE_VERSION_KEY);
        this.persister.deleteKey(Constants.PERSISTENCE_MAP_KEY);
        Actors.ActorFactory.deleteSavedGame(this.persister);
        Actors.Actor.deleteSavedGame(this.persister);
        this.persister.deleteKey(Constants.PERSISTENCE_STATUS_PANEL);
    }

    /**
        Function: gotoNextLevel
        Go down one level in the dungeon
    */
    private gotoNextLevel() {
        this.dungeonLevel++;
        this.newLevel();
        let player: Actors.Actor = Actors.Actor.specialActors[Actors.SpecialActors.PLAYER];
        player.destructible.heal(player, player.destructible.maxHp / 2);
        Umbra.logger.warn("You take a moment to rest, and recover your strength.");
        Umbra.logger.warn("After a rare moment of peace, you descend deeper\ninto the heart of the dungeon...");
        Umbra.logger.warn("Level..." + this.dungeonLevel);
        this._topotologyMap = this.buildMap(this.dungeonLevel, this._map);
    }

    /**
        Function: handleKeyboardInput
        Handle main menu shortcut
    */
    private handleKeyboardInput(): void {
        if (Gui.Widget.getActiveModal() === undefined && Actors.getLastPlayerAction() === Actors.PlayerAction.CANCEL) {
            Umbra.resetInput();
            Umbra.EventManager.publishEvent(Constants.EVENT_OPEN_MAIN_MENU);
        }
    }

    /**
        Function: onUpdate
        Update the game world

        Parameters:
        time - elapsed time since the last update in milliseconds
    */
    onUpdate(time: number): void {
        if ( this.status === GameStatus.INITIALIZING ) {
            return;
        }
        let player: Actors.Actor = Actors.Actor.specialActors[Actors.SpecialActors.PLAYER];
        if (! player) {
            return;
        }
        let schedulerPaused = Actors.Actor.scheduler.isPaused();
        super.onUpdate(time);
        if ( ! schedulerPaused && Actors.Actor.scheduler.isPaused()) {
            // save every time the scheduler pauses
            this.persister.saveToKey(Actors.PERSISTENCE_ACTORS_KEY, Actors.Actor.list);
            this.onSaveGame(this.persister);
        }
        this.handleKeyboardInput();
        if (this.status === GameStatus.NEXT_LEVEL) {
            this.gotoNextLevel();
            this.status = GameStatus.RUNNING;
        }
        if (player.destructible.isDead()) {
            Umbra.EventManager.publishEvent(EventType[EventType.CHANGE_STATUS], GameStatus.DEFEAT);
        }

    }


    onRender(con: Yendor.Console): void {
        // rendering done by a MapRendererNode
    }
}
