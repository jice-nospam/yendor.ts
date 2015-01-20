module Game {
	"use strict";

	export const enum MouseButton {
		LEFT = 1,
		MIDDLE = 2,
		RIGHT = 3
	}

	export enum EventType {
		// change game status. Associated data : GameStatus
		CHANGE_STATUS,
		// save the game. no data associated
		SAVE_GAME,
		// key press event. Associated data : KeyInput
		KEYBOARD_INPUT,
		// sends a message to the log. Associated data : Message containing the text and the color
		LOG_MESSAGE,
		// mouse movement. Associated data : Yendor.Position with mouse coordinates on the root console
		MOUSE_MOVE,
		// mouse button press event. Associated data : MouseButton
		MOUSE_CLICK,
		// open the tile picker. Associated data : TilePickerListener
		PICK_TILE,
		// open the inventory
		OPEN_INVENTORY,
		// open the main menu
		OPEN_MAIN_MENU,
		REMOVE_ACTOR,
		// starts a new game
		NEW_GAME,
		// player gains xp. Associated data : number (xp amount)
		GAIN_XP,
	}

	/*
		Interface: EventListener
		To get events, register to the type :
		> eventBus.registerListener(this, EventType.KEYBOARD_INPUT);
		and implement a handler :
		> onKEYBOARD_INPUT(input: KeyInput)
		The handler's parameter type depends on the event type. See <EventType>.
	*/
	export interface EventListener {
	}

	/*
		Class: EventBus
		Stores event listeners and dispatch events to them.
	*/
	export class EventBus {
		private listeners: Array<EventListener[]> = [];

		registerListener(listener: EventListener, type: EventType) {
			if (!this.listeners[type]) {
				this.listeners[type] = new Array<EventListener>();
			}
			this.listeners[type].push(listener);
		}

		unregisterListener(listener: EventListener, type: EventType) {
			if (this.listeners[type]) {
				var index: number = this.listeners[type].indexOf(listener);
				if ( index > -1 ) {
					this.listeners[type].splice(index, 1);
				}
			}
		}

		publishEvent( type: EventType, data?: any) {
			if ( this.listeners[type] ) {
				var selectedListeners: EventListener[] = this.listeners[type];
				for ( var i = 0; i < selectedListeners.length; i++) {
					this.postEvent(type, selectedListeners[i], data);
				}
			}
		}

		postEvent(type: EventType, eventListener: EventListener, data?: any) {
	        var func: any = eventListener["on" + EventType[type]];
	        if ( func && typeof func === "function" ) {
	        	if ( data ) {
	            	func.call(eventListener, data);
	            } else {
	            	func.call(eventListener);
	            }
	        } else {
	            console.log("Warning : object type " + (eventListener["className"] ? eventListener["className"] : "unknown")
	            + " does not implement handler for event " + EventType[type]);
	        }
	    }
	}
}
