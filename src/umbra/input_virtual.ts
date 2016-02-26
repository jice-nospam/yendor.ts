/*
	Section: Virtual axes and buttons
*/
module Umbra {
    "use strict";

    export module Input {
        export type ButtonDef = string | number | MouseButton;
        export interface AxisDef {
            name: string;
            positiveDescription?: string;
            negativeDescription?: string;
            /*
                Field:positiveButton
                The button used to push the axis in the positive direction.
            */
            positiveButton: ButtonDef;
            /*
                Field:negativeButton
                The button used to push the axis in the negative direction.
            */
            negativeButton?: ButtonDef;
            /*
                Field: altPositiveButton
                Alternative button used to push the axis in the positive direction.
            */
            altPositiveButton?: ButtonDef;
            /*
                Field: altNegativeButton
                Alternative button used to push the axis in the negative direction.
            */
            altNegativeButton?: ButtonDef;
            /*
                Field: gravity
                Speed in units per second that the axis falls toward neutral when no buttons are pressed.
            */
            gravity?: number;
            /*
                Field: deadZone
                Size of the analog dead zone. All analog device values within this range result map to neutral.
            */
            deadZone?: number;
            /*
                Field: sensitivity
                Speed in units per second that the the axis will move toward the target value. This is for digital devices only.
            */
            sensitivity?: number;
            /*
                Field: snap
                If enabled, the axis value will reset to zero when pressing a button of the opposite direction.
            */
            snap?: boolean;
            /*
                Field: invert
                If enabled, the Negative Buttons provide a positive value, and vice-versa.
            */
            invert?: boolean;
            /*
                Field: type
                The type of inputs that will control this axis.
            */
            type: AxisType;
        }

        interface AxisData extends AxisDef {
            value: number;
            rawValue: number;
            pressed?: boolean;
            released?: boolean;
        }

        var axesMap: { [name: string]: AxisData; } = {};

        /*
            Field: keyCodeToAxis
            Maps key codes to corresponding axis
        */
        var keyCodeToAxis: { [keyCode: number]: AxisData } = {};
        /*
            Field: asciiCodeToAxis
            Maps an ascii code to corresponding axis
        */
        var asciiCodeToAxis: { [asciiCode: number]: AxisData } = {};
        /*
            Field: mouseButtonToAxis
            Maps mouse buttons (map key = MouseButton) to corresponding axis
        */
        var mouseButtonToAxis: { [mouseButton: number]: AxisData } = {};

        var lastAxisName: string;
        /*
            Function: registerAxes
            Register an array of axis or virtual button.
        */
        export function registerAxes(data: AxisDef[]) {
            for (var i: number = 0, len: number = data.length; i < len; ++i) {
                registerAxis(data[i]);
            }
        }

        export function getLastAxisName(): string {
            return lastAxisName;
        }

        export function updateMouseButtonAxes(button: MouseButton, pressed: boolean) {
            var val = pressed ? 1 : 0;
            var axis = mouseButtonToAxis[button];
            if (axis) {
                axis.rawValue = val;
                axis.pressed = pressed;
                axis.released = !pressed;
                if (pressed) {
                    lastAxisName = axis.name;
                }
            }
        }

        export function updateKeyCodeAxes(keyCode: number, pressed: boolean) {
            var val = pressed ? 1 : 0;
            var axis = keyCodeToAxis[keyCode];
            if (axis) {
                axis.rawValue = val;
                axis.pressed = pressed;
                axis.released = !pressed;
                if (pressed) {
                    lastAxisName = axis.name;
                }
            }
        }

        export function updateAsciiCodeAxes(asciiCode: MouseButton) {
            var axis = asciiCodeToAxis[asciiCode];
            if (axis) {
                axis.rawValue = 1;
                axis.pressed = true;
                axis.released = false;
                lastAxisName = axis.name;
            }
        }

        export function resetAxes() {
            for (var name in axesMap) {
                if (axesMap[name].pressed) {
                    axesMap[name].pressed = false;
                }
                if (axesMap[name].released) {
                    axesMap[name].released = false;
                }
            }
            // no keyreleased event for a keypress event. autorelease every frame
            for (var asciiCode in asciiCodeToAxis) {
                asciiCodeToAxis[asciiCode].rawValue = 0;
            }
            lastAxisName = undefined;
        }

        function registerButtonHandler(buttonDef: ButtonDef, data: AxisData) {
            if (typeof buttonDef === "string") {
                console.log("   Umbra.Input : ascii button " + buttonDef);
                asciiCodeToAxis[buttonDef.charCodeAt(0)] = data;
            } else if (typeof buttonDef === "MouseButton") {
                console.log("   Umbra.Input : mouse button " + buttonDef);
                mouseButtonToAxis[buttonDef] = data;
            } else {
                console.log("   Umbra.Input : key button " + buttonDef);
                keyCodeToAxis[buttonDef] = data;
            }
        }

        /*
            Function: registerAxis
            Register a new axis or virtual button.
        */
        export function registerAxis(def: AxisDef) {
            var data: AxisData = {
                altNegativeButton: def.altNegativeButton,
                altPositiveButton: def.altPositiveButton,
                deadZone: def.deadZone,
                gravity: def.gravity,
                invert: def.invert,
                name: def.name,
                negativeButton: def.negativeButton,
                negativeDescription: def.negativeDescription,
                positiveButton: def.positiveButton,
                positiveDescription: def.positiveDescription,
                sensitivity: def.sensitivity,
                snap: def.snap,
                type: def.type,
                value: 0,
                rawValue: 0
            };
            axesMap[data.name] = data;
            console.log("Umbra.Input : new axis " + data.name + " type " + data.type);
            if (data.altNegativeButton) {
                registerButtonHandler(data.altNegativeButton, data);
            }
            if (data.altPositiveButton) {
                registerButtonHandler(data.altPositiveButton, data);
            }
            if (data.positiveButton) {
                registerButtonHandler(data.positiveButton, data);
            }
            if (data.negativeButton) {
                registerButtonHandler(data.negativeButton, data);
            }
        }
        /*
            Function: getAxis
            Return the value of a virtual axis. In the range -1..1
            
            Parameter:
            name - the axis name
        */
        export function getAxis(name: string): number {
            return axesMap[name] ? axesMap[name].value : undefined;
        }
        /*
            Function: getAxisRaw
            Return the value of a virtual axis with no smoothing filtering applied. In the range -1..1

            Parameter:
            name - the axis name
        */
        export function getAxisRaw(name: string): number {
            return axesMap[name] ? axesMap[name].rawValue : undefined;
        }
        /*
            Function: isButtonDown
            Whether a virtual button is currently pressed
            
            Parameter:
            name - the KEY_OR_BUTTON axis name
        */
        export function isButtonDown(name: string): boolean {
            return axesMap[name] ? axesMap[name].value > 0 : undefined;
        }
        /*
            Function: wasButtonPressed
            Whether a virtual button was pressed during this frame
            
            Parameter:
            name - the KEY_OR_BUTTON axis name
        */
        export function wasButtonPressed(name: string): boolean {
            return axesMap[name] ? !!axesMap[name].pressed : undefined;
        }
        /*
            Function: wasButtonReleased
            Whether a virtual button was released during this frame
            
            Parameter:
            name - the KEY_OR_BUTTON axis name
        */
        export function wasButtonReleased(name: string): boolean {
            return axesMap[name] ? !!axesMap[name].released : undefined;
        }
    }
}
