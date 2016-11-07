define(["require", "exports", "../fwk/yendor/main", "../fwk/umbra/main", "../fwk/map/main", "../fwk/actors/main", "./world/main", "./config_persistent", "./config_actors", "./config_world"], function (require, exports, Yendor, Umbra, Map, Actors, World, config_persistent_1, config_actors_1, config_world_1) {
    "use strict";
    class PlayScene extends Map.MapScene {
        constructor() {
            super(new Map.DungeonRendererNode(new Map.LightDungeonShader(new Map.BasicMapShader())), new Yendor.LocalStoragePersister());
            this.world = new World.World();
            config_world_1.registerWorldCellTypes(this.world);
        }
        onInit() {
            super.onInit();
            config_persistent_1.registerPersistentClasses();
            // let savegame: ISaveGameSummary|undefined = SaveGameManager.getCurrentSavegame(this.persister);
            this._map.init(Umbra.application.getConsole().width, Umbra.application.getConsole().height);
            let player = this.createPlayer();
            if (player) {
                this.initPlayerInventory(player);
                if (this.world.streamRegions(this.persister, player)) {
                    this.updateMap();
                }
            }
        }
        onRender(_con) {
        }
        onUpdate(time) {
            let player = Actors.Actor.specialActors[Actors.SpecialActorsEnum.PLAYER];
            let oldPlayerX = player.pos.x;
            let oldPlayerY = player.pos.y;
            super.onUpdate(time);
            if (player.pos.x !== oldPlayerX || player.pos.y !== oldPlayerY) {
                if (this.world.streamRegions(this.persister, player)) {
                    this.updateMap();
                }
            }
        }
        createPlayer() {
            let player = Actors.ActorFactory.create(config_actors_1.ACTOR_TYPES.PLAYER, this.playerTilePicker, this.playerInventoryPicker);
            if (!player) {
                Umbra.logger.critical("Missing actor class " + config_actors_1.ACTOR_TYPES.PLAYER);
                return undefined;
            }
            Actors.Actor.specialActors[Actors.SpecialActorsEnum.PLAYER] = player;
            player.register();
            player.moveTo(40, 25);
            return player;
        }
        initPlayerInventory(player) {
            let torch = Actors.ActorFactory.create(config_actors_1.ACTOR_TYPES.TORCH);
            if (torch) {
                torch.moveTo(player.pos.x, player.pos.y);
                torch.register();
                torch.pickable.pick(torch, player, false);
            }
        }
        updateMap() {
            let player = Actors.Actor.specialActors[Actors.SpecialActorsEnum.PLAYER];
            // world coordinate of top left screen cell
            let topLeftX = player.pos.x - this._map.w / 2;
            let topLeftY = player.pos.y - this._map.h / 2;
            for (let y = 0; y < this._map.h; ++y) {
                let celly = topLeftY + y;
                for (let x = 0; x < this._map.w; ++x) {
                    let cellx = topLeftX + x;
                    // TODO non 0 z
                    let cellTypeIndex = this.world.getCellType(cellx, celly, 0);
                    let cellType = cellTypeIndex ?
                        this.world.cellTypes[cellTypeIndex] : undefined;
                    if (cellType) {
                        this._map.setWalkable(x, y, cellType.isWalkable);
                        this._map.setTransparent(x, y, cellType.isTransparent);
                    }
                    else {
                        // TODO default cell depends on underground/overworld region type
                        this._map.setFloor(x, y);
                    }
                }
            }
        }
    }
    exports.PlayScene = PlayScene;
});
//# sourceMappingURL=scene_play.js.map