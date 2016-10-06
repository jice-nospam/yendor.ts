/**
 * Section: Persistence
 */

/**
 * Interface: Persistent
 * Anything that can be saved and restored.
 * Fields starting with two underscores are not persisted.
 * Watch out for cyclic dependencies!
 * During loading phase, the constructor is called without parameters.
 * Then field values are restored from the saved json.
 */
export interface IPersistent {
    /**
     * Function: load
     * Optional custom loading function.
     * Parameters:
     * jsonData - parsed json data to load from
     */
    load?: (jsonData: any) => void;

    /**
     * Function: postLoad
     * Optional function called after the object is loaded.
     */
    postLoad?: () => void;
}

/**
 * Interface: Persister
 * Can save/load objects from a repository
 */
export interface IPersister {
    /**
     * Function: loadFromKey
     * Retrieve an object from a given database key.
     * Parameters :
     * key - the database key
     * object - if not provided, the persister will create the object
     */
    loadFromKey(key: string, object?: any ): Promise<any>;

    /**
     * Function: saveToKey
     * Save an object into a database and associate it with given key
     * Parameters :
     * key - the database key you can use to get the object back with loadFromKey
     * object - the object to save
     */
    saveToKey(key: string, object: any): Promise<void>;
    /**
     * Function: deleteKey
     * Delete the object associated with a key in the database
     * Parameters:
     * key - the database key
     */
    deleteKey(key: string): Promise<void>;
}

/**
 * class: Persistence
 * All persisted class must be registered as I didn't find a way to get the class from its name with ES6 modules
 */
export class Persistence {
    public static registerClass(name: string, clas: any) {
        Persistence.classes[name] = clas;
    }

    public static getClass(name: string) {
        return Persistence.classes[name];
    }

    private static classes: {[index: string]: any} = {};
}

export class JSONSerializer {
    public static json2Object(json: string, object?: any): any {
        if (! json) {
            return undefined;
        }
        // TODO use a JSON reviver to skip intermediate jsonData step
        let jsonData: any = JSON.parse(json);
        if (! jsonData) {
            return undefined;
        }
        return JSONSerializer.loadFromData(jsonData, object);
    }

    public static object2Json(object: any): string|undefined {
        if (typeof object === "string") {
            return object;
        } else if ( JSONSerializer.needsClassName(object) ) {
            // store the object's class to be able to recreate it with the right prototype when loading
            object.className = object.constructor.name;
        }
        try {
            let json: string = JSON.stringify(object, JSONSerializer.jsonReplacer);
            return json;
        } catch (err) {
            console.log("Error while serializing " + object.className + " to JSON:" + err);
            return undefined;
        }
    }

    private static needsClassName(object: any): boolean {
        return object && typeof object === "object" && object.constructor.name !== "Array";
    }

    private static jsonReplacer(key: string, value: any) {
        // don't stringify fields starting with __
        if (key.indexOf("__") === 0) {
            return undefined;
        }
        if ( JSONSerializer.needsClassName(value) ) {
            // store the object's class to be able to recreate it with the right prototype when loading
            value.className = value.constructor.name;
        }
        return value;
    }

    private static loadFromData(jsonData: any, object?: any): any {
        if ( jsonData === null || jsonData === undefined ) {
            return undefined;
        }
        if (jsonData instanceof Array) {
            return JSONSerializer.loadArrayFromData(jsonData, object);
        } else if (typeof jsonData === "object") {
            return JSONSerializer.loadObjectFromData(jsonData, object);
        }
        // basic field, number, string, boolean, ...
        return jsonData;
    }

    private static loadArrayFromData(jsonData: any, object?: any): Array<any> {
        let array = (object && typeof(object) === "array") ? object : [];
        for (let i: number = 0, len: number = jsonData.length; i < len; ++i) {
            array[i] = this.loadFromData(jsonData[i]);
        }
        return array;
    }

    private static loadObjectFromData(jsonData: any, object?: any): any {
        if (!object) {
            if (!jsonData.className || jsonData.className === "Object") {
                object = {};
            } else {
                let clas: any = Persistence.getClass(<string> jsonData.className);
                if ( clas ) {
                    object = new clas();
                } else {
                    console.log("Error reading from persistence : unknown class " + jsonData.className);
                    return undefined;
                }
            }
        }
        if (object.load) {
            // use custom loading method
            object.load(jsonData);
        } else {
            // use generic loading method
            for (let field in jsonData) {
                if (jsonData.hasOwnProperty(field)) {
                    object[field] = this.loadFromData(jsonData[field]);
                }
            }
        }
        if (object.postLoad) {
            object.postLoad();
        }
        return object;
    }
}
