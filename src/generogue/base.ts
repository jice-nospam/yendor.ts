import * as Core from "../fwk/core/main";
import * as Umbra from "../fwk/umbra/main";
import {Actor} from "../fwk/actors/main";

export namespace Constants {
    export const MAIN_MODULE_NAME: string = "Game";
    // console
    export const CONSOLE_WIDTH: number = 80;
    export const CONSOLE_HEIGHT: number = 34;

    // URL parameters
    export const URL_PARAM_NO_MONSTER: string = "nomonster";
    export const URL_PARAM_NO_ITEM: string = "noitem";
    export const URL_PARAM_CLEAR_SAVEGAME: string = "clearsavegame";

    // rendering
    export const MENU_BACKGROUND: Core.Color = 0x272822;
    export const MENU_BACKGROUND_ACTIVE: Core.Color = 0x383830;
    export const MENU_FOREGROUND: Core.Color = 0xFD971F;
    export const MENU_FOREGROUND_ACTIVE: Core.Color = 0xFFDF90;
    export const MENU_FOREGROUND_DISABLED: Core.Color = 0x5C714B;
    export const TITLE_FOREGROUND: Core.Color = 0xFFFFFF;
    export const HEALTH_BAR_BACKGROUND: Core.Color = 0xFF3F3F;
    export const HEALTH_BAR_FOREGROUND: Core.Color = 0x7F3F3F;
    export const XP_BAR_BACKGROUND: Core.Color = 0x9F3FFF;
    export const XP_BAR_FOREGROUND: Core.Color = 0x3F007F;
    export const CONDITION_BAR_BACKGROUND: Core.Color = 0x3F9F3F;
    export const CONDITION_BAR_FOREGROUND: Core.Color = 0x007F3F;
    export const INVENTORY_BACKGROUND_ACTIVE: Core.Color = 0x383830;
    export const INVENTORY_FOREGROUND_ACTIVE: Core.Color = 0xFFDF90;
    export const INVENTORY_BACKGROUND_EQUIPPED: Core.Color = 0x585850;
    export const LOG_INFO_COLOR: Core.Color = 0xEEEEEE;
    export const LOG_WARN_COLOR: Core.Color = 0xFFA500;
    export const LOG_CRIT_COLOR: Core.Color = 0xFF2222;
    export const TILEPICKER_OK_COLOR: Core.Color = 0x00FF00;
    export const TILEPICKER_KO_COLOR: Core.Color = 0xFF2222;

    // some material colors
    export const WOOD_COLOR: Core.Color = 0x7F3300;
    export const PAPER_COLOR: Core.Color = 0xC4D67E;
    export const BONE_COLOR: Core.Color = 0xD2D8BC;
    export const IRON_COLOR: Core.Color = 0x7C8081;
    export const STEEL_COLOR: Core.Color = 0x867F70;
    export const CANDLE_LIGHT_COLOR: Core.Color = 0xDDDD44;
    export const TORCH_LIGHT_COLOR: Core.Color = 0xFFFF44;
    export const SUNROD_LIGHT_COLOR: Core.Color = 0xEEEEFF;
    export const NOLIGHT_COLOR: Core.Color = 0x444444;
    export const HEALTH_POTION_COLOR: Core.Color = 0x800080;
    export const OIL_FLASK_COLOR: Core.Color = 0xAF5320;

    // gui
    export const LOG_DARKEN_COEF: number = 0.8;
    export const STATUS_PANEL_HEIGHT: number = 7;
    export const STAT_BAR_WIDTH: number = 20;

    // map building
    export const MAX_MONSTERS_PER_ROOM: number = 2;
    export const MAX_ITEMS_PER_ROOM: number = 2;
    export const ROOM_MAX_SIZE: number = 8;
    export const ROOM_MIN_SIZE: number = 4;
    export const DUNGEON_MAX_TORCHES: number = 10;
    export const DUNGEON_MIN_TORCHES: number = 4;

    // gameplay
    // how often the world is updated
    export const TICKS_PER_SECOND: number = 10;
    export const TICK_LENGTH: number = 1.0 / Constants.TICKS_PER_SECOND;
    // xp level required for level 1
    export const XP_BASE_LEVEL: number = 200;
    // xp level required for level n = BASE_LEVEL + n * NEW_LEVEL
    export const XP_NEW_LEVEL: number = 150;

    // persistence local storage keys
    export const PERSISTENCE_VERSION_KEY: string = "version";
    export const PERSISTENCE_DUNGEON_LEVEL: string = "dungeonLevel";
    export const PERSISTENCE_STATUS_PANEL: string = "statusPanel";
    export const PERSISTENCE_MAP_KEY: string = "map";
    export const PERSISTENCE_TOPOLOGY_MAP: string = "topologyMap";

    // event types
    /** open the main menu. No associated data */
    export const EVENT_OPEN_MAIN_MENU: string = "OPEN_MAIN_MENU";

}
export const enum GameStatus {
    INITIALIZING,
    // go to next level
    NEXT_LEVEL,
    // game is running
    RUNNING,
    // player won
    VICTORY,
    // player died
    DEFEAT
}

