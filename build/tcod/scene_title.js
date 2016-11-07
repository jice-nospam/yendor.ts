define(["require", "exports", "../fwk/umbra/main", "../fwk/gui/main", "./scene_play"], function (require, exports, Umbra, Gui, scene_play_1) {
    "use strict";
    class TcodMainMenu extends Gui.Widget {
        constructor() {
            super();
            let popup = this.addChild(new Gui.Popup({}));
            let vpanel = popup.addChild(new Gui.VPanel({}));
            vpanel.addChild(new Gui.Button({ callback: this.startPlayScene, label: "Play" }));
            vpanel.addChild(new Gui.Button({ label: "Character" }));
            vpanel.addChild(new Gui.Button({ label: "Options" }));
            vpanel.addChild(new Gui.Button({ label: "Exit" }));
        }
        onRender(_con) {
            this.center();
        }
        onUpdate(_time) {
        }
        startPlayScene() {
            Umbra.SceneManager.pushScene();
            Umbra.SceneManager.runScene(new scene_play_1.PlayScene());
            return true;
        }
    }
    exports.TcodMainMenu = TcodMainMenu;
    class TitleScene extends Umbra.Scene {
        onInit() {
            let mainMenu = new TcodMainMenu();
            mainMenu.moveTo(15, 10);
            this.addChild(mainMenu);
        }
        onRender(_con) {
        }
        onUpdate(_time) {
        }
    }
    exports.TitleScene = TitleScene;
});
//# sourceMappingURL=scene_title.js.map