import * as Yendor from "../fwk/yendor/main";
import * as Umbra from "../fwk/umbra/main";
import * as Gui from "../fwk/gui/main";
import * as Actors from "../fwk/actors/main";
import * as Map from "../fwk/map/main";
import {
    EVENT_CHANGE_STATUS,
    EVENT_NEW_GAME,
    EVENT_OPEN_MAIN_MENU,
    GameStatus,
    MENU_BACKGROUND,
    MENU_BACKGROUND_ACTIVE,
    MENU_FOREGROUND,
    MENU_FOREGROUND_ACTIVE,
    MENU_FOREGROUND_DISABLED,
    TITLE_FOREGROUND,
    PERSISTENCE_VERSION_KEY,
    PERSISTENCE_DUNGEON_LEVEL,
    PERSISTENCE_MAP_KEY,
    PERSISTENCE_TOPOLOGY_MAP,
    PERSISTENCE_STATUS_PANEL,
    STATUS_PANEL_HEIGHT,
    URL_PARAM_CLEAR_SAVEGAME,
    URL_PARAM_NO_ITEM,
    URL_PARAM_NO_MONSTER,
} from "./base";
import {StatusPanel} from "./gui_status";
import {InventoryPanel} from "./gui_inventory";
import {LootPanel} from "./gui_loot";
import {TilePicker} from "./gui_tilepicker";
import {NumberSelector} from "./gui_input_number";
import {MainMenu} from "./gui_menu";
import {DebugMenu} from "./gui_debug";
import {ACTOR_TYPES} from "./config_actors";
import {dungeonConfig} from "./config_dungeons";
import {registerPersistentClasses} from "./config_persistent";

/**
 * Property: SAVEFILE_VERSION
 * This is the savegame format version. To be incremented when the format changes
 * to keep the game from trying to load data with an old format.
 * This should be an integer.
 */
const SAVEFILE_VERSION: string = "17";

export abstract class DungeonScene extends Map.MapScene implements Umbra.IEventListener {
    protected _topotologyMap: Map.TopologyMap;
    protected dungeonLevel: number = 1;

    constructor() {
        super(new Map.DungeonRendererNode(new Map.LightDungeonShader(new Map.BasicMapShader())),
            new Yendor.IndexedDbPersister());
        dungeonConfig.noItem = Yendor.urlParams[URL_PARAM_NO_ITEM] !== undefined;
        dungeonConfig.noMonster = Yendor.urlParams[URL_PARAM_NO_MONSTER] !== undefined;
    }

    // singleton getters
    get topologyMap() { return this._topotologyMap; }
    public onInit(): void {
        super.onInit();
    }

    public newLevel() {
        // remove all actors but the player and its inventory (except unused keys)
        let player: Actors.Actor = Actors.Actor.specialActors[Actors.SpecialActorsEnum.PLAYER];
        let toRemove: Actors.Actor[] = [];
        for (let actor of Actors.Actor.list) {
            if ( actor !== player && (actor.isA("key[s]") || !player.contains(actor.id, true))) {
                toRemove.push(actor);
            }
        }
        for (let actor of toRemove) {
            actor.destroy();
        }
        this.createStairs();
    }

    public newGame() {
        while (Actors.Actor.list.length > 0) {
            Actors.Actor.list[Actors.Actor.list.length - 1].destroy();
        }
        this.createStairs();
        this.createPlayer();
    }

    /**
     * Function: createStairs
     * Create the actors for up and down stairs. The position is not important,
     * actors will be placed by the dungeon builder.
     */
    public createStairs() {
        let stairUp: Actors.Actor|undefined = Actors.ActorFactory.create(ACTOR_TYPES.STAIRS_UP);
        if (!stairUp) {
            Umbra.logger.critical("Missing actor type " + ACTOR_TYPES.STAIRS_UP);
            return;
        }
        Actors.Actor.specialActors[Actors.SpecialActorsEnum.STAIR_UP] = stairUp;
        let stairDown: Actors.Actor|undefined = Actors.ActorFactory.create(ACTOR_TYPES.STAIRS_DOWN);
        if (!stairDown) {
            Umbra.logger.critical("Missing actor type " + ACTOR_TYPES.STAIRS_DOWN);
            return;
        }
        Actors.Actor.specialActors[Actors.SpecialActorsEnum.STAIR_DOWN] = stairDown;

    }

    public createPlayer() {
        let player: Actors.Actor|undefined = Actors.ActorFactory.create(ACTOR_TYPES.PLAYER,
            this.playerTilePicker, this.playerInventoryPicker, this.playerLootHandler);
        if ( !player) {
            Umbra.logger.critical("Missing actor type " + ACTOR_TYPES.PLAYER);
            return;
        }
        Actors.Actor.specialActors[Actors.SpecialActorsEnum.PLAYER] = player;
        player.register();
    }

    protected buildMap(dungeonLevel: number, map: Map.Map): Map.TopologyMap {
        map.init(Umbra.application.getConsole().width,
            Umbra.application.getConsole().height - STATUS_PANEL_HEIGHT);
        this.renderer.initForNewMap();
        let dungeonBuilder: Map.BspDungeonBuilder = new Map.BspDungeonBuilder(dungeonLevel, dungeonConfig);
        dungeonBuilder.build(map);
        return dungeonBuilder.topologyMap;
    }
}

/**
 * Class: Engine
 * Handles frame rendering and world updating.
 */
export class Engine extends DungeonScene implements Umbra.IEventListener {
    private status: GameStatus;
    private gui: {
        status: StatusPanel,
        inventory: InventoryPanel,
        tilePicker: TilePicker,
        loot: LootPanel,
        mainMenu: MainMenu,
        debugMenu?: DebugMenu,
    };

    public onInit(): void {
        this.status = GameStatus.INITIALIZING;
        registerPersistentClasses();

        super.onInit();
        this.createGui();

        Umbra.EventManager.registerEventListener(this, EVENT_CHANGE_STATUS);
        Umbra.EventManager.registerEventListener(this, EVENT_NEW_GAME);

        if ( Yendor.urlParams[URL_PARAM_CLEAR_SAVEGAME] ) {
            this.onNewGame();
        } else {
            this.persister.loadFromKey(PERSISTENCE_VERSION_KEY).then((savedVersion) => {
                if (savedVersion && savedVersion.toString() === SAVEFILE_VERSION) {
                    this.loadGame();
                } else {
                    this.onNewGame();
                }
            });
        }
    }

    public onTerm() {
        super.onTerm();
        Umbra.EventManager.unregisterEventListener(this, EVENT_CHANGE_STATUS);
        Umbra.EventManager.unregisterEventListener(this, EVENT_NEW_GAME);
    }

    public onChangeStatus(status: GameStatus) {
        this.status = status;
        if (status === GameStatus.DEFEAT) {
            Umbra.logger.critical("You died!");
        }
    }

    public onNewGame() {
        this.dungeonLevel = 1;
        this.deleteSavedGame();
        this.newGame();
        this._topotologyMap = this.buildMap(this.dungeonLevel, this.map);
        this.status = GameStatus.RUNNING;
        this.gui.status.clear();

        // starting inventory
        let player: Actors.Actor = Actors.Actor.specialActors[Actors.SpecialActorsEnum.PLAYER];
        // let torch = Actors.ActorFactory.create(ACTOR_TYPES.TORCH);
        // if ( torch ) {
        //     torch.moveTo(player.pos.x, player.pos.y);
        //     torch.register();
        //     torch.pickable.pick(torch, player, false);
        // }

        // a pouch with 5 gold pieces
        let pouch: Actors.Actor|undefined = Actors.ActorFactory.create(ACTOR_TYPES.POUCH);
        if ( pouch ) {
            Actors.ActorFactory.createInContainer(pouch, [
                ACTOR_TYPES.GOLD_PIECE,
                ACTOR_TYPES.GOLD_PIECE,
                ACTOR_TYPES.GOLD_PIECE,
                ACTOR_TYPES.GOLD_PIECE,
                ACTOR_TYPES.GOLD_PIECE]);
        }
        let bag: Actors.Actor|undefined = Actors.ActorFactory.create(ACTOR_TYPES.BAG);
        if ( bag ) {
            if ( pouch ) {
                pouch.pickable.pick(pouch, bag, false);
            }
            Actors.ActorFactory.createInContainer(bag,
                [ACTOR_TYPES.HEALTH_POTION]);
            bag.moveTo(player.pos.x, player.pos.y);
        }
        Actors.ActorFactory.createInContainer(player,
            [ACTOR_TYPES.TORCH, ACTOR_TYPES.MAP_CASE,
            ACTOR_TYPES.KEY_RING, ACTOR_TYPES.KNIFE]);
        Actors.Actor.describeCell(player.pos);
    }

    public onSaveGame(persister: Yendor.IPersister) {
        if (Actors.Actor.specialActors[Actors.SpecialActorsEnum.PLAYER].destructible.isDead()) {
            this.deleteSavedGame();
        } else {
            persister.saveToKey(PERSISTENCE_DUNGEON_LEVEL, this.dungeonLevel);
            persister.saveToKey(PERSISTENCE_VERSION_KEY, SAVEFILE_VERSION);
            persister.saveToKey(PERSISTENCE_MAP_KEY, this._map);
            persister.saveToKey(PERSISTENCE_TOPOLOGY_MAP, this._topotologyMap);
            persister.saveToKey(PERSISTENCE_STATUS_PANEL, this.gui.status);
            Actors.ActorFactory.save(persister);
        }
    }

    /**
     * Function: onUpdate
     * Update the game world
     * Parameters:
     * time - elapsed time since the last update in milliseconds
     */
    public onUpdate(time: number): void {
        if ( this.status === GameStatus.INITIALIZING ) {
                    return;
        }
        let player: Actors.Actor = Actors.Actor.specialActors[Actors.SpecialActorsEnum.PLAYER];
        if (player && !player.destructible.isDead()) {
            let schedulerPaused = Actors.Actor.scheduler.isPaused();
            if ( this.status === GameStatus.NEXT_TURN) {
                this.forceNextTurn = true;
                this.status = GameStatus.RUNNING;
            }
            super.onUpdate(time);
            if ( ! schedulerPaused && Actors.Actor.scheduler.isPaused()) {
                // save every time the scheduler pauses
                this.persister.saveToKey(Actors.PERSISTENCE_ACTORS_KEY, Actors.Actor.list);
                this.onSaveGame(this.persister);
            }
        }
        this.handleKeyboardInput();
        if (this.status === GameStatus.NEXT_LEVEL) {
            this.gotoNextLevel();
            this.status = GameStatus.RUNNING;
        }
        if (player.destructible.isDead() && this.status !== GameStatus.DEFEAT) {
            Umbra.EventManager.publishEvent(EVENT_CHANGE_STATUS, GameStatus.DEFEAT);
        }

    }

    public onRender(_con: Yendor.Console): void {
        // rendering done by a MapRendererNode
    }

    private createGui() {
        let numberSelector: NumberSelector = new NumberSelector();
        this.gui = {
            inventory: new InventoryPanel(numberSelector),
            loot: new LootPanel(numberSelector),
            mainMenu : new MainMenu(),
            status: new StatusPanel(),
            tilePicker: new TilePicker(),
        };
        if (Yendor.urlParams[Umbra.URL_PARAM_DEBUG]) {
            this.gui.debugMenu = new DebugMenu();
            this.addChild(this.gui.debugMenu);
        }
        this.gui.status.init(Umbra.application.getConsole().width, STATUS_PANEL_HEIGHT);
        this.playerInventoryPicker = this.gui.inventory;
        this.playerTilePicker = this.gui.tilePicker;
        this.playerLootHandler = this.gui.loot;
        this.gui.inventory.resize(Umbra.application.getConsole().width,
            Umbra.application.getConsole().height - STATUS_PANEL_HEIGHT);
        this.addChild(this.gui.status);
        this.addChild(this.gui.inventory);
        this.addChild(this.gui.mainMenu);
        this.addChild(this.gui.tilePicker);
        this.addChild(this.gui.loot);
        this.addChild(numberSelector);

        // Gui configuration
        Gui.setConfiguration(
            {
                color: {
                    background: MENU_BACKGROUND,
                    backgroundActive: MENU_BACKGROUND_ACTIVE,
                    backgroundDisabled: MENU_BACKGROUND,
                    foreground: MENU_FOREGROUND,
                    foregroundActive: MENU_FOREGROUND_ACTIVE,
                    foregroundDisabled: MENU_FOREGROUND_DISABLED,
                    titleForeground: TITLE_FOREGROUND,
                },
                input: {
                    cancelAxisName: Actors.PlayerActionEnum[Actors.PlayerActionEnum.CANCEL],
                    focusNextWidgetAxisName: Actors.PlayerActionEnum[Actors.PlayerActionEnum.MOVE_SOUTH],
                    focusPreviousWidgetAxisName: Actors.PlayerActionEnum[Actors.PlayerActionEnum.MOVE_NORTH],
                    validateAxisName: Actors.PlayerActionEnum[Actors.PlayerActionEnum.VALIDATE],
                },
            }
        );
    }

    private loadGame() {
        try {
            this.persister.loadFromKey(PERSISTENCE_DUNGEON_LEVEL).then((dungeonLevel) => {
                this.dungeonLevel = dungeonLevel;
                return this.persister.loadFromKey(PERSISTENCE_MAP_KEY, this._map);
            }).then((_x) => {
                return Actors.ActorFactory.load(this.persister);
            }).then(() => {
                return Actors.Actor.load(this.persister);
            }).then(() => {
                Actors.Actor.specialActors[Actors.SpecialActorsEnum.PLAYER].ai.setPickers(
                    this.playerTilePicker, this.playerInventoryPicker, this.playerLootHandler);
                return this.persister.loadFromKey(PERSISTENCE_TOPOLOGY_MAP);
            }).then((topologyMap) => {
                this._topotologyMap = topologyMap;
                return this.persister.loadFromKey(PERSISTENCE_STATUS_PANEL, this.gui.status);
            }).then((_x) => {
                this.status = GameStatus.RUNNING;
            }).catch((err) => {
                Umbra.logger.critical("Error while loading game :" + err);
                this.onNewGame();
            });
        } catch (e) {
            Umbra.logger.critical("Error while loading game :" + e);
            this.onNewGame();
        }
    }

    private deleteSavedGame() {
        this.persister.deleteKey(PERSISTENCE_DUNGEON_LEVEL);
        this.persister.deleteKey(PERSISTENCE_VERSION_KEY);
        this.persister.deleteKey(PERSISTENCE_MAP_KEY);
        Actors.ActorFactory.deleteSavedGame(this.persister);
        Actors.Actor.deleteSavedGame(this.persister);
        this.persister.deleteKey(PERSISTENCE_STATUS_PANEL);
    }

    /**
     * Function: gotoNextLevel
     * Go down one level in the dungeon
     */
    private gotoNextLevel() {
        this.dungeonLevel++;
        this.newLevel();
        let player: Actors.Actor = Actors.Actor.specialActors[Actors.SpecialActorsEnum.PLAYER];
        player.destructible.heal(player, player.destructible.maxHp / 2);
        Umbra.logger.warn("You take a moment to rest, and recover your strength.");
        Umbra.logger.warn("After a rare moment of peace, you descend deeper\ninto the heart of the dungeon...");
        Umbra.logger.warn("Level..." + this.dungeonLevel);
        this._topotologyMap = this.buildMap(this.dungeonLevel, this._map);
    }

    /**
     * Function: handleKeyboardInput
     * Handle main menu shortcut
     */
    private handleKeyboardInput(): void {
        if (Gui.Widget.getActiveModal() === undefined
            && Actors.getLastPlayerAction() === Actors.PlayerActionEnum.CANCEL) {
            Umbra.resetInput();
            Umbra.EventManager.publishEvent(EVENT_OPEN_MAIN_MENU);
        }
    }
}
