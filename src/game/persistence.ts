/*
	Section: Persistence
*/

module Game {
	"use strict";

	/*
		Interface: Persistent
		Anything that can be saved and restored.
		Must have a 0 parameter constructor that initialize the className field.
	*/
	export interface Persistent {
		/*
			Property: className
		*/
		className: string;
		load?: (jsonData: any) => any;
		save?: (key: string) => void;
	}

	/*
		Interface: Persister
		Can save/load objects from a repository
	*/
	export interface Persister {
		getDataFromKey(key: string): any;
		loadFromKey(key: string, object?: any): any;
		loadFromData(jsonData: any, object?: any): any;
		saveToKey(key: string, object: any);
	}

	/*
		Class: LocalStoragePersister
		save/load objects from the browser HTML5 local storage
	*/
	export class LocalStoragePersister implements Persister {
		getDataFromKey(key: string): any {
			// TODO use a JSON reviver to skip intermediate jsonData step
			return  JSON.parse(localStorage.getItem(key));
		}

		saveToKey(key: string, object: any) {
			if ( object.save ) {
				object.save(key);
			} else {
				localStorage.setItem(key, typeof object === "string" ? object : JSON.stringify(object));
			}
		}

		loadFromKey(localStorageKey: string, object?: any): any {
			var jsonData: any = this.getDataFromKey(localStorageKey);
			return this.loadFromData(jsonData, object);
		}

		loadFromData(jsonData: any, object?: any): any {
			if (! object ) {
				if (! jsonData.className ) {
					throw new Error("Missing className in json data :" + jsonData);
				}
				object = Object.create(window[Constants.MAIN_MODULE_NAME][jsonData.className].prototype);
				object.constructor.apply(object, []);
			}
			if ( object.load ) {
				object.load(jsonData);
			} else {
				for (var field in jsonData) {
					if ( jsonData.hasOwnProperty(field)) {
						var fieldJsonData: any = jsonData[field];
						if ( fieldJsonData.className ) {
							object[field] = this.loadFromData(fieldJsonData);
						} else {
							object[field] = fieldJsonData;
						}
					}
				}
			}
			return object;
		}
	}
}
