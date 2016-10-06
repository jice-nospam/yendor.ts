import * as Yendor from "../yendor/main";
import {IEventListener, EventManager} from "./events";
import {URL_PARAM_DEBUG, EVENT_LOG} from "./constants";

export const enum LogLevel {
    DEBUG = 1,
    INFO,
    WARN,
    ERROR,
    CRITICAL
}

export interface ILogEvent {
    level: LogLevel;
    text: string;
}

export abstract class AbstractLogger {
    public abstract log(level: LogLevel, text: string): void;
    public debug(text: string) {
        if (this.isDebugEnabled()) {
            this.log(LogLevel.DEBUG, text);
        }
    }

    public info(text: string) {
        this.log(LogLevel.INFO, text);
    }

    public warn(text: string) {
        this.log(LogLevel.WARN, text);
    }

    public error(text: string) {
        this.log(LogLevel.ERROR, text);
    }

    public critical(text: string) {
        this.log(LogLevel.CRITICAL, text);
    }

    public isDebugEnabled() {
        return Yendor.urlParams && Yendor.urlParams[ URL_PARAM_DEBUG ] !== undefined;
    }
}

export class EventLogger extends AbstractLogger {
    public log(level: LogLevel, text: string) {
        EventManager.publishEvent(EVENT_LOG, {level: level, text: text});
    }
}

export class JSConsoleLogger implements IEventListener {
    private static colors: string[] = ["#CCCCCC", "#000000", "#FFDD66", "#FF3333", "#FF0000"];
    public enableEvents: boolean = true;
    public onLog(event: ILogEvent) {
        console.log("%c" + event.text, "color:" + JSConsoleLogger.colors[ event.level ]);
    }
}
