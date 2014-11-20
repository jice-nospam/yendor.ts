/*
	Section: Persistence
*/

module Game {
	"use strict";

	/*
		Interface: Persistent
		Anything that can be saved and restored from the browser local database.
	*/
	export interface Persistent {

		className: string;
		/*
			Function: load
			populate the object's fields from the json data.

			Parameters:
			jsonData - data obtained from json

			Returns:
			true if the data could be parsed
		*/
		load(jsonData: any): boolean;
	}
}
