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
			The name of the class must be saved along with the object properties
			to be able to restore the right type of object when loading from
			the database
		*/
		className: string;
		/*
			Function: load
			Optional custom loading function.

			Parameters:
			jsonData - parsed json data to load from
		*/
		load?: (jsonData: any) => any;
		/*
			Function: save
			Optional custom saving function

			Parameters:
			key - key to access this object's saved data
		*/
		save?: (key: string) => void;
	}

	/*
		Interface: Persister
		Can save/load objects from a repository
	*/
	export interface Persister {
		getDataFromKey(key: string): any;
		loadFromKey(key: string, object?: any): any;
		saveToKey(key: string, object: any);
		deleteKey(key: string);
	}

	/*
		Class: LocalStoragePersister
		save/load objects from the browser HTML5 local storage
	*/
	export class LocalStoragePersister implements Persister {
		getDataFromKey(key: string): any {
			// TODO use a JSON reviver to skip intermediate jsonData step
			var jsonString: string = localStorage.getItem(key);
			if ( ! jsonString ) {
				return undefined;
			}
			return  JSON.parse(jsonString);
		}

		saveToKey(key: string, object: any) {
			if ( object.save ) {
				object.save(key);
			} else {
				localStorage.setItem(key, typeof object === "string" ? object : JSON.stringify(object));
			}
		}

		deleteKey(key: string) {
			localStorage.removeItem(key);
		}

		loadFromKey(localStorageKey: string, object?: any): any {
			var jsonData: any = this.getDataFromKey(localStorageKey);
			if (! jsonData ) {
				return undefined;
			}
			return this.loadFromData(jsonData, object);
		}

		private loadFromData(jsonData: any, object?: any): any {
			if (! object ) {
				if (! jsonData.className ) {
					if ( jsonData.length !== undefined ) {
						// array
						object = [];
					} else {
						throw new Error("Missing className in json data :" + jsonData);
					}
				} else {
					object = Object.create(window[Constants.MAIN_MODULE_NAME][jsonData.className].prototype);
					object.constructor.apply(object, []);
				}
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
