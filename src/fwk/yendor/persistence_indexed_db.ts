import Dexie from "dexie";
import {IPersister, JSONSerializer} from "./persistence";
/**
 * Section: Persistence
 */
interface IDexieObject {
    key?: string;
    value?: string;
}

/**
 * Class: DexiePersister
 * Implements Persister using the browser's IndexedDb.
 */
export class IndexedDbPersister extends Dexie implements IPersister {
    private data: Dexie.Table<IDexieObject, string>;
    constructor() {
        super("YendorDb");
        this.version(1).stores({data: "key, value"});
    }
    public loadFromKey(key: string, object?: any): Promise<any> {
        return new Promise<any>((resolve) => {
            console.log("loading " + key + " from indexedDb...");
            this.data.get(key).then((value) => {
                let objectValue = value && value.value ? JSONSerializer.json2Object(value.value, object) : undefined;
                resolve(objectValue);
            });
        });
    }
    public saveToKey(key: string, object: any): Promise<void> {
        return new Promise<void>((resolve) => {
            // console.log("saving " + key + " to indexedDb...");
            this.data.put({key: key, value: JSONSerializer.object2Json(object)}).then((_value) => {
                resolve();
            });
        });
    }
    public deleteKey(key: string): Promise<void> {
        return new Promise<void>((resolve) => {
            console.log("deleting " + key + " from indexedDb...");
            this.data.delete(key).then((_value) => {
                resolve();
            });
        });
    }
}
