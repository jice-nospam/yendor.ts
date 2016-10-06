/**
 * Section: Events
 */
import * as Core from "../core/main";
import * as Node from "./node";
import {logger} from "./main";
import {EVENT_LOG} from "./constants";

export interface IDragEvent {
    startPos: Core.Position;
    startCellPos: Core.Position;
}

export interface IEventListener {
    /**
     * Property: enableEvents
     * If false, no events are sent to this listener
     */
    enableEvents: boolean;

    /**
     * Property: node
     * Events are sent to listeners without node first, then in descending nodes' z order
     */
    node?: Node.Node;
}

/**
 * Class: EventManager
 * To get events, register to the type :
 * > eventBus.registerEventListener( myListener, "fire_bullet" );
 * myListener should implement a handler :
 * > onFireBullet(data)
 * The handler's parameter type depends on the event type. See <EventType>.
 * The handler's name is the camelcase version of the EventType.
 */
export class EventManager {
    public static registerEventListener(listener: IEventListener, type: string) {
        if (!EventManager.listeners[type]) {
            EventManager.listeners[type] = new Array<IEventListener>();
        }
        EventManager.addListener(listener, EventManager.listeners[type]);
    }

    public static unregisterEventListener(listener: IEventListener, type: string) {
        if (EventManager.listeners[type]) {
            let index: number = EventManager.listeners[type].indexOf(listener);
            if (index > -1) {
                EventManager.listeners[type].splice(index, 1);
            }
        }
    }

    /**
     * Function: publishEvent
     * post the event to every registered listener
     * Parameters:
     * type - the event type
     * data - optional data to pass with the event
     */
    public static publishEvent(type: string, data?: any) {
        if (EventManager.listeners[type]) {
            for (let listener of EventManager.listeners[type]) {
                EventManager.processEvent(type, listener, data);
            }
        }
    }

    /**
     * Function: processEvent
     * call the event callback on a specific listener. The callback function's name
     * is deduced from the event type : "on"+CamelCase(type).
     * Example : type : "START_GAME" => callback : onStartGame(data?:any)
     * Parameters:
     * type - the event type
     * eventListener - the event listener
     * data - optional parameter to pass to the callback
     */
    public static processEvent(type: string, eventListener: IEventListener, data?: any) {
        let funcName: string = EventManager.eventTypeToCallback(type);
        let func: any = (<any> eventListener)[funcName];
        if (func && typeof func === "function") {
            if (data !== undefined) {
                func.call(eventListener, data);
            } else {
                func.call(eventListener);
            }
        } else {
            if ( type === EVENT_LOG) {
                console.log("Warning : object type " + ((<any> eventListener).className || "unknown")
                    + " does not implement handler " + funcName + " for event " + type);
            } else {
                logger.warn("Warning : object type " + ((<any> eventListener).className || "unknown")
                    + " does not implement handler " + funcName + " for event " + type);
            }
        }
    }

    public static eventTypeToCallback(eventType: string): string {
        return "on" + Core.toCamelCase(eventType);
    }

    private static listeners: {[index: string]: IEventListener[]} = {};

    /**
     * Function: addListener
     * add a listener, sorted by descending node.zOrder, listeners without node first
     * Parameters:
     * listener - the listener to register
     * listenerArray - the listener array to update
     */
    private static addListener<T extends IEventListener>(listener: T, listenerArray: T[]) {
        let index = 0;
        if (listener.node) {
            let len = listenerArray.length;
            do {
                let listenerNode: Node.Node|undefined  = listenerArray[index].node;
                if ( listenerNode && listenerNode.getZOrder() <= listener.node.getZOrder()) {
                    break;
                }
                index ++;
            } while (index < len);
        }
        listenerArray.splice(index - 1, 0, listener);
    }
}
