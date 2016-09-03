/**
	Section: Events
*/
import * as Core from "../core/main";
import * as Node from "./node";
import {logger} from "./main";

// built-in event types
export enum EventType {
    /** sends a message to the log. Associated data : a LogEvent */
    LOG
}

export interface EventListener {
    /**
        Property: enableEvents
        If false, no events are sent to this listener
    */
    enableEvents: boolean;
    /**
        Property: node
        Events are sent to listeners without node first, then in descending nodes' z order
    */
    node?: Node.Node;
}

/**
    Module: EventManager
    To get events, register to the type :
    > eventBus.registerEventListener( myListener, "fire_bullet" );
    myListener should implement a handler :
    > onFireBullet(data)
    The handler's parameter type depends on the event type. See <EventType>.
    The handler's name is the camelcase version of the EventType.
*/
export class EventManager {
    // registered event listeners
    private static listeners: {[index: string]: EventListener[]} = {};

    static registerEventListener(listener: EventListener, type: string) {
        if (!EventManager.listeners[type]) {
            EventManager.listeners[type] = new Array<EventListener>();
        }
        EventManager.listeners[type].push(listener);
    }

    static unregisterEventListener(listener: EventListener, type: string) {
        if (EventManager.listeners[type]) {
            let index: number = EventManager.listeners[type].indexOf(listener);
            if (index > -1) {
                EventManager.listeners[type].splice(index, 1);
            }
        }
    }

    /**
        Function: publishEvent
        post the event to every registered listener

        Parameters:
        type - the event type
        data - optional data to pass with the event
    */
    static publishEvent(type: string, data?: any) {
        if (EventManager.listeners[type]) {
            let selectedListeners: EventListener[] = EventManager.listeners[type];
            for (let i: number = 0, len: number = selectedListeners.length; i < len; ++i) {
                EventManager.processEvent(type, selectedListeners[i], data);
            }
        }
    }

    /**
        Function: processEvent
        call the event callback on a specific listener. The callback function's name
        is deduced from the event type : "on"+CamelCase(type).
        Example : type : "START_GAME" => callback : onStartGame(data?:any)

        Parameters:
        type - the event type
        eventListener - the event listener
        data - optional parameter to pass to the callback
    */
    static processEvent(type: string, eventListener: EventListener, data?: any) {
        let funcName: string = EventManager.eventTypeToCallback(type);
        let func: any = (<any>eventListener)[funcName];
        if (func && typeof func === "function") {
            if (data !== undefined) {
                func.call(eventListener, data);
            } else {
                func.call(eventListener);
            }
        } else {
            if ( type === EventType[EventType.LOG]) {
                console.log("Warning : object type " + ((<any>eventListener)["className"] ? (<any>eventListener)["className"] : "unknown")
                    + " does not implement handler " + funcName + " for event " + type);
            } else {
                logger.warn("Warning : object type " + ((<any>eventListener)["className"] ? (<any>eventListener)["className"] : "unknown")
                    + " does not implement handler " + funcName + " for event " + type);
            }
        }
    }

    static eventTypeToCallback(eventType: string): string {
        return "on" + Core.toCamelCase(eventType);
    }

    /**
        Function: addListener
        add a listener, sorted by descending node.zOrder, listeners without node first

        Parameters:
        listener - the listener to register
        listenerArray - the listener array to update
    */
    private static addListener<T extends EventListener>(listener: T, listenerArray: T[]) {
        let index = 0;
        if (listener.node) {
            let len = listenerArray.length;
            while (index < len && listenerArray[index].node && listenerArray[index].node.getZOrder() > listener.node.getZOrder()) {
                ++index;
            }
        }
        listenerArray.splice(index - 1, 0, listener);
    }

    /**
        Function: removeListener
        remove a listener from an array

        Parameters:
        listener - the listener to remove
        listenerArray - the listener array to update
    */
    private static removeListener<T>(listener: T, listenerArray: T[]) {
        let index = listenerArray.indexOf(listener);
        if (index !== undefined) {
            listenerArray.splice(index, 1);
        }
    }
}
