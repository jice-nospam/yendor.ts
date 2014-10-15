module Game {
	export enum EventType {
		/*
			change game status. Associated data : GameStatus
		*/
		CHANGE_STATUS,
		/*
			key press event. Associated data : KeyboardEvent
		*/
		KEY_PRESSED,
		/*
			sends a message to the log. Associated data : 
		*/
		LOG_MESSAGE,
		/*
			mouse movement. Associated data : Yendor.Position with mouse coordinates on the root console
		*/
		MOUSE_MOVE,
		/*
			mouse button press event. Associated data : button num (0: left, 1: middle, 2: right)
		*/
		MOUSE_CLICK,
		/*
			open the tile picker. Associated data : the reply event
		*/
		PICK_TILE,
		REMOVE_ACTOR,
	}

	export class Event<T> {
		private _actorManager: ActorManager;
		private _map : Map;
		constructor( private _type:EventType, private _data?:T ) {}
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
		processEvent( ev:Event<any> );
	}
	export class EventBus {
		private listeners:Array<EventListener[]> = [];
		private actorManager:ActorManager;
		private map: Map;
		private static instance:EventBus = new EventBus();

		init(actorManager:ActorManager, map: Map) {
			this.map = map;
			this.actorManager = actorManager;
		}

		static getInstance() { return EventBus.instance; }

		registerListener(listener: EventListener, type:EventType) {
			if (!this.listeners[type]) {
				this.listeners[type] = new Array<EventListener>();
			}
			this.listeners[type].push(listener);
		}

		publishEvent( event:Event<any>) {
			event.initContext(this.actorManager, this.map);
			if ( this.listeners[event.type] ) {
				var selectedListeners:EventListener[] = this.listeners[event.type];
				for ( var i=0; i < selectedListeners.length; i++) {
					selectedListeners[i].processEvent(event);
				}
			}
		}
	}
}
