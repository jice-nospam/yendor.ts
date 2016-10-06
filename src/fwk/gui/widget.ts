/**
 * Section: Widgets
 */
import * as Core from "../core/main";
import * as Yendor from "../yendor/main";
import * as Umbra from "../umbra/main";
import {EventType} from "./events";
import {frame, hline, vline, checkPos} from "./commands";
import {getConfiguration} from "./configuration";

export enum TextAlignEnum {
    LEFT = 1,
    RIGHT,
    CENTER
}

/**
 * zOrder for widget while being dragged
 */
export const DRAG_Z_ORDER = 1000;
export const SLIDER_DEFAULT_WIDTH = 10;

export class Widget extends Umbra.Node implements Umbra.IEventListener {
    public static getActiveModal(): Widget|undefined { return Widget.activeModal; }

    /**
     * Property: activeModal
     * There can only be one active modal at a time. Showing a modal widget hides the previous modal widget.
     */
    private static activeModal: Widget|undefined;
    private static modalStack: Widget[] = [];

    public enableEvents: boolean = true;
    private modal: boolean = false;
    private showEventType: string;

    constructor() {
        super();
        this.setZOrder(1);
    }

    public isModal() { return this.modal; }

    public show() {
        if (this.modal) {
            if (Widget.activeModal) {
                Widget.modalStack.push(Widget.activeModal);
            }
            Widget.activeModal = this;
            Umbra.EventManager.publishEvent(EventType[EventType.MODAL_SHOW], this);
        }
        super.show();
    }

    public hide() {
        if (this.modal) {
            Widget.activeModal = Widget.modalStack.pop();
            Umbra.EventManager.publishEvent(EventType[EventType.MODAL_HIDE], this);
        }
        super.hide();
    }

    public onTerm() {
        super.onTerm();
        if (this.showEventType) {
            Umbra.EventManager.unregisterEventListener(this, this.showEventType);
        }
    }

    /**
     * Function: showOnEventType
     * Automatically show this widget when an event is published
     */
    protected showOnEventType(eventType: string, callback?: (data: any) => void) {
        Umbra.EventManager.registerEventListener(this, eventType);
        this.showEventType = eventType;
        (<any> this)[Umbra.EventManager.eventTypeToCallback(eventType)] = function(data: any) {
            this.show();
            if ( callback ) {
                callback(data);
            }
        }.bind(this);
    }

    protected setModal() { this.modal = true; }
}

/**
 * Class: ConsoleWidget
 * A widget that uses an offscreen console to store its content. Widgets should extend
 * this class and render stuff on __console before calling super.onRender.
 */
export abstract class ConsoleWidget extends Widget {
    private __console: Yendor.Console;

    constructor() {
        super();
    }

    public init(width: number, height: number) {
        this.boundingBox = new Core.Rect(0, 0, width, height);
        this.__console = new Yendor.Console(width, height);
    }

    protected get console() {
        return this.__console;
    }

    public resize(w: number, h: number) {
        super.resize(w, h);
        this.__console = new Yendor.Console(w, h);
    }

    public onRender(con: Yendor.Console) {
        let absolutePos: Core.Position = new Core.Position();
        this.local2Abs(absolutePos);
        this.__console.blit(con, absolutePos.x, absolutePos.y);
    }
}

export interface IWidgetOption {
    expand?: Umbra.ExpandEnum;
    minWidth?: number;
    minHeight?: number;
}

export interface ILabelOption extends IWidgetOption {
    /**  text displayed on the button */
    label: string;
    /** How should the text be aligned */
    textAlign?: TextAlignEnum;
    /** optional custom rendering */
    postRender?: (con: Yendor.Console, x: number, y: number, options: IButtonOption, active: boolean) => void;
}

export interface IButtonOption extends ILabelOption {
    /** optional widget to hide when the button is clicked */
    autoHideWidget?: Widget;
    /** optional data to send with the event when the button is clicked */
    eventData?: any;
    /** optional event type sent when this button is clicked */
    eventType?: string;
    /**
     * Field: callback
     * optional callback called when this button is clicked. The data parameter will have the eventData value.
     * returns: true if the action succeeded
     */
    callback?: (data: any) => boolean;
    /** optional ascii code to trigger the button action with a keypress */
    asciiShortcut?: number;
}

export interface ISliderOption extends IWidgetOption {
    minValue: number;
    maxValue: number;
}

export interface IPanelOption extends IWidgetOption {
    wPadding?: number;
    hPadding?: number;
}

export interface IFrameOption extends IPanelOption {
    title?: string;
    footer?: string;
}

export interface IPopupOption extends IPanelOption {
    cancelAction?: () => boolean;
}

export interface IDragOption extends IWidgetOption {
    handle?: Core.Rect;
    data?: any;
    minDragX?: number;
    maxDragX?: number;
    minDragY?: number;
    maxDragY?: number;
    startDragCallback?: (dropped: Draggable, data: any) => void;
    endDragCallback?: (dropped: Draggable, data: any) => void;
}

export interface IDropOption extends IDragOption {
    dropCallback?: (dropped: Draggable, target: DragTarget, data: any) => void;
}

export class VSeparator extends Widget {
    constructor() {
        super();
        this.boundingBox.w = 1;
    }

    public onRender(con: Yendor.Console) {
        let pos: Core.Position = new Core.Position(this.boundingBox.x, 0);
        (<Widget> this.__parent).local2Abs(pos);
        let parentBox: Core.Rect|undefined = this.getParentBoundingBox();
        let h: number = parentBox ? parentBox.h : 0;
        con.clearBack(getConfiguration().color.background, pos.x, pos.y, 1, h);
        con.clearFore(getConfiguration().color.foregroundDisabled, pos.x, pos.y, 1, h);
        vline(con, pos.x, pos.y, h, true);
        if ( pos.y > 0 && con.text[pos.x][pos.y - 1] === Yendor.CHAR_HLINE ) {
            con.text[pos.x][pos.y - 1] = Yendor.CHAR_TEES;
        }
        if ( pos.y + h < Umbra.application.getConsole().height - 1
            && con.text[pos.x][pos.y + h] === Yendor.CHAR_HLINE ) {
            con.text[pos.x][pos.y + h] = Yendor.CHAR_TEEN;
        }
    }

    public computeBoundingBox() {
        this.boundingBox.w = 1;
        this.boundingBox.h = 0;
    }
}

export class HSeparator extends Widget {
    constructor(public label?: string) {
        super();
        this.boundingBox.h = 1;
    }

    public onRender(con: Yendor.Console) {
        let pos: Core.Position = new Core.Position(0, this.boundingBox.y);
        (<Widget> this.__parent).local2Abs(pos);
        let parentBox: Core.Rect|undefined = this.getParentBoundingBox();
        let w: number = parentBox ? parentBox.w : 0;
        con.clearBack(getConfiguration().color.background, pos.x, pos.y, w, 1);
        con.clearFore(getConfiguration().color.foregroundDisabled, pos.x, pos.y, w, 1);
        hline(con, pos.x, pos.y, w, true);
        if ( this.label ) {
            let len = this.label.length;
            let xTitle = pos.x + Math.floor((w - len) / 2);
            if ( checkPos(xTitle - 1, pos.y)) {
                con.text[xTitle - 1][pos.y] = Yendor.CHAR_TEEW;
            }
            if ( checkPos(xTitle + len, pos.y)) {
                con.text[xTitle + len][pos.y] = Yendor.CHAR_TEEE;
            }
            con.print(xTitle, pos.y, this.label, getConfiguration().color.titleForeground);
        }
    }

    public computeBoundingBox() {
        this.boundingBox.w = this.label ? this.label.length + 2 : 0;
        this.boundingBox.h = 1;
    }
}

export class OptionWidget<T extends IWidgetOption> extends Widget {
    constructor(protected options: T) {
        super();
        if ( options.expand !== undefined ) {
            this._expand = options.expand;
        }
    }
    public getOptions(): T {
        return this.options;
    }
    public computeBoundingBox() {
        super.computeBoundingBox();
        if ( this.options.minWidth && this.boundingBox.w < this.options.minWidth ) {
            this.boundingBox.w = this.options.minWidth;
        }
        if ( this.options.minHeight && this.boundingBox.h < this.options.minHeight ) {
            this.boundingBox.h = this.options.minHeight;
        }
    }
}

export class Draggable extends OptionWidget<IDragOption> implements Umbra.IEventListener {
    public static isDragging(): boolean {
        return Draggable.drag !== undefined;
    }
    public static resetDrag() {
        Draggable.drag = undefined;
    }

    private static drag: Draggable|undefined;

    static get draggedWidget() { return Draggable.drag; }

    private static startDrag: Core.Position = new Core.Position();
    private static dragPos: Core.Rect = new Core.Rect();
    private static dragPixelPos: Core.Rect = new Core.Rect();
    private static dragZOrder: number;

    constructor(options: IDragOption) {
        super(options);
        if (this._expand === undefined) {
            this._expand = Umbra.ExpandEnum.BOTH;
        }
    }

    public getDragPos(): Core.Position {
        if ( this === Draggable.drag) {
            return Draggable.dragPos;
        }
        return this.boundingBox;
    }

    public getDragPixelPos(): Core.Position|undefined {
        if ( this === Draggable.drag) {
            return Draggable.dragPixelPos;
        }
        return undefined;
    }

    public onInit() {
        super.onInit();
        Umbra.EventManager.registerEventListener(this, Umbra.EVENT_START_DRAG);
        Umbra.EventManager.registerEventListener(this, Umbra.EVENT_CANCEL_DRAG);
        Umbra.EventManager.registerEventListener(this, Umbra.EVENT_END_DRAG);
    }

    public onTerm() {
        Umbra.EventManager.unregisterEventListener(this, Umbra.EVENT_START_DRAG);
        Umbra.EventManager.unregisterEventListener(this, Umbra.EVENT_CANCEL_DRAG);
        Umbra.EventManager.unregisterEventListener(this, Umbra.EVENT_END_DRAG);
        super.onTerm();
    }

    public onStartDrag(_event: Umbra.IDragEvent) {
        if ( this.isVisible() && this.containsAbsolute(Umbra.getMouseCellPosition())) {
            Draggable.drag = this;
            Draggable.dragZOrder = this.getZOrder();
            Draggable.startDrag.set(Umbra.getMouseCellPosition());
            Draggable.dragPos.set(this.boundingBox);
            this.setZOrder(DRAG_Z_ORDER);
            Umbra.resetInput();
            let callback: ((dropped: Draggable, data: any) => void)|undefined = this.getOptions().startDragCallback;
            if ( callback ) {
                callback(this, this.getOptions().data);
            }
        }
    }

    public onEndDrag(_event: Umbra.IDragEvent) {
        if (this === Draggable.drag) {
            Umbra.resetInput();
            let callback: ((dropped: Draggable, data: any) => void)|undefined = this.getOptions().endDragCallback;
            if ( callback ) {
                callback(this, this.getOptions().data);
            }
            this.onCancelDrag(_event);
            Umbra.EventManager.publishEvent(Umbra.EVENT_DROP, this);
        }
    }

    public onCancelDrag(_event: Umbra.IDragEvent) {
        if (this === Draggable.drag) {
            this.setZOrder(Draggable.dragZOrder);
            Draggable.drag = undefined;
        }
    }

    public onPreRender() {
        this.swapDragAndBox();
    }

    public onPostRender() {
        this.swapDragAndBox();
    }

    public onUpdate(_time: number) {
        if ( Draggable.drag === this ) {
            let mousePos: Core.Position = Umbra.getMouseCellPosition().clone();
            Draggable.dragPos.x = mousePos.x + this.boundingBox.x - Draggable.startDrag.x;
            Draggable.dragPos.y = mousePos.y + this.boundingBox.y - Draggable.startDrag.y;
            let maxw: number = Umbra.application.getConsole().width - this.boundingBox.w;
            let maxh: number = Umbra.application.getConsole().height - this.boundingBox.h;
            let fatherPos = new Core.Position(-this.boundingBox.x, -this.boundingBox.y);
            this.local2Abs(fatherPos);
            Draggable.dragPos.x = Core.clamp(Draggable.dragPos.x, -fatherPos.x, maxw - fatherPos.x);
            Draggable.dragPos.y = Core.clamp(Draggable.dragPos.y, -fatherPos.y, maxh - fatherPos.y);
            if ( this.options.minDragX !== undefined && Draggable.dragPos.x < this.options.minDragX ) {
                Draggable.dragPos.x = this.options.minDragX;
            } else if ( this.options.maxDragX !== undefined && Draggable.dragPos.x > this.options.maxDragX ) {
                Draggable.dragPos.x = this.options.maxDragX;
            }
            if ( this.options.minDragY !== undefined && Draggable.dragPos.y < this.options.minDragY ) {
                Draggable.dragPos.y = this.options.minDragY;
            } else if ( this.options.maxDragY !== undefined && Draggable.dragPos.y > this.options.maxDragY ) {
                Draggable.dragPos.y = this.options.maxDragY;
            }
            let mousePixelPos: Core.Position = Umbra.getMousePixelPosition();
            Draggable.dragPixelPos.x = mousePixelPos.x;
            Draggable.dragPixelPos.y = mousePixelPos.y;
        }
    }

    private swapDragAndBox() {
        if ( Draggable.drag === this ) {
            let tmp: Core.Rect = this.boundingBox;
            this.boundingBox = Draggable.dragPos;
            Draggable.dragPos = tmp;
        }
    }
}

export class DragTarget extends OptionWidget<IDropOption> implements Umbra.IEventListener {
    constructor(options: IDropOption) {
        super(options);
        if (this._expand === undefined) {
            this._expand = Umbra.ExpandEnum.BOTH;
        }
    }

    public onInit() {
        super.onInit();
        Umbra.EventManager.registerEventListener(this, Umbra.EVENT_DROP);
    }

    public onTerm() {
        Umbra.EventManager.unregisterEventListener(this, Umbra.EVENT_DROP);
        super.onTerm();
    }

    public onDrop(draggable: Draggable) {
        if (this.isVisible() && !this.contains(draggable) && this.containsAbsolute(Umbra.getMouseCellPosition())) {
            if ( this.options.dropCallback) {
                this.options.dropCallback(draggable, this, this.options.data);
            }
        }
    }
}

export class Label<T extends ILabelOption> extends OptionWidget<T> {
    constructor(options: T) {
        super(options);
        if ( this._expand === undefined ) {
            this._expand = Umbra.ExpandEnum.HORIZONTAL;
        }
    }

    public toString() {
        return this.constructor.name + "(" + this.options.label + "):" + this.boundingBox.toString();
    }

    public onRender(con: Yendor.Console) {
        let pos: Core.Position = new Core.Position(this.boundingBox.x, this.boundingBox.y);
        (<Widget> this.__parent).local2Abs(pos);
        this.renderWithColor(con, pos, getConfiguration().color.foregroundDisabled,
            getConfiguration().color.background);
        if ( this.options.postRender ) {
            this.options.postRender(con, pos.x, pos.y, this.options, false);
        }
    }

    public computeBoundingBox() {
        this.boundingBox.w = this.options.label.length;
        this.boundingBox.h = 1;
    }

    protected renderWithColor(con: Yendor.Console, pos: Core.Position, fore: Core.Color, back: Core.Color) {
        con.clearBack(back, pos.x, pos.y, this.boundingBox.w, this.boundingBox.h);
        con.clearText(32, pos.x, pos.y, this.boundingBox.w, this.boundingBox.h);
        let xpad: number = 0;
        switch (this.options.textAlign) {
            case TextAlignEnum.RIGHT :
                xpad = this.boundingBox.w - this.options.label.length;
                break;
            case TextAlignEnum.CENTER :
                xpad = Math.floor((this.boundingBox.w - this.options.label.length) / 2);
                break;
            default: break;
        }
        con.print(pos.x + xpad, pos.y, this.options.label, fore);
    }
}

export class Button extends Label<IButtonOption> {
    private active: boolean;
    private pressed: boolean;
    constructor(options: IButtonOption) {
        super(options);
    }

    public onRender(con: Yendor.Console) {
        let pos: Core.Position = new Core.Position(this.boundingBox.x, this.boundingBox.y);
        (<Widget> this.__parent).local2Abs(pos);
        this.active = this.containsAbsolute(Umbra.getMouseCellPosition());
        this.renderWithColor(con, pos,
            this.active ? getConfiguration().color.foregroundActive : getConfiguration().color.foreground,
            this.active ? getConfiguration().color.backgroundActive : getConfiguration().color.background,
        );
        if ( this.options.postRender ) {
            this.options.postRender(con, pos.x, pos.y, this.options, this.active);
        }
    }

    public onUpdate(_time: number) {
        this.active = this.containsAbsolute(Umbra.getMouseCellPosition());

        this.pressed = this.active && Umbra.wasMouseButtonReleased(Umbra.MouseButtonEnum.LEFT);
        if (this.pressed || (this.options.asciiShortcut && Umbra.wasCharPressed(this.options.asciiShortcut))) {
            Umbra.resetInput();
            let success: boolean = true;
            if (this.options.callback) {
                success = this.options.callback(this.options.eventData);
            }
            if (success) {
                if (this.options.autoHideWidget) {
                    this.options.autoHideWidget.hide();
                }
                if (this.options.eventType) {
                    Umbra.EventManager.publishEvent(this.options.eventType,
                        this.options ? this.options.eventData : undefined);
                }
            }
        }
    }
}

export class Slider extends OptionWidget<ISliderOption> {
    private dragButton: Button;
    private draggable: Draggable;
    private value: number;
    constructor(options: ISliderOption) {
        super(options);
        if ( options.minWidth === undefined ) {
            this.options.minWidth = SLIDER_DEFAULT_WIDTH;
        }
        this.options.minHeight = 1;
    }

    public getValue(): number {
        return this.value;
    }

    public setValue(value: number) {
        this.value = value;
        this.value = Core.clamp(this.value, this.options.minValue, this.options.maxValue);
        let dragPosX: number = Math.floor((this.boundingBox.w - 1 ) *
            (this.value - this.options.minValue) / (this.options.maxValue - this.options.minValue));
        this.draggable.moveTo(dragPosX, this.draggable.getBoundingBox().y);
        this.setSliderCharacter();
    }

    public onInit() {
        this.dragButton = new Button({expand: Umbra.ExpandEnum.NONE, label: String.fromCharCode(Yendor.CHAR_TEEE)});
        this.draggable = new Draggable({
            endDragCallback: this.endDragCallback.bind(this),
            maxDragX: this.options.minWidth - 1,
            maxDragY: 0,
            minDragX: 0,
            minDragY: 0,
        });
        this.addChild(this.draggable).addChild(this.dragButton);
        this.value = this.options.minValue;
    }

    public onRender(con: Yendor.Console) {
        let pos: Core.Position = new Core.Position(this.boundingBox.x, this.boundingBox.y);
        (<Widget> this.__parent).local2Abs(pos);
        con.clearText(0, pos.x, pos.y, this.boundingBox.w, 1);
        hline(con, pos.x, pos.y, this.boundingBox.w);
    }

    public onUpdate(_time: number) {
        if ( Draggable.draggedWidget === this.draggable ) {
            let pos: Core.Position = new Core.Position(this.boundingBox.x, this.boundingBox.y);
            (<Widget> this.__parent).local2Abs(pos);
            let maxPos: Core.Position = Umbra.application.getConsole()
                .getPixelPositionFromCell(pos.x + this.boundingBox.w, pos.y)!;
            let minPos: Core.Position = Umbra.application.getConsole()
                .getPixelPositionFromCell(pos.x, pos.y)!;
            let pixelPos: Core.Position = this.draggable.getDragPixelPos()!;
            this.setSliderCharacter();
            this.value = this.options.minValue + (this.options.maxValue + 1 - this.options.minValue)
                * (pixelPos.x - minPos.x) / (maxPos.x - minPos.x);
            this.value = Core.clamp(this.value, this.options.minValue, this.options.maxValue);
        }
    }

    private setSliderCharacter() {
        if ( this.draggable.getDragPos() .x === 0 ) {
            this.dragButton.getOptions().label = String.fromCharCode(Yendor.CHAR_TEEE);
        } else if ( this.draggable.getDragPos().x === this.boundingBox.w - 1 ) {
            this.dragButton.getOptions().label = String.fromCharCode(Yendor.CHAR_TEEW);
        } else {
            this.dragButton.getOptions().label = String.fromCharCode(Yendor.CHAR_CROSS);
        }
    }

    private endDragCallback(dropped: Draggable, _data: any) {
        dropped.moveTo(dropped.getDragPos());
    }
}

export class PaddedPanel extends OptionWidget<IPanelOption> {
    constructor(options: IPanelOption) {
        super(options);
        if (options.hPadding === undefined) {
            this.options.hPadding = 0;
        }
        if (options.wPadding === undefined) {
            this.options.wPadding = 0;
        }
    }

    public computeBoundingBox() {
        super.computeBoundingBox();
        this.boundingBox.h += this.options.hPadding;
        this.boundingBox.w += this.options.wPadding;
    }

    public addChild<T extends Umbra.Node>(node: T): T {
        let ret = super.addChild(node);
        node.moveTo(this.options.wPadding || 0, this.options.hPadding || 0);
        return ret;
    }

    protected expandChildren(w: number, h: number) {
        for (let child of this.children) {
            (<Widget> child).expand(w - this.options.wPadding * 2, h - this.options.hPadding * 2);
        }
    }
}

export class Frame extends PaddedPanel {
    constructor(options: IFrameOption) {
        super(options);
        if (this.options.hPadding < 1) {
            this.options.hPadding = 1;
        }
        if (this.options.wPadding < 1) {
            this.options.wPadding = 1;
        }
        if ( this.options.minHeight === undefined ) {
            this.options.minHeight = 1;
        }
    }

    public onRender(console: Yendor.Console) {
        let pos: Core.Position = new Core.Position();
        this.local2Abs(pos);
        let options: IFrameOption = <IFrameOption> this.options;
        frame(console, pos.x, pos.y, this.boundingBox.w, this.boundingBox.h, options.title);
        if (options.footer) {
            console.print(Math.floor(pos.x + (this.boundingBox.w - options.footer.length) / 2),
                pos.y + this.boundingBox.h - 1, options.footer);
        }
    }

    public computeBoundingBox() {
        super.computeBoundingBox();
        let options: IFrameOption = <IFrameOption> this.options;
        let titlew = options.title ? options.title.length : 0;
        this.boundingBox.w = Math.max(titlew + 4, this.boundingBox.w);
        let footerw = options.footer ? options.footer.length : 0;
        this.boundingBox.w = Math.max(footerw + 2, this.boundingBox.w);
    }
}

export class Popup extends PaddedPanel {
    constructor(options: IPopupOption) {
        super(options);
        if ( this._expand === undefined ) {
            this._expand = Umbra.ExpandEnum.BOTH;
        }
    }

    public onUpdate(_time: number) {
        let cancelAction: (() => boolean)|undefined;
        if (this.options) {
            cancelAction = (<IPopupOption> this.options).cancelAction;
        }
        if (Umbra.wasButtonPressed(getConfiguration().input.cancelAxisName)) {
            if ( !cancelAction || cancelAction()) {
                (<Widget> this.__parent).hide();
            }
            Umbra.resetInput();
        }
    }
}

export class VPanel extends PaddedPanel {
    constructor(options: IPanelOption) {
        super(options);
        if ( this._expand === undefined ) {
            this._expand = Umbra.ExpandEnum.HORIZONTAL;
        }
    }

    public computeBoundingBox() {
        super.computeBoundingBox();
        let y: number = this.options.hPadding || 0;
        for (let child of this.children) {
            (<Widget> child).moveTo(this.options.wPadding || 0, y);
            if ((<Widget> child).getVisibleFlag()) {
                y += (<Widget> child).getBoundingBox().h;
            }
        }
        this.boundingBox.h = y + this.options.hPadding;
        if ( this.options.minHeight && this.boundingBox.h < this.options.minHeight ) {
            this.boundingBox.h = this.options.minHeight;
        }
    }

    public addChild<T extends Umbra.Node>(node: T): T {
        let ret = super.addChild(node);
        this.computeBoundingBox();
        return ret;
    }

    protected expandChildren(w: number, _h: number) {
        super.expandChildren(w, 0);
    }
}

export class HPanel extends PaddedPanel {
    constructor(options: IPanelOption) {
        super(options);
        if ( this._expand === undefined ) {
            this._expand = Umbra.ExpandEnum.VERTICAL;
        }
    }

    public computeBoundingBox() {
        super.computeBoundingBox();
        let x: number = this.options.wPadding || 0;
        for (let child of this.children) {
            (<Widget> child).moveTo(x, this.options.hPadding || 0);
            if ((<Widget> child).getVisibleFlag()) {
                x += (<Widget> child).getBoundingBox().w;
            }
        }
        this.boundingBox.w = x + this.options.wPadding;
        if ( this.options.minWidth && this.boundingBox.w < this.options.minWidth ) {
            this.boundingBox.w = this.options.minWidth;
        }
    }

    public addChild<T extends Umbra.Node>(node: T): T {
        let ret = super.addChild(node);
        this.computeBoundingBox();
        return ret;
    }

    protected expandChildren(_w: number, h: number) {
        super.expandChildren(0, h);
    }
}
