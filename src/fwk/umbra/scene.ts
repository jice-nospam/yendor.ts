/**
 * Section: Scene management
 */
import * as Yendor from "../yendor/main";
import {ExpandEnum, Node} from "./node";
import {URL_PARAM_DEBUG} from "./constants";
import {application, logger} from "./main";

export abstract class Scene extends Node {
    constructor() {
        super();
        this._expand = ExpandEnum.BOTH;
    }
}

export class SceneManager {
    /**
     * Function: runScene
     * Terminate the current scene and replace it with a new one
     * Parameters:
     * scene - the new current scene
     */
    public static runScene(scene: Scene): void {
        if (SceneManager.currentScene) {
            SceneManager.currentScene.termHierarchy();
        }
        SceneManager.currentScene = scene;
        scene.initHierarchy();
        if ( Yendor.urlParams[URL_PARAM_DEBUG]) {
            scene.computeBoundingBox();
            scene.expand(application.getConsole().width, application.getConsole().height);
            scene.logSceneGraph();
        }
    }

    /**
     * Function: getRunningScene
     * Returns:
     * the current scene
     */
    public static getRunningScene(): Scene {
        return SceneManager.currentScene;
    }

    /**
     * Function: pushScene
     * stack the current scene
     */
    public static pushScene(): void {
        SceneManager.sceneStack.push(SceneManager.currentScene);
    }

    /**
     * Function: popScene
     * Terminate the current scene and start the one at the top of the stack
     * Returns:
     * the new current scene
     */
    public static popScene(): Scene|undefined {
        if (SceneManager.currentScene) {
            SceneManager.currentScene.onTerm();
        }
        let scene: Scene|undefined = SceneManager.sceneStack.pop();
        if (!scene) {
            logger.critical("Cannot pop the last scene");
            return undefined;
        }
        SceneManager.currentScene = scene;
        SceneManager.currentScene.onInit();
        return SceneManager.currentScene;
    }

    private static currentScene: Scene;
    private static sceneStack: Scene[] = [];
}
