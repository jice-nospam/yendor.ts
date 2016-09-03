/**
	Section: Scene management
*/
import {Node} from "./node";

export abstract class Scene extends Node {
}

export class SceneManager {
    private static currentScene: Scene;
    private static sceneStack: Scene[] = [];

    /**
        Function: runScene
        Terminate the current scene and replace it with a new one
        
        Parameters:
        scene - the new current scene
    */
    static runScene(scene: Scene): void {
        if (SceneManager.currentScene) {
            SceneManager.currentScene.termHierarchy();
        }
        SceneManager.currentScene = scene;
        scene.initHierarchy();
    }

    /**
        Function: getRunningScene
        
        Returns:
        the current scene
    */
    static getRunningScene(): Scene {
        return SceneManager.currentScene;
    }

    /**
        Function: pushScene
        stack the current scene
    */
    static pushScene(): void {
        SceneManager.sceneStack.push(SceneManager.currentScene);
    }

    /**
        Function: popScene
        Terminate the current scene and start the one at the top of the stack
        
        Returns:
        the new current scene
    */
    static popScene(): Scene {
        if (SceneManager.currentScene) {
            SceneManager.currentScene.onTerm();
        }
        SceneManager.currentScene = SceneManager.sceneStack.pop();
        if (SceneManager.currentScene) {
            SceneManager.currentScene.onInit();
        }

        return SceneManager.currentScene;
    }

}
