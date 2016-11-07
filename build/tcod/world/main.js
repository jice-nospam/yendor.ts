define(["require", "exports", "./constants", "../../fwk/core/main", "../../fwk/umbra/main", "./constants", "../savegame"], function (require, exports, constants_1, Core, Umbra, Constants, savegame_1) {
    "use strict";
    function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    __export(constants_1);
    class World {
        constructor() {
            /** the player current region and all 8 surrounding regions */
            this.surrounding = [];
            this.cellTypes = [];
        }
        /** check that the right regions are loaded in the surrounding array, depending on the player position */
        streamRegions(persister, player) {
            let playerPos = player.pos;
            let regionPos = this.worldPosToRegion(playerPos.x, playerPos.y);
            let currentRegion = this.getCurrentRegion();
            if (currentRegion && currentRegion.id === regionPos.x + "_" + regionPos.y) {
                return false;
            }
            // get surrounding regions, either from the old matrix or from the persistence
            let newSurrounding = [];
            for (let i = 0; i < 9; ++i) {
                newSurrounding[i] = this.getRegionData(persister, this.surrounding, regionPos.x + World.DTX[i], regionPos.y + World.DTY[i]);
            }
            // remaining regions in the old matrix will be garbage collected. save them.
            for (let i = 0; i < 9; ++i) {
                let curRegion = this.surrounding[i];
                if (curRegion) {
                    savegame_1.SaveGameManager.saveRegion(persister, curRegion);
                }
            }
            this.surrounding = newSurrounding;
            let newCurrent = this.getCurrentRegion();
            if (!newCurrent) {
                Umbra.logger.critical("No region defined for current camera position");
                return false;
            }
            this.__currentRegion = newCurrent;
            return true;
        }
        getCellType(x, y, z) {
            if (!this.__currentRegion || z < 0 || z >= this.__currentRegion.levels.length) {
                return undefined;
            }
            x -= this.__currentRegion.boundingBox.x;
            y -= this.__currentRegion.boundingBox.y;
            if (!this.__currentRegion.boundingBox.contains(x, y)) {
                return undefined;
            }
            return this.__currentRegion.levels[z].cellTypes[this.offset(x, y)];
        }
        /** returns the coordinates of the region containing world position x,y  */
        worldPosToRegion(x, y) {
            x = Math.floor(x / Constants.OVERWORLD_REGION_SIZE);
            y = Math.floor(y / Constants.OVERWORLD_REGION_SIZE);
            return new Core.Position(x, y);
        }
        offset(x, y) {
            return x + y * this.__currentRegion.boundingBox.w;
        }
        /**
         * Layout of the surrounding regions matrix :
         *   0  1  2
         *   3  4  5
         *   6  7  8
         * Current region = index 4
         */
        getCurrentRegion() {
            return this.surrounding[4];
        }
        findRegionInMatrix(matrix, id) {
            if (!matrix) {
                return undefined;
            }
            for (let i = 0; i < 9; ++i) {
                let regionData = matrix[i];
                if (regionData && regionData.id === id) {
                    matrix[i] = undefined;
                    return regionData;
                }
            }
            return undefined;
        }
        getRegionData(persister, oldMatrix, x, y) {
            let id = x + "_" + y;
            let regionData = this.findRegionInMatrix(oldMatrix, id);
            if (!regionData) {
                regionData = savegame_1.SaveGameManager.loadRegion(persister, id);
            }
            return regionData;
        }
    }
    World.DTX = [-1, 0, 1, -1, 0, 1, -1, 0, 1];
    World.DTY = [-1, -1, -1, 0, 0, 0, 1, 1, 1];
    exports.World = World;
});
//# sourceMappingURL=main.js.map