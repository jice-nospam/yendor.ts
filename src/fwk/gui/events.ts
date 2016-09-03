/**
	Section: gui
*/
export enum EventType {
    // events sent
    // a modal dialog is displayed. game should stop processing input. Associated data : the widget
    MODAL_SHOW,
    // a modal dialog was hidden. game can resume input processing. Associated data : the widget
    MODAL_HIDE,
}

