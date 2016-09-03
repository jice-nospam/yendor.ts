import {Persister, JSONSerializer} from "./persistence";
/**
	Section: Persistence
*/

/**
    Class: LocalStoragePersister
    Implements Persister using the browser's HTML5 local storage.
    Note : in internet explorer, this only works with http://... URL. Local storage
    will be disabled if you open the game with a file://... URL.
*/
export class LocalStoragePersister implements Persister {
    private localStorage: any;
    constructor() {
        this.localStorage = localStorage || window.localStorage;
    }

    saveToKey(key: string, object: any): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!this.localStorage) {
                resolve();
                return ;
            }
            this.localStorage.setItem(key, JSONSerializer.object2Json(object));
            resolve();
        });
    }

    deleteKey(key: string): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!this.localStorage) {
                resolve();
                return ;
            }
            this.localStorage.removeItem(key);
            resolve();
        });
    }

    // TODO loadFromKey<T>
    loadFromKey(localStorageKey: string, object?: any): Promise<any> {
        return new Promise<any>((resolve)=> {
            if (!this.localStorage) {
                resolve(undefined);
                return ;
            }
            let value = JSONSerializer.json2Object(this.localStorage.getItem(localStorageKey), object);
            resolve(value);
        });
    }
}
