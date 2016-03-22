module Game {
    "use strict";

    export module Constants {
        export const MAIN_MODULE_NAME: string = "Game";
        // console
        export const CONSOLE_WIDTH: number = 80;
        export const CONSOLE_HEIGHT: number = 34;

        // URL parameters
        export const URL_PARAM_DEBUG: string = "debug";
        export const URL_PARAM_NO_MONSTER: string = "nomonster";

        // rendering
        export const DARK_WALL: Core.Color = 0x000064;
//        export const LIGHT_WALL: Core.Color = 0x826E32;
        export const DARK_GROUND: Core.Color = 0x323296;
//        export const LIGHT_GROUND: Core.Color = 0xC8B432;
        export const LIGHT_WALL: Core.Color = 0x7E6E4E;
        export const LIGHT_GROUND: Core.Color = 0xC4B494;
        // unlimited fov
        export const FOV_RADIUS: number = 0;
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
        export const FROST_COLOR: Core.Color = 0xE0E0FF;

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

        // gui
        export const LOG_DARKEN_COEF: number = 0.8;
        export const STATUS_PANEL_HEIGHT: number = 7;
        export const STAT_BAR_WIDTH: number = 20;

        // map building
        export const MAX_MONSTERS_PER_ROOM: number = 3;
        export const MAX_ITEMS_PER_ROOM: number = 2;
        export const ROOM_MAX_SIZE: number = 8;
        export const ROOM_MIN_SIZE: number = 4;
        export const PUZZLE_STEP_PROBABILITY: number = 0.6;

        // gameplay
        // minimum light level to see actors
        export const PENUMBRA_THRESHOLD: number = 0.25;
        export const LIGHT_NORMAL_RANGE_FACTOR = 1 / 20;
        // character to use for actors in penumbra (63 = '?')
        export const PENUMBRA_ASCIICODE: number = 63;
        // light intensity pattern lower value is 48 = '0'
        export const BASE_LIGHT_PATTERN_ASCIICODE: number = 48;
        // how often the world is updated
        export const TICKS_PER_SECOND: number = 10;
        export const TICK_LENGTH: number = 1.0 / Constants.TICKS_PER_SECOND;
        export const SCENT_THRESHOLD: number = 10;
        export const PLAYER_WALK_TIME: number = 5;
        // xp level required for level 1
        export const XP_BASE_LEVEL: number = 200;
        // xp level required for level n = BASE_LEVEL + n * NEW_LEVEL
        export const XP_NEW_LEVEL: number = 150;
        // how many turns you are confused after being stunned
        export const AFTER_STUNNED_CONFUSION_DELAY: number = 3;
        // overencumbered inventory capacity (percentage of capacity)
        export const OVEREMCUMBERED_THRESHOLD: number = 0.9;
        // when overencumbered, walkTime is multiplied by this value
        export const OVERENCUMBERED_MULTIPLIER: number = 1.5;
        export const FROZEN_MULTIPLIER: number = 3;

        // equipment slots names
        export const SLOT_RIGHT_HAND: string = "right hand";
        export const SLOT_LEFT_HAND: string = "left hand";
        export const SLOT_BOTH_HANDS: string = "hands";
        export const SLOT_QUIVER: string = "quiver";

        // persistence local storage keys
        export const PERSISTENCE_VERSION_KEY: string = "version";
        export const PERSISTENCE_DUNGEON_LEVEL: string = "dungeonLevel";
        export const PERSISTENCE_TOPOLOGY_MAP: string = "topologyMap";
        export const PERSISTENCE_MAP_KEY: string = "map";
        export const PERSISTENCE_ACTORS_KEY: string = "actors";
        export const PERSISTENCE_CREATURE_IDS_KEY: string = "creatureIds";
        export const PERSISTENCE_ACTORS_SEQ_KEY: string = "actorsSeq";
        export const PERSISTENCE_ITEM_IDS_KEY: string = "itemIds";
        export const PERSISTENCE_CORPSE_IDS_KEY: string = "corpseIds";
        export const PERSISTENCE_UPDATING_CORPSE_IDS_KEY: string = "updatingCorpseIds";
        export const PERSISTENCE_STATUS_PANEL: string = "statusPanel";

    }
    export const enum GameStatus {
        // go to next level
        NEXT_LEVEL,
        // game is running
        RUNNING,
        // player won
        VICTORY,
        // player died
        DEFEAT
    }

    export enum PlayerAction {
        MOVE_NORTH,
        MOVE_SOUTH,
        MOVE_EAST,
        MOVE_WEST,
        MOVE_NW,
        MOVE_NE,
        MOVE_SW,
        MOVE_SE,
        MOVE_UP,
        MOVE_DOWN,
        WAIT,
        GRAB,
        USE_ITEM,
        DROP_ITEM,
        THROW_ITEM,
        FIRE,
        ZAP,
        SELECT_TILE,
        SELECT_ITEM,
        ACTIVATE,
        VALIDATE,
        CANCEL
    }

    // utilities
    /*
        Function: log
        Add a log to the status panel by sending a LOG_MESSAGE event on the event bus.
    */
    export var log = function(text: string, color: Core.Color = Constants.LOG_INFO_COLOR) {
        Umbra.EventManager.publishEvent(EventType[EventType.LOG_MESSAGE], new Message(color, text));
    };

    /*
        Function: transformMessage
        Convert variables inside a text into their actual value.
        Available variables (example for actor1  = a sword or the player) :
        - [The actor1's] - The sword's / Your
        - [the actor1's] - the sword's  / your
        - [The actor1] - The sword / You
        - [the actor1] - the sword / you
        - [A actor1] - A sword / You
        - [a actor1] - a sword / you
        - [s] - s / <empty>  (verb ending)
        - [it] - it / you
        - [its] - its / your
        - [is] - is / are

        The same variables are available for a second actor :
        - [The actor2's]
        - [the actor2's]
        - [The actor2]
        - [the actor2]
        - [A actor2]
        - [a actor2]
        - [s2]
        - [it2]
        - [its2]
        - [is2]
        
        There are also two numerical values [value1] and [value2].
        Example :

        [The actor1] hit[s] with [a actor2] for [value1] points.

        applied to actor1 = player, actor2 = sword, value1 = 5 :

        You hit with a sword for 5 points. 

        applied to actor1 = orc, actor2 = axe, value1 = 5 :

        The orc hits with an axe for 5 points.
    */
    export var transformMessage = function(text: string, actor1: Actor, actor2?: Actor, value1?: number, value2?: number): string {
        var newText = text.replace(/\[The actor1\'s\] /g, actor1.getThenames());
        newText = newText.replace(/ \[the actor1\'s\] /g, actor1.getthenames());
        newText = newText.replace(/\[The actor1\]/g, actor1.getThename());
        newText = newText.replace(/ \[the actor1\]/g, actor1.getthename());
        newText = newText.replace(/\[A actor1\]/g, actor1.getAname());
        newText = newText.replace(/ \[a actor1\]/g, actor1.getaname());
        newText = newText.replace(/\[s\]/g, actor1.getVerbEnd());
        newText = newText.replace(/ \[it\]/g, actor1.getit());
        newText = newText.replace(/ \[its\] /g, actor1.getits());
        newText = newText.replace(/ \[is\]/g, actor1.getis());
        if (actor2) {
            newText.replace(/\[The actor2\'s\] /g, actor2.getThenames());
            newText = newText.replace(/ \[the actor2\'s\] /g, actor2.getthenames());
            newText = newText.replace(/\[The actor2\]/g, actor2.getThename());
            newText = newText.replace(/ \[the actor2\]/g, actor2.getthename());
            newText = newText.replace(/\[A actor2\]/g, actor2.getAname());
            newText = newText.replace(/ \[a actor2\]/g, actor2.getaname());
            newText = newText.replace(/\[s2\]/g, actor2.getVerbEnd());
            newText = newText.replace(/ \[it2\]/g, actor2.getit());
            newText = newText.replace(/ \[its2\] /g, actor2.getits());
            newText = newText.replace(/ \[is2\]/g, actor2.getis());
        }
        if (value1 !== undefined) {
            newText = newText.replace(/\[value1\]/g, "" + value1);
        }
        if (value2 !== undefined) {
            newText = newText.replace(/\[value2\]/g, "" + value2);
        }
        return newText;
    };

    export var getLastPlayerAction = function(): PlayerAction {
        var lastActionName: string = Umbra.Input.getLastAxisName();
        return lastActionName ? PlayerAction[lastActionName] : undefined;
    } 

    /*
        Function: convertActionToPosition
        convert a movement action into an actual dx, dy movement

        Returns:
        the Core.Position containing the movement, 0,0 if the action is not a movement action
    */
    export var convertActionToPosition = function(action: PlayerAction): Core.Position {        
        var move: Core.Position = new Core.Position(0, 0);
        switch (action) {
            case PlayerAction.MOVE_NORTH:
                move.y = -1;
                break;
            case PlayerAction.MOVE_SOUTH:
                move.y = 1;
                break;
            case PlayerAction.MOVE_EAST:
                move.x = 1;
                break;
            case PlayerAction.MOVE_WEST:
                move.x = -1;
                break;
            case PlayerAction.MOVE_NW:
                move.x = -1;
                move.y = -1;
                break;
            case PlayerAction.MOVE_NE:
                move.x = 1;
                move.y = -1;
                break;
            case PlayerAction.MOVE_SW:
                move.x = -1;
                move.y = 1;
                break;
            case PlayerAction.MOVE_SE:
                move.x = 1;
                move.y = 1;
                break;
        }
        return move;
    };
}
