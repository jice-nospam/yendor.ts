define(["require", "exports"], function (require, exports) {
    "use strict";
    // rendering
    exports.MENU_BACKGROUND = 0x272822;
    exports.MENU_BACKGROUND_ACTIVE = 0x383830;
    exports.MENU_FOREGROUND = 0xFD971F;
    exports.MENU_FOREGROUND_ACTIVE = 0xFFDF90;
    exports.MENU_FOREGROUND_DISABLED = 0x5C714B;
    exports.TITLE_FOREGROUND = 0xFFFFFF;
    // some material colors
    exports.DARK_WOOD_COLOR = 0x2C1E14;
    exports.WOOD_COLOR = 0x7D320B;
    exports.LIGHT_COLOR = 0xDF9F48;
    exports.IVORY_COLOR = 0xDFD8BB;
    exports.PAPER_COLOR = 0xC4D67E;
    exports.BONE_COLOR = 0xFFD184;
    exports.IRON_COLOR = 0x7B7D7A;
    exports.STEEL_COLOR = 0x828388;
    exports.BRONZE_COLOR = 0x925C1E;
    exports.SILVER_COLOR = 0x9A938D;
    exports.GOLD_COLOR = 0xC49E2C;
    exports.CANDLE_LIGHT_COLOR = 0xDDDD44;
    exports.TORCH_LIGHT_COLOR = 0xFFFF44;
    exports.SUNROD_LIGHT_COLOR = 0xEEEEFF;
    exports.NOLIGHT_COLOR = 0x444444;
    exports.HEALTH_POTION_COLOR = 0x800080;
    exports.OIL_FLASK_COLOR = 0xAF5320;
    // local storage keys
    exports.PERSISTENCE_CURRENT_SAVEGAME_NUMBER_KEY = "currentSavegameNumber";
    exports.PERSISTENCE_SAVEGAME_SUMMARIES_KEY = "currentSavegameSummaries";
    exports.PERSISTENCE_REGION_KEY = "region";
    // gameplay
    exports.XP_BASE_LEVEL = 200; // xp level required for level 1
    exports.XP_NEW_LEVEL = 150; // xp level required for level n = BASE_LEVEL + n * NEW_LEVEL
});
//# sourceMappingURL=constants.js.map