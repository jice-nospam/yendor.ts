/*
	Section: Persistence
*/

module Game {
	"use strict";

	/*
		Interface: Persistent
		Anything that can be saved and restored.
		Must have a 0 parameter constructor that initializes the className field.
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
		/*
			Function: loadFromKey
			Retrieve an object from a given database key.

			Parameters :
			key - the database key
			object - if not provided, the persister must create the object
		*/
		loadFromKey(key: string, object?: any): any;
		/*
			Function: saveToKey
			Save an object into a database and associate it with given key

			Parameters :
			key - the database key you can use to get the object back with loadFromKey
			object - the object to save
		*/
		saveToKey(key: string, object: any);
		/*
			Function: deleteKey
			Delete the object associated with a key in the database

			Parameters:
			key - the database key
		*/
		deleteKey(key: string);
	}

	/*
		Class: LocalStoragePersister
		Implements Persister useing the browser's HTML5 local storage.
		Note : in internet explorer, this only work with http://... URL. Local storage
		will be disabled if you open the game with a file://... URL.
	*/
	export class LocalStoragePersister implements Persister {
		private localStorage : any;
		constructor() {
			this.localStorage = localStorage || window.localStorage;
		}
		private getDataFromKey(key: string): any {
			if (! this.localStorage) {
				return undefined;
			}
			// TODO use a JSON reviver to skip intermediate jsonData step
			var jsonString: string = this.localStorage.getItem(key);
			if ( ! jsonString ) {
				return undefined;
			}
			return  JSON.parse(jsonString);
		}

		saveToKey(key: string, object: any) {
			if (! this.localStorage) {
				return;
			}
			if ( object.save ) {
				object.save(key);
			} else {
				this.localStorage.setItem(key,
					typeof object === "string" ? object : JSON.stringify(object, this.jsonReplacer));
			}
		}

		private jsonReplacer(key: string, value: any) {
			// don't stingify fields starting with __
			if ( key.indexOf("__") === 0 ) {
				return undefined;
			}
			return value;
		}

		deleteKey(key: string) {
			if (! this.localStorage) {
				return;
			}
			this.localStorage.removeItem(key);
		}

		loadFromKey(localStorageKey: string, object?: any): any {
			var jsonData: any = this.getDataFromKey(localStorageKey);
			if (! jsonData ) {
				return undefined;
			}
			return this.loadFromData(jsonData, object);
		}

		private loadFromData(jsonData: any, object?: any): any {
			if ( jsonData instanceof Array ) {
				return this.loadArrayFromData(jsonData);
			} else if ( typeof jsonData === "object" ) {
				return this.loadObjectFromData(jsonData, object);
			}
			// basic field, number, string, boolean, ...
			return jsonData;
		}

		private loadArrayFromData(jsonData: any): Array<any> {
			var array = [];
			for (var i = 0; i < jsonData.length; i++) {
				array[i] = this.loadFromData(jsonData[i]);
			}
			return array;
		}

		private loadObjectFromData(jsonData: any, object?: any): any {
			if (! jsonData.className ) {
				throw new Error("Missing object className in json data :" + jsonData);
			}
			if (! object) {
				object = Object.create(window[Constants.MAIN_MODULE_NAME][jsonData.className].prototype);
				object.constructor.apply(object, []);
			}
			if ( object.load ) {
				// use custom loading method
				object.load(jsonData);
			} else {
				// use generic loading method
				for (var field in jsonData) {
					if ( jsonData.hasOwnProperty(field)) {
						object[field] = this.loadFromData(jsonData[field]);
					}
				}
			}
			return object;
		}
	}
}
