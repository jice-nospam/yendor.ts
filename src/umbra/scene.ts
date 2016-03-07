/*
	Section: Scene management
*/
module Umbra {
    "use strict";
    export abstract class Scene extends Node {
    }

    export module SceneManager {
        var currentScene: Scene;
        var sceneStack: Scene[] = [];

		/*
			Function: runScene
			Terminate the current scene and replace it with a new one
			
			Parameters:
			scene - the new current scene
		*/
        export function runScene(scene: Scene): void {
            if (this.currentScene) {
                this.currentScene.termHierarchy();
            }
            this.currentScene = scene;
            scene.initHierarchy();
        }

		/*
			Function: getRunningScene
			
			Returns:
			the current scene
		*/
        export function getRunningScene(): Scene {
            return this.currentScene;
        }

		/*
			Function: pushScene
			stack the current scene
		*/
        export function pushScene(): void {
            this.sceneStack.push(this.currentScene);
        }

		/*
			Function: popScene
			Terminate the current scene and start the one at the top of the stack
			
			Returns:
			the new current scene
		*/
        export function popScene(): Scene {
            if (this.currentScene) {
                this.currentScene.onTerm();
            }
            this.currentScene = this.sceneStack.pop();
            if (this.currentScene) {
                this.currentScene.onInit();
            }

            return this.currentScene;
        }

    }

}
