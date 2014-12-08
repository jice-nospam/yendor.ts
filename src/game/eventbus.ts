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
		// key press event. Associated data : KeyboardEvent
		KEY_PRESSED,
		// sends a message to the log. Associated data : Message containing the text and the color
		LOG_MESSAGE,
		// mouse movement. Associated data : Yendor.Position with mouse coordinates on the root console
		MOUSE_MOVE,
		// mouse button press event. Associated data : MouseButton
		MOUSE_CLICK,
		// open the tile picker. Associated data : the reply event
		PICK_TILE,
		// open the inventory
		OPEN_INVENTORY,
		REMOVE_ACTOR,
		// starts a new game
		NEW_GAME,
		// go to next dungeon level
		NEXT_LEVEL,
		// go to previous dungeon level
		PREV_LEVEL,
	}

	export class Event<T> {
		private _type: EventType;
		private _data: T;
		private _actorManager: ActorManager;
		private _map : Map;
		constructor(_type: EventType, _data?: T) {
			this._type = _type;
			this._data = _data;
		}
		get type() { return this._type; }
		get data() { return this._data; }
		get actorManager() {return this._actorManager; }
		get map() { return this._map; }

		initContext(actorManager: ActorManager, map: Map) {
			this._actorManager = actorManager;
			this._map = map;
		}
	}
	export interface EventListener {
		processEvent( ev: Event<any> );
	}
	export class EventBus {
		private static instance: EventBus = new EventBus();

		private listeners: Array<EventListener[]> = [];
		private actorManager: ActorManager;
		private map: Map;

		static getInstance() { return EventBus.instance; }

		init(actorManager: ActorManager, map: Map) {
			this.map = map;
			this.actorManager = actorManager;
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
			event.initContext(this.actorManager, this.map);
			if ( this.listeners[event.type] ) {
				var selectedListeners: EventListener[] = this.listeners[event.type];
				for ( var i = 0; i < selectedListeners.length; i++) {
					selectedListeners[i].processEvent(event);
				}
			}
		}
	}
}
