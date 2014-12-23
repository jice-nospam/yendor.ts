module Game {
	"use strict";

	export enum MouseButton {
		LEFT = 1,
		MIDDLE = 2,
		RIGHT = 3
	}

	export enum EventType {
		// change game status. Associated data : GameStatus
		CHANGE_STATUS,
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
		// go to next dungeon level
		NEXT_LEVEL,
		// go to previous dungeon level
		PREV_LEVEL,
		// player gains xp. Associated data : number (xp amount)
		GAIN_XP,
	}

	export class Event<T> {
		private _type: EventType;
		private _data: T;
		private _map : Map;
		constructor(_type: EventType, _data?: T) {
			this._type = _type;
			this._data = _data;
		}
		get type() { return this._type; }
		get data() { return this._data; }
		get map() { return this._map; }

		initContext(map: Map) {
			this._map = map;
		}
	}
	export interface EventListener {
		processEvent( ev: Event<any> );
	}
	export class EventBus {
		private static _instance: EventBus = new EventBus();
		static get instance() { return EventBus._instance; }

		private listeners: Array<EventListener[]> = [];
		private map: Map;

		init(map: Map) {
			this.map = map;
		}

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

		publishEvent( event: Event<any>) {
			event.initContext(this.map);
			if ( this.listeners[event.type] ) {
				var selectedListeners: EventListener[] = this.listeners[event.type];
				for ( var i = 0; i < selectedListeners.length; i++) {
					selectedListeners[i].processEvent(event);
				}
			}
		}
	}
}
