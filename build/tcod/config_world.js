define(["require", "exports", "./world/main"], function (require, exports, World) {
    "use strict";
    function registerWorldCellTypes(world) {
        world.cellTypes = [
            { isTransparent: true, isWalkable: false },
            { isTransparent: false, isWalkable: false },
            { color: "#689224", colorMode: 1 /* UNIFORM */, isTransparent: true, isWalkable: true },
            { color: "#AF8668", colorMode: 1 /* UNIFORM */, isTransparent: true, isWalkable: true },
            { color: "#B9A082", colorMode: 1 /* UNIFORM */, isTransparent: true, isWalkable: true },
        ];
    }
    exports.registerWorldCellTypes = registerWorldCellTypes;
});
//# sourceMappingURL=config_world.js.map