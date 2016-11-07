define(["require", "exports"], function (require, exports) {
    "use strict";
    // temperature / precipitation Biome diagram (Whittaker diagram)
    /*
    let biomeDiagram: BiomeEnum[][] = [
        // artic/alpine climate (below -5°C)
        [ BiomeEnum.TUNDRA, BiomeEnum.TUNDRA, BiomeEnum.TUNDRA, BiomeEnum.TUNDRA, BiomeEnum.TUNDRA ],
        // cold climate (-5 / 5°C)
        [ BiomeEnum.COLD_DESERT, BiomeEnum.GRASSLAND, BiomeEnum.BOREAL_FOREST,
            BiomeEnum.BOREAL_FOREST, BiomeEnum.BOREAL_FOREST ],
        // temperate climate (5 / 15 °C)
        [ BiomeEnum.COLD_DESERT, BiomeEnum.GRASSLAND, BiomeEnum.TEMPERATE_FOREST,
            BiomeEnum.TEMPERATE_FOREST, BiomeEnum.TROPICAL_MONTANE_FOREST ],
        // warm climate (15 - 20°C)
        [ BiomeEnum.HOT_DESERT, BiomeEnum.SAVANNA, BiomeEnum.TROPICAL_DRY_FOREST,
            BiomeEnum.TROPICAL_EVERGREEN_FOREST, BiomeEnum.TROPICAL_EVERGREEN_FOREST ],
        // tropical climate (above 20°C)
        [ BiomeEnum.HOT_DESERT, BiomeEnum.THORN_FOREST, BiomeEnum.TROPICAL_DRY_FOREST,
            BiomeEnum.TROPICAL_EVERGREEN_FOREST, BiomeEnum.TROPICAL_EVERGREEN_FOREST ],
    ];*/
    (function (WeatherTypeEnum) {
        WeatherTypeEnum[WeatherTypeEnum["CLEAR"] = 1] = "CLEAR";
        WeatherTypeEnum[WeatherTypeEnum["FAIR"] = 2] = "FAIR";
        WeatherTypeEnum[WeatherTypeEnum["PARTLY_CLOUDY"] = 3] = "PARTLY_CLOUDY";
        WeatherTypeEnum[WeatherTypeEnum["MOSTLY_CLOUDY"] = 4] = "MOSTLY_CLOUDY";
        WeatherTypeEnum[WeatherTypeEnum["OVERCAST"] = 5] = "OVERCAST";
        WeatherTypeEnum[WeatherTypeEnum["LIGHT_FOG"] = 6] = "LIGHT_FOG";
        WeatherTypeEnum[WeatherTypeEnum["HEAVY_FOG"] = 7] = "HEAVY_FOG";
        WeatherTypeEnum[WeatherTypeEnum["LIGHT_RAIN"] = 8] = "LIGHT_RAIN";
        WeatherTypeEnum[WeatherTypeEnum["RAIN"] = 9] = "RAIN";
        WeatherTypeEnum[WeatherTypeEnum["HEAVY_RAIN"] = 10] = "HEAVY_RAIN";
        WeatherTypeEnum[WeatherTypeEnum["LIGHT_SNOW"] = 11] = "LIGHT_SNOW";
        WeatherTypeEnum[WeatherTypeEnum["SNOW"] = 12] = "SNOW";
        WeatherTypeEnum[WeatherTypeEnum["HEAVY_SNOW"] = 13] = "HEAVY_SNOW";
        WeatherTypeEnum[WeatherTypeEnum["THUNDERSTORM"] = 14] = "THUNDERSTORM";
        WeatherTypeEnum[WeatherTypeEnum["SNOWSTORM"] = 15] = "SNOWSTORM";
        WeatherTypeEnum[WeatherTypeEnum["DUST_STORM"] = 16] = "DUST_STORM";
        WeatherTypeEnum[WeatherTypeEnum["SAND_STORM"] = 17] = "SAND_STORM";
    })(exports.WeatherTypeEnum || (exports.WeatherTypeEnum = {}));
    var WeatherTypeEnum = exports.WeatherTypeEnum;
    (function (WindTypeEnum) {
        WindTypeEnum[WindTypeEnum["NONE"] = 1] = "NONE";
        WindTypeEnum[WindTypeEnum["BREEZY"] = 2] = "BREEZY";
        WindTypeEnum[WindTypeEnum["WINDY"] = 3] = "WINDY";
    })(exports.WindTypeEnum || (exports.WindTypeEnum = {}));
    var WindTypeEnum = exports.WindTypeEnum;
    exports.WEATHER_TYPE_NAMES = {
        CLEAR: "clear",
        FAIR: "fair",
        PARTLY_CLOUDY: "partly cloudy",
        MOSTLY_CLOUDY: "mostly cloudy",
        OVERCAST: "overcast",
        LIGHT_FOG: "light fog",
        HEAVY_FOG: "heavy fog",
        LIGHT_RAIN: "light rain",
        RAIN: "rain",
        HEAVY_RAIN: "heavy rain",
        LIGHT_SNOW: "light snow",
        SNOW: "snow",
        HEAVY_SNOW: "heavy snow",
        THUNDERSTORM: "thunderstorm",
        SNOWSTORM: "snowstorm",
        DUST_STORM: "dust storm",
        SAND_STORM: "sand storm",
    };
    exports.WIND_TYPE_NAMES = {
        NONE: "",
        BREEZY: "breezy",
        WINDY: "windy",
    };
    class Wheather {
        static getWeatherTextualDescription(_status) {
            // TODO
            return exports.WEATHER_TYPE_NAMES[WeatherTypeEnum[WeatherTypeEnum.CLEAR]]
                + " and " + exports.WIND_TYPE_NAMES[WindTypeEnum[WindTypeEnum.BREEZY]];
        }
    }
    exports.Wheather = Wheather;
});
//# sourceMappingURL=weather.js.map