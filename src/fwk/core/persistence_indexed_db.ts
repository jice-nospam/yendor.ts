import Dexie from "dexie";
import {Persister, JSONSerializer} from "./persistence";
/**
	Section: Persistence
*/
interface DexieObject {
    key?: string;
    value: string;
}
/**
    Class: DexiePersister
    Implements Persister using the browser's IndexedDb.
*/
export class IndexedDbPersister extends Dexie implements Persister {
    data: Dexie.Table<DexieObject, string>;
    constructor() {
        super("YendorDb");
        this.version(1).stores({data: 'key, value'});
    }
    public loadFromKey(key: string, object?: any): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            this.data.get(key).then((value) => {
                let objectValue = value ? JSONSerializer.json2Object(value.value, object) : undefined;
                resolve(objectValue);
            }).catch((err)=> {
                reject(err);
            });
        });
    }
    public saveToKey(key: string, object: any): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.data.put({key:key, value:JSONSerializer.object2Json(object)}).then((value) => {
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
    }
    public deleteKey(key: string): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.data.delete(key).then((value) => {
                resolve();
            }).catch((err) => {
                reject(err);
            });
        });
    }
}
