/*
	Section: Widgets
*/
module Gizmo {
    "use strict";

    export abstract class Widget extends Umbra.Node {
		/*
			Property: activeModal
			There can only be one active modal at a time. Showing a modal widget hides the previous modal widget.
		*/
        private static activeModal: Widget;
        private modal: boolean = false;

        static getActiveModal(): Widget { return Widget.activeModal; }
        isModal() { return this.modal; }
        protected setModal() { this.modal = true; }

        show() {
            if (this.modal) {
                if (Widget.activeModal) {
                    Widget.activeModal.hide();
                }
                Widget.activeModal = this;
            }
            super.show();
        }
        hide() {
            if (this.modal) {
                Widget.activeModal = undefined;
            }
            super.hide();
        }
    }

	/*
		Class: ConsoleWidget
		A widget that uses an offscreen console to store its content
	*/
    export abstract class ConsoleWidget extends Widget {
        protected __console: Yendor.Console;
        private absolutePos: Core.Position;

        constructor(_width: number, _height: number) {
            super();
            this.boundingBox = new Core.Rect(0, 0, _width, _height);
            this.__console = new Yendor.Console(_width, _height);
        }

        onRender(con: Yendor.Console) {
            this.computeAbsoluteCoordinates(this.absolutePos);
            this.__console.blit(con, this.absolutePos.x, this.absolutePos.y);
        }
    }
}
