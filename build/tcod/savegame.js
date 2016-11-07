define(["require", "exports", "./constants"], function (require, exports, Constants) {
    "use strict";
    class SaveGameManager {
        static getCurrentSavegame(_persister) {
            /*
            let savegameNum: number = persister.loadFromKey(Constants.PERSISTENCE_CURRENT_SAVEGAME_NUMBER_KEY);
            if ( savegameNum === undefined ) {
                // TODO character creation
                return {
                    character: {
                        name: "test",
                        age: 20,
                        xpLevel: 0,
                        worldPos: new Core.Position(50, 50)
                    },
                    worldStatus: undefined
                };
            }
            let summaries: SaveGameSummary[] =  persister.loadFromKey(Constants.PERSISTENCE_SAVEGAME_SUMMARIES_KEY);
            if ( savegameNum < 0 || savegameNum >= summaries.length ) {
                Umbra.logger.error("Wrong number for current savegame :" + savegameNum
                    + " (should be between 0 and " + summaries.length + ")");
                // TODO character creation
                return {
                    character: {
                        name: "test",
                        age: 20,
                        xpLevel: 0,
                        worldPos: new Core.Position(50, 50)
                    },
                    worldStatus: undefined
                };
            }
            return summaries[savegameNum];
            */
            return undefined;
        }
        static getSavegameSummaries(_persister) {
            return undefined; // persister.loadFromKey(Constants.PERSISTENCE_SAVEGAME_SUMMARIES_KEY);
        }
        static saveRegion(persister, data) {
            persister.saveToKey(Constants.PERSISTENCE_REGION_KEY + data.id, data);
        }
        static loadRegion(_persister, _id) {
            return undefined; // persister.loadFromKey(Constants.PERSISTENCE_REGION_KEY + id);
        }
    }
    exports.SaveGameManager = SaveGameManager;
});
//# sourceMappingURL=savegame.js.map