/**
 * Section: Scene nodes
 */
import * as Core from "../core/main";
import * as Yendor from "../yendor/main";
import {application} from "./main";

export enum ExpandEnum {
    NONE,
    HORIZONTAL,
    VERTICAL,
    BOTH
}

export class Node extends Core.TreeNode {
    /** bouding box. x,y coordinates relative to parent's top left corner */
    protected boundingBox: Core.Rect = new Core.Rect();
    protected _expand: ExpandEnum;

    private visible: boolean = true;
    private zOrder: number = 0;

    public setExpandFlag(flag: ExpandEnum) {
        this._expand = flag;
    }

    public logSceneGraph(pad: string = "", withStats: boolean = true) {
        if ( withStats ) {
            console.log("##### Umbra node stats :" + this.computeNodeCount(true)
                + " nodes (" + this.computeNodeCount(false) + " visibles) #####");
        }
        console.log(pad + (this.visible ? "" : "*") + this.toString());
        for (let child of this.children) {
            (<Node> child).logSceneGraph(pad + "  ", false);
        }
    }

    public computeNodeCount(includingHidden: boolean = false): number {
        if (! includingHidden && ! this.isVisible() ) {
            return 0;
        }
        let count: number = 1;
        for (let child of this.children) {
            count += (<Node> child).computeNodeCount(includingHidden);
        }
        return count;
    }

    public toString() {
        return this.constructor.name + ":" + this.boundingBox.toString();
    }

    public expand(w: number, h: number) {
        if (! this.visible) {
            return;
        }
        if ( w && w > this.boundingBox.w && (this._expand === ExpandEnum.HORIZONTAL
            || this._expand === ExpandEnum.BOTH)) {
            this.boundingBox.w = w;
        } else {
            w = this.boundingBox.w;
        }
        if ( h && h > this.boundingBox.h && (this._expand === ExpandEnum.VERTICAL
            || this._expand === ExpandEnum.BOTH)) {
            this.boundingBox.h = h;
        } else {
            h = this.boundingBox.h;
        }
        this.expandChildren(w, h);
    }

    public clearChildren() {
        this.termHierarchy();
        super.clearChildren();
    }

    public show() {
        this.visible = true;
    }

    public hide() {
        this.visible = false;
    }

    public getVisibleFlag(): boolean {
        return this.visible;
    }

    public isVisible(): boolean {
        return this.visible && (this.__parent === undefined || (<Node> this.__parent).isVisible());
    }

    public getBoundingBox(): Core.Rect {
        return this.boundingBox;
    }

    public getParentBoundingBox(): Core.Rect|undefined {
        return this.__parent ? (<Node> this.__parent).getBoundingBox() : undefined;
    }

    public moveTo(pos: Core.Position): void;
    public moveTo(x: number, y: number): void;
    public moveTo(x: number | Core.Position, y?: number): void {
        if (typeof x === "number") {
            this.boundingBox.moveTo(x, y ? y : this.boundingBox.y);
        } else {
            let pos: Core.Position = <Core.Position> x;
            this.boundingBox.moveTo(pos.x, pos.y);
        }
    }

    public moveToBottomLeft() {
        let parentBox: Core.Rect|undefined = this.getParentBoundingBox();
        let h: number = parentBox ? parentBox.h : application.getConsole().height;
        this.moveTo(0, h - this.boundingBox.h);
    }

    public moveToTopLeft() {
        this.moveTo(0, 0);
    }

    public moveToBottomRight() {
        let parentBox: Core.Rect|undefined = this.getParentBoundingBox();
        let w: number = parentBox ? parentBox.w : application.getConsole().width;
        let h: number = parentBox ? parentBox.h : application.getConsole().height;
        this.moveTo(w - this.boundingBox.w, h - this.boundingBox.h);
    }

    public moveToTopRight() {
        let parentBox: Core.Rect|undefined = this.getParentBoundingBox();
        let w: number = parentBox ? parentBox.w : application.getConsole().width;
        this.moveTo(w - this.boundingBox.w, 0);
    }

    public resize(w: number, h: number) {
        this.boundingBox.resize(w, h);
    }

    public getZOrder(): number {
        return this.zOrder;
    }

    public setZOrder(value: number) {
        let delta: number = value - this.zOrder;
        this.zOrder = value;
        for (let child of this.children) {
            let nchild: Node = <Node> child;
            nchild.setZOrder(nchild.zOrder + delta);
        }
    }

    /**
     * function: containsAbsolute
     * Whether this node contains the absolute position.
     */
    public containsAbsolute(absolutePos: Core.Position): boolean {
        let node: Node = (<Node> this.__parent);
        let x: number = absolutePos.x;
        let y: number = absolutePos.y;
        while ( node ) {
            x -= node.boundingBox.x;
            y -= node.boundingBox.y;
            node = (<Node> node.__parent);
        }
        return this.boundingBox.contains(x, y);
    }

    public abs2Local(pos: Core.Position) {
        let node: Node = this;
        while ( node ) {
            pos.x -= node.boundingBox.x;
            pos.y -= node.boundingBox.y;
            node = (<Node> node.__parent);
        }
    }

    public local2Abs(pos: Core.Position): void {
        let node: Node = this;
        while ( node ) {
            pos.x += node.boundingBox.x;
            pos.y += node.boundingBox.y;
            node = (<Node> node.__parent);
        }
    }

    public onInit(): void {}
    public onTerm(): void {}
    public onPreRender(): void {}
    public onPostRender(): void {}
    public onRender(_con: Yendor.Console): void {}
    public onUpdate(_time: number): void {}

    /**
     * Function: initHierarchy
     * Init this node, then this node children in ascending zOrder.
     */
    public initHierarchy(): void {
        this.onInit();
        for (let node of this.children) {
            (<Node> node).initHierarchy();
        }
    }

    /**
     * Function: renderHierarchy
     * Render this node, then this node children in ascending zOrder.
     * Parameters:
     * con - the console to render on
     */
    public renderHierarchy(con: Yendor.Console, nodeList?: Node[]): void {
        if (this.visible) {
            // build list of all visible nodes
            let rootNode: boolean = (nodeList === undefined);
            if (! nodeList ) {
                nodeList = [];
            }
            nodeList.push(this);
            for (let child of this.children) {
                (<Node> child).renderHierarchy(con, nodeList);
            }
            if ( rootNode ) {
                // sort by zOrder
                nodeList.sort((a: Node, b: Node) => {
                    return a.zOrder < b.zOrder ? -1 : a.zOrder > b.zOrder ? 1 : 0;
                });
                // render
                for (let node of nodeList) {
                    node.onPreRender();
                }
                for (let node of nodeList) {
                    node.onRender(con);
                }
                for (let node of nodeList) {
                    node.onPostRender();
                }
            }
        }
    }

    /**
     * Function: updateHierarchy
     * Update this node children in descending zOrder, then this node.
     * Parameters:
     * time - current game time
     */
    public updateHierarchy(time: number): void {
        if (this.visible) {
            this.updateChildrenHierarchy(time);
            this.onUpdate(time);
        }
    }

    /**
     * Function: termHierarchy
     * Terminate this node children in descending zOrder, then this node.
     */
    public termHierarchy(): void {
        for (let i: number = this.children.length - 1; i >= 0; --i) {
            let node: Node = <Node> this.children[i];
            node.termHierarchy();
        }
        this.onTerm();
    }

    public addChild<T extends Node>(node: T): T {
        super.addChild(node);
        node.computeBoundingBox();
        return node;
    }

    public removeChild<T extends Node>(node: T): T {
        super.removeChild(node);
        this.computeBoundingBox();
        return node;
    }

    public center() {
        let parentBox: Core.Rect|undefined = this.getParentBoundingBox();
        if (! parentBox ) {
            return;
        }
        this.moveTo(Math.floor((parentBox.w - this.boundingBox.w) / 2),
            Math.floor((parentBox.h - this.boundingBox.h) / 2));
    }

    public computeBoundingBox() {
        if ( !this.visible) {
            return;
        }
        if ( this.children.length > 0 ) {
            this.boundingBox.w = 0;
            this.boundingBox.h = 0;
        }
        let first: boolean = true;
        for (let child of this.children) {
            let node: Node = <Node> child;
            node.computeBoundingBox();
            if (node.visible) {
                if (first) {
                    this.boundingBox.w = node.boundingBox.x + node.boundingBox.w;
                    this.boundingBox.h = node.boundingBox.y + node.boundingBox.h;
                    first = false;
                } else {
                    // make sure our bounding box contains all the visible children.
                    this.boundingBox.w = Math.max(this.boundingBox.w, node.boundingBox.x + node.boundingBox.w);
                    this.boundingBox.h = Math.max(this.boundingBox.h, node.boundingBox.y + node.boundingBox.h);
                }
            }
        }
    }

   protected expandChildren(w: number, h: number) {
        for (let child of this.children) {
            (<Node> child).expand(w, h);
        }
    }

    protected updateChildrenHierarchy(time: number) {
        for (let child of this.children) {
            (<Node> child).updateHierarchy(time);
        }
    }
}
