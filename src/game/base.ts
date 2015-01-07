module Game {
    "use strict";

	export module Constants {
        export var MAIN_MODULE_NAME = "Game";
		// console
		export var CONSOLE_WIDTH: number = 80;
		export var CONSOLE_HEIGHT: number = 34;

		// rendering
		export var DARK_WALL: Yendor.Color = "#000064";
		export var LIGHT_WALL: Yendor.Color = "#826E32";
		export var DARK_GROUND: Yendor.Color = "#323296";
		export var LIGHT_GROUND: Yendor.Color = "#C8B432";
        export var CORPSE_COLOR: Yendor.Color = "#BF0000";
        export var FOV_RADIUS: number = 10;
        export var MENU_BACKGROUND: Yendor.Color = "#272822";
        export var MENU_BACKGROUND_ACTIVE: Yendor.Color = "#383830";
        export var MENU_FOREGROUND: Yendor.Color = "#FD971F";
        export var MENU_FOREGROUND_ACTIVE: Yendor.Color = "#FFDF90";
        export var MENU_FOREGROUND_DISABLED: Yendor.Color = "#5C714B";
        export var HEALTH_BAR_BACKGROUND: Yendor.Color = "#FF3F3F";
        export var HEALTH_BAR_FOREGROUND: Yendor.Color = "#7F3F3F";
        export var XP_BAR_BACKGROUND: Yendor.Color = "#9F3FFF";
        export var XP_BAR_FOREGROUND: Yendor.Color = "#3F007F";
        export var INVENTORY_BACKGROUND: Yendor.Color = "#272822";
        export var INVENTORY_BACKGROUND_ACTIVE: Yendor.Color = "#383830";
        export var INVENTORY_FOREGROUND: Yendor.Color = "#FD971F";
        export var INVENTORY_FOREGROUND_ACTIVE: Yendor.Color = "#FFDF90";

        // gui
        export var STATUS_PANEL_ID: string = "statusPanel";
        export var INVENTORY_ID: string = "inventory";
        export var TILE_PICKER_ID: string = "tilePicker";
        export var MAIN_MENU_ID: string = "mainMenu";
		export var LOG_DARKEN_COEF: number = 0.8;
		export var STATUS_PANEL_HEIGHT: number = 7;
		export var STAT_BAR_WIDTH: number = 20;
        export var INVENTORY_PANEL_WIDTH: number = 50;
        export var INVENTORY_PANEL_HEIGHT: number = 28;

		// map building
		export var MAX_MONSTERS_PER_ROOM: number = 3;
        export var MAX_ITEMS_PER_ROOM: number = 2;
		export var ROOM_MAX_SIZE: number = 8;
		export var ROOM_MIN_SIZE: number = 4;

		// gameplay
		export var SCENT_THRESHOLD: number = 10;
        export var PLAYER_WALK_TIME: number = 10;
        // xp level required for level 1
        export var XP_BASE_LEVEL: number = 200;
        // xp level required for level n = BASE_LEVEL + n * NEW_LEVEL
        export var XP_NEW_LEVEL: number = 150;
        // how many turns you are confused after being stunned
        export var AFTER_STUNNED_CONFUSION_DELAY: number = 3;
        // equipment slots names
        export var SLOT_RIGHT_HAND: string = "right hand";
        export var SLOT_LEFT_HAND: string = "left hand";
        export var SLOT_BOTH_HANDS: string = "hands";
        export var SLOT_QUIVER: string = "quiver";

        // persistence local storage keys
        export var PERSISTENCE_VERSION_KEY: string = "version";
        export var PERSISTENCE_DUNGEON_LEVEL: string = "dungeonLevel";
        export var PERSISTENCE_MAP_KEY: string = "map";
        export var PERSISTENCE_ACTORS_KEY: string = "actors";
        export var PERSISTENCE_ITEMS_KEY: string = "items";
        export var PERSISTENCE_CORPSES_KEY: string = "corpses";

	}
	export enum GameStatus {
        // First frame
		STARTUP,
        // new frame with no world update
		IDLE,
        // new frame with world update
		NEW_TURN,
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
        VALIDATE,
        CANCEL
    }

	// key codes
	export enum KeyEvent {
        DOM_VK_CANCEL= 3,
        DOM_VK_HELP= 6,
        DOM_VK_BACK_SPACE= 8,
        DOM_VK_TAB= 9,
        DOM_VK_CLEAR= 12,
        DOM_VK_RETURN= 13,
        DOM_VK_ENTER= 14,
        DOM_VK_SHIFT= 16,
        DOM_VK_CONTROL= 17,
        DOM_VK_ALT= 18,
        DOM_VK_PAUSE= 19,
        DOM_VK_CAPS_LOCK= 20,
        DOM_VK_ESCAPE= 27,
        DOM_VK_SPACE= 32,
        DOM_VK_PAGE_UP= 33,
        DOM_VK_PAGE_DOWN= 34,
        DOM_VK_END= 35,
        DOM_VK_HOME= 36,
        DOM_VK_LEFT= 37,
        DOM_VK_UP= 38,
        DOM_VK_RIGHT= 39,
        DOM_VK_DOWN= 40,
        DOM_VK_PRINTSCREEN= 44,
        DOM_VK_INSERT= 45,
        DOM_VK_DELETE= 46,
        DOM_VK_0= 48,
        DOM_VK_1= 49,
        DOM_VK_2= 50,
        DOM_VK_3= 51,
        DOM_VK_4= 52,
        DOM_VK_5= 53,
        DOM_VK_6= 54,
        DOM_VK_7= 55,
        DOM_VK_8= 56,
        DOM_VK_9= 57,
        DOM_VK_SEMICOLON= 59,
        DOM_VK_EQUALS= 61,
        DOM_VK_A= 65,
        DOM_VK_B= 66,
        DOM_VK_C= 67,
        DOM_VK_D= 68,
        DOM_VK_E= 69,
        DOM_VK_F= 70,
        DOM_VK_G= 71,
        DOM_VK_H= 72,
        DOM_VK_I= 73,
        DOM_VK_J= 74,
        DOM_VK_K= 75,
        DOM_VK_L= 76,
        DOM_VK_M= 77,
        DOM_VK_N= 78,
        DOM_VK_O= 79,
        DOM_VK_P= 80,
        DOM_VK_Q= 81,
        DOM_VK_R= 82,
        DOM_VK_S= 83,
        DOM_VK_T= 84,
        DOM_VK_U= 85,
        DOM_VK_V= 86,
        DOM_VK_W= 87,
        DOM_VK_X= 88,
        DOM_VK_Y= 89,
        DOM_VK_Z= 90,
        DOM_VK_CONTEXT_MENU= 93,
        DOM_VK_NUMPAD0= 96,
        DOM_VK_NUMPAD1= 97,
        DOM_VK_NUMPAD2= 98,
        DOM_VK_NUMPAD3= 99,
        DOM_VK_NUMPAD4= 100,
        DOM_VK_NUMPAD5= 101,
        DOM_VK_NUMPAD6= 102,
        DOM_VK_NUMPAD7= 103,
        DOM_VK_NUMPAD8= 104,
        DOM_VK_NUMPAD9= 105,
        DOM_VK_MULTIPLY= 106,
        DOM_VK_ADD= 107,
        DOM_VK_SEPARATOR= 108,
        DOM_VK_SUBTRACT= 109,
        DOM_VK_DECIMAL= 110,
        DOM_VK_DIVIDE= 111,
        DOM_VK_F1= 112,
        DOM_VK_F2= 113,
        DOM_VK_F3= 114,
        DOM_VK_F4= 115,
        DOM_VK_F5= 116,
        DOM_VK_F6= 117,
        DOM_VK_F7= 118,
        DOM_VK_F8= 119,
        DOM_VK_F9= 120,
        DOM_VK_F10= 121,
        DOM_VK_F11= 122,
        DOM_VK_F12= 123,
        DOM_VK_F13= 124,
        DOM_VK_F14= 125,
        DOM_VK_F15= 126,
        DOM_VK_F16= 127,
        DOM_VK_F17= 128,
        DOM_VK_F18= 129,
        DOM_VK_F19= 130,
        DOM_VK_F20= 131,
        DOM_VK_F21= 132,
        DOM_VK_F22= 133,
        DOM_VK_F23= 134,
        DOM_VK_F24= 135,
        DOM_VK_NUM_LOCK= 144,
        DOM_VK_SCROLL_LOCK= 145,
        DOM_VK_COMMA= 188,
        DOM_VK_PERIOD= 190,
        DOM_VK_SLASH= 191,
        DOM_VK_BACK_QUOTE= 192,
        DOM_VK_OPEN_BRACKET= 219,
        DOM_VK_BACK_SLASH= 220,
        DOM_VK_CLOSE_BRACKET= 221,
        DOM_VK_QUOTE= 222,
        DOM_VK_META= 224
    };

    export interface KeyInput {
        action: PlayerAction;
        keyCode: KeyEvent;
        char: string;
    }

	// utilities
    /*
        Function: log
        Add a log to the status panel by sending a LOG_MESSAGE event on the event bus.
    */
    export var log = function(text: string, color: Yendor.Color = "white") {
        EventBus.instance.publishEvent(new Event<Message>(EventType.LOG_MESSAGE, new Message(color, text)));
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
        
        There are also two numerical values [value1] and [value2].
        Example :

        [The actor1] hit[s] with [a actor2] for [value1] points.

        applied to actor1 = player, actor2 = sword, value1 = 5 :

        You hit with a sword for 5 points. 

        applied to actor1 = orc, actor2 = axe, value1 = 5 :

        The orc hits with an axe for 5 points.
    */
    export var transformMessage = function(text: string, actor1: Actor, actor2?: Actor, value1?: number, value2?: number): string {
        var newText = text.replace("[The actor1's] ", actor1.getThenames());
        newText = newText.replace(" [the actor1's] ", actor1.getthenames());
        newText = newText.replace("[The actor1]", actor1.getThename());
        newText = newText.replace(" [the actor1]", actor1.getthename());
        newText = newText.replace("[A actor1]", actor1.getAname());
        newText = newText.replace(" [a actor1]", actor1.getaname());
        newText = newText.replace(/\[s\]/g, actor1.getVerbEnd());
        newText = newText.replace(/ \[it\]/g, actor1.getit());
        newText = newText.replace(/ \[its\] /g, actor1.getits());
        if ( actor2 ) {
            newText.replace("[The actor2's] ", actor2.getThenames());
            newText = newText.replace(" [the actor2's] ", actor2.getthenames());
            newText = newText.replace("[The actor2]", actor2.getThename());
            newText = newText.replace(" [the actor2]", actor2.getthename());
            newText = newText.replace("[A actor2]", actor2.getAname());
            newText = newText.replace(" [a actor2]", actor2.getaname());
            newText = newText.replace(/\[s2\]/g, actor2.getVerbEnd());
            newText = newText.replace(/ \[it2\]/g, actor2.getit());
            newText = newText.replace(/ \[its2\] /g, actor2.getits());
        }
        if ( value1 !== undefined ) {
            newText = newText.replace("[value1]", "" + value1);
        }
        if ( value2 !== undefined ) {
            newText = newText.replace("[value2]", "" + value2);
        }
        return newText;
    };

    /*
        Function: convertActionToPosition
        convert a movement action into an actual dx, dy movement

        Returns:
        the Yendor.Position containing the movement, 0,0 if the action is not a movement action
    */
    export var convertActionToPosition = function(action: PlayerAction): Yendor.Position {
        var move: Yendor.Position = new Yendor.Position(0, 0);
        switch ( action ) {
            case PlayerAction.MOVE_NORTH :
                move.y = -1;
            break;
            case PlayerAction.MOVE_SOUTH :
                move.y = 1;
            break;
            case PlayerAction.MOVE_EAST :
                move.x = 1;
            break;
            case PlayerAction.MOVE_WEST :
                move.x = -1;
            break;
            case PlayerAction.MOVE_NW :
                move.x = -1;
                move.y = -1;
            break;
            case PlayerAction.MOVE_NE :
                move.x = 1;
                move.y = -1;
            break;
            case PlayerAction.MOVE_SW :
                move.x = -1;
                move.y = 1;
            break;
            case PlayerAction.MOVE_SE :
                move.x = 1;
                move.y = 1;
            break;
        }
        return move;
    };
}
