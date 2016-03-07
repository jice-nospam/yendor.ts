/*
	Section: Widgets
*/
module Gizmo {
    "use strict";

    export abstract class Widget extends Umbra.Node implements Umbra.EventListener {
        enableEvents: boolean = true;
		/*
			Property: activeModal
			There can only be one active modal at a time. Showing a modal widget hides the previous modal widget.
		*/
        private static activeModal: Widget;
        /*
            Property: focus
            The widget that currently has focus
        */
        private static focus: Widget;
        private modal: boolean = false;

        constructor() {
            super();
            this.setZOrder(1);
        }

        static getActiveModal(): Widget { return Widget.activeModal; }
        isModal() { return this.modal; }
        protected setModal() { this.modal = true; }
        
        isFocus() {
            return this === Widget.focus;
        }
        
        static setFocus(w: Widget) {
            Widget.focus = w;
        }

        show() {
            if (this.modal) {
                if (Widget.activeModal) {
                    Widget.activeModal.hide();
                }
                Widget.activeModal = this;
                Umbra.EventManager.publishEvent(EventType[EventType.MODAL_SHOW], this);
            }
            super.show();
        }
        hide() {
            if (this.modal) {
                Widget.activeModal = undefined;
                Umbra.EventManager.publishEvent(EventType[EventType.MODAL_HIDE], this);
            }
            super.hide();
        }
        
        /*
            Function: showOnEventType
            Automatically show this widget when an event is published
        */
        protected showOnEventType(eventType: string, callback?: (data:any)=>void) {
            Umbra.EventManager.registerEventListener(this, eventType);
            this[Umbra.EventManager.eventTypeToCallback(eventType)] = function(data: any) {
                this.show();
                if ( callback ) {
                    callback(data);
                }
            }.bind(this);
        }
    }

	/*
		Class: ConsoleWidget
		A widget that uses an offscreen console to store its content. Widgets should extend this class and render stuff on __console before calling super.onRender.
	*/
    export abstract class ConsoleWidget extends Widget {
        private __console: Yendor.Console;
        private absolutePos: Core.Position;

        constructor(width: number, height: number) {
            super();
            this.boundingBox = new Core.Rect(0, 0, width, height);
            this.__console = new Yendor.Console(width, height);
            this.absolutePos = new Core.Position();
        }
        
        protected get console() {
            return this.__console;
        }
            
        resize(w: number, h: number) {
            super.resize(w,h);
            this.__console = new Yendor.Console(w, h);
        }

        onRender(con: Yendor.Console) {
            this.absolutePos.x = 0;
            this.absolutePos.y = 0;
            this.computeAbsoluteCoordinates(this.absolutePos);
            this.__console.blit(con, this.absolutePos.x, this.absolutePos.y);
        }
    }
}
