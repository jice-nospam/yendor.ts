import {IPersister, JSONSerializer} from "./persistence";
/**
 * Section: Persistence
 */

/**
 * Class: LocalStoragePersister
 * Implements Persister using the browser's HTML5 local storage.
 * Note : in internet explorer, this only works with http://... URL. Local storage
 * will be disabled if you open the game with a file://... URL.
 */
export class LocalStoragePersister implements IPersister {
    private localStorage: any;
    constructor() {
        this.localStorage = localStorage || window.localStorage;
    }

    public saveToKey(key: string, object: any): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!this.localStorage) {
                resolve();
                return ;
            }
            // console.log("saving " + key + " to local storage...");
            this.localStorage.setItem(key, JSONSerializer.object2Json(object));
            resolve();
        });
    }

    public deleteKey(key: string): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!this.localStorage) {
                resolve();
                return ;
            }
            console.log("deleting " + key + " from local storage...");
            this.localStorage.removeItem(key);
            resolve();
        });
    }

    public loadFromKey(key: string, object?: any): Promise<any> {
        return new Promise<any>((resolve) => {
            if (!this.localStorage) {
                resolve(undefined);
                return ;
            }
            console.log("loading " + key + " from local storage...");
            let value = JSONSerializer.json2Object(this.localStorage.getItem(key), object);
            resolve(value);
        });
    }
}
