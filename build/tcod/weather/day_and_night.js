define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.TIME_OF_DAY_NAMES = {
        NIGHT: "night",
        DAWN: "dawn",
        MORNING: "morning",
        NOON: "noon",
        AFTERNOON: "afternoon",
        EVENING: "evening",
        DUSK: "dusk",
    };
    exports.SUMMER_SOLSTICE_DAY_TIMES = [
        4,
        4.75,
        11.5,
        13.5,
        19,
        21.25,
        22,
    ];
    exports.WINTER_SOLSTICE_DAY_TIMES = [
        7.25,
        8,
        11.5,
        13.5,
        19,
        16,
        16.75,
    ];
    class WorldTime {
        static getTimeOfDay(_dateAndTime, _latitude, _longitude) {
            // TODO. check https://github.com/mourner/suncalc
            return 3 /* MORNING */;
        }
    }
    exports.WorldTime = WorldTime;
});
//# sourceMappingURL=day_and_night.js.map