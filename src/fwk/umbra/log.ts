import * as Yendor from "../yendor/main";
import {EventType, EventListener, EventManager} from "./events";
import {URL_PARAM_DEBUG} from "./constants";

export enum LogLevel {
    DEBUG,
    INFO,
    WARN,
    ERROR,
    CRITICAL
}

export interface LogEvent {
    level: LogLevel;
    text: string;
}

export abstract class AbstractLogger {
    abstract log(level: LogLevel, text: string): void;
    debug(text: string) {
        if (this.isDebugEnabled()) {
            this.log(LogLevel.DEBUG, text);
        }
    }
    info(text: string) {
        this.log(LogLevel.INFO, text);
    }
    warn(text: string) {
        this.log(LogLevel.WARN, text);
    }
    error(text: string) {
        this.log(LogLevel.ERROR, text);
    }
    critical(text: string) {
        this.log(LogLevel.CRITICAL, text);
    }
    isDebugEnabled() {
        return Yendor.urlParams[ URL_PARAM_DEBUG ] !== undefined;
    }
}

export class EventLogger extends AbstractLogger {
    log(level: LogLevel, text: string) {
        EventManager.publishEvent(EventType[EventType.LOG], {level: level, text: text});
    }
}

export class JSConsoleLogger implements EventListener {
    enableEvents: boolean = true;
    private static colors: string[] = ["#CCCCCC", "#000000", "#FFDD66", "#FF3333", "#FF0000"];
    onLog(event: LogEvent) {
        console.log("%c" + event.text, "color:" + JSConsoleLogger.colors[ event.level ]);
    }
}