/**
 * Section: gui
 */
import * as Core from "../core/main";

/**
 * Interface: InputConfiguration
 * Defines what virtual buttons are used in the widgets
 */
export interface IConfiguration {
    input: {
        // TODO : these are not handled yet
        /**
         * Field: focusNextWidgetAxisName
         * Button to switch focus to the next widget (like TAB in a web form)
         */
        focusNextWidgetAxisName: string,
        /**
         * Field: focusPreviousWidgetAxisName
         * Button to switch focus to the previous widget (like Shift-TAB in a web form)
         */
        focusPreviousWidgetAxisName: string,
        /**
         * Field: validateAxisName
         * Button to validate the widget in focus (like ENTER in a web form)
         */
        validateAxisName: string,
        /**
         * Field: cancelAxisName
         * Button to cancel current modal dialog
         */
        cancelAxisName: string,
    };
    color: {
        background: Core.Color,
        backgroundActive: Core.Color,
        backgroundDisabled: Core.Color,
        foreground: Core.Color,
        foregroundActive: Core.Color,
        foregroundDisabled: Core.Color,
        titleForeground: Core.Color,
    };
}

let config: IConfiguration;

export function setConfiguration(conf: IConfiguration) {
    config = conf;
}

export function getConfiguration(): IConfiguration {
    return config;
}
