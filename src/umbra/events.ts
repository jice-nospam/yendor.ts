/*
	Section: Events
*/
module Umbra {
    "use strict";

    export interface EventListener {
		/*
			Property: enableEvents
			If false, no events are sent to this listener
		*/
        enableEvents: boolean;
		/*
			Property: node
			Events are sent to listeners without node first, then in descending nodes' z order
		*/
        node?: Node;
    }

	/*
		Module: EventManager
		To get events, register to the type :
		> eventBus.registerEventListener( myListener, "fire_bullet" );
		and implement a handler :
		> onFireBullet(data)
		The handler's parameter type depends on the event type. See <EventType>.
		The handler's name is the camelcase version of the EventType.
	*/
    export module EventManager {
        // registered event listeners
        var listeners: Array<EventListener[]> = [];

        export function registerEventListener(listener: EventListener, type: string) {
            if (!listeners[type]) {
                listeners[type] = new Array<EventListener>();
            }
            listeners[type].push(listener);
        }

        export function unregisterEventListener(listener: EventListener, type: string) {
            if (listeners[type]) {
                var index: number = listeners[type].indexOf(listener);
                if (index > -1) {
                    listeners[type].splice(index, 1);
                }
            }
        }

        /*
            Function: publishEvent
            post the event to every registered listener
            
            Parameters:
            type - the event type
            data - optional data to pass with the event
        */
        export function publishEvent(type: string, data?: any) {
            if (listeners[type]) {
                var selectedListeners: EventListener[] = listeners[type];
                for (var i: number = 0, len: number = selectedListeners.length; i < len; ++i) {
                    processEvent(type, selectedListeners[i], data);
                }
            }
        }

        /*
            Function: processEvent
            call the event callback on a specific listener. The callback function's name
            is deduced from the event type : "on"+CamelCase(type).
            Example : type : "START_GAME" => callback : onStartGame(data?:any)
            
            Parameters:
            type - the event type
            eventListener - the event listener
            data - optional parameter to pass to the callback
        */
        export function processEvent(type: string, eventListener: EventListener, data?: any) {
            var funcName: string = "on" + Core.toCamelCase(type);
            var func: any = eventListener[funcName];
            if (func && typeof func === "function") {
                if (data !== undefined) {
                    func.call(eventListener, data);
                } else {
                    func.call(eventListener);
                }
            } else {
                console.log("Warning : object type " + (eventListener["className"] ? eventListener["className"] : "unknown")
                    + " does not implement handler " + funcName + " for event " + type);
            }
        }

		/*
			Function: addListener
			add a listener, sorted by descending node.zOrder, listeners without node first
			
			Parameters:
			listener - the listener to register
			listenerArray - the listener array to update
		*/
        function addListener<T extends EventListener>(listener: T, listenerArray: T[]) {
            var index = 0;
            if (listener.node) {
                var len = listenerArray.length;
                while (index < len && listenerArray[index].node && listenerArray[index].node.getZOrder() > listener.node.getZOrder()) {
                    ++index;
                }
            }
            listenerArray.splice(index - 1, 0, listener);
        }

		/*
			Function: removeListener
			remove a listener from an array
			
			Parameters:
			listener - the listener to remove
			listenerArray - the listener array to update
		*/
        function removeListener<T>(listener: T, listenerArray: T[]) {
            var index = listenerArray.indexOf(listener);
            if (index != undefined) {
                listenerArray.splice(index, 1);
            }
        }
    }
}
