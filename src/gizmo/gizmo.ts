/// <reference path="../core/core.ts" />
/// <reference path="../umbra/umbra.ts" />
/// <reference path="widget.ts" />
/// <reference path="commands.ts" />

/**
	Section: gizmo.ts
*/
module Gizmo {
    "use strict";

    export enum EventType {
        // events sent by Gizmo
        // a modal dialog is displayed. game should stop processing input. Associated data : the widget
        MODAL_SHOW,
        // a modal dialog was hidden. game can resume input processing. Associated data : the widget
        MODAL_HIDE,
    }
    
    /**
        Interface: InputConfiguration
        Defines what virtual buttons are used in the widgets
    */
    export interface Configuration {
        input: {
            // TODO : these are not handled yet
            /**
                Field: focusNextWidgetAxisName
                Button to switch focus to the next widget (like TAB in a web form)
            */
            focusNextWidgetAxisName: string,
            /**
                Field: focusPreviousWidgetAxisName
                Button to switch focus to the previous widget (like Shift-TAB in a web form)
            */
            focusPreviousWidgetAxisName: string,
            /**
                Field: validateAxisName
                Button to validate the widget in focus (like ENTER in a web form)
            */
            validateAxisName: string,
            /**
                Field: cancelAxisName
                Button to cancel current modal dialog
            */
            cancelAxisName: string,
        },
        color: {
            background: Core.Color,
            backgroundActive: Core.Color,
            backgroundDisabled: Core.Color,
            foreground: Core.Color,
            foregroundActive: Core.Color,
            foregroundDisabled: Core.Color,
            titleForeground: Core.Color,            
        }
    }
    
    let config: Configuration;
    
    export function setConfiguration(conf: Configuration) {
        config = conf;
    }
    
    export function getConfiguration(): Configuration {
        return config;
    }
    
    export function initFrame() {
        if ( Umbra.Input.wasMouseMoved()) {
            Widget.setFocus( undefined );
        } 
    }
}
