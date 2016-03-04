module Game {
    "use strict";

    export enum EventType {
        // change game status. Associated data : GameStatus
        CHANGE_STATUS,
        // sends a message to the log. Associated data : Message containing the text and the color
        LOG_MESSAGE,
        // open the tile picker. Associated data : optional TilePickerEventData
        PICK_TILE,
        // A tile has been selected by the TilePicker. Associated data : the Core.Position of the tile
        TILE_SELECTED,
        // open the inventory. Associated data : OpenInventoryEventData
        OPEN_INVENTORY,
        // open the main menu. No associated data
        OPEN_MAIN_MENU,
        // resume current game
        RESUME_GAME,
        // starts a new game. No associated data
        NEW_GAME,
        // player gains xp. Associated data : number (xp amount)
        GAIN_XP,
        // game is loading
        LOAD_GAME,
        // game is saving
        SAVE_GAME,
        // must delete saved game
        DELETE_SAVEGAME,
    }
}
