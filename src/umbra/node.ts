/*
	Section: Scene nodes
*/
module Umbra {
    "use strict";

    export abstract class Node extends Core.TreeNode {
        boundingBox: Core.Rect;

        private visible: boolean = true;
        private zOrder: number;
        private sortNeeded: boolean = false;

        show() {
            this.visible = true;
        }
        hide() {
            this.visible = false;
        }
        isVisible(): boolean {
            return this.visible;
        }

        getZOrder(): number {
            return this.zOrder;
        }

        setZOrder(value: number) {
            if (this.zOrder !== value) {
                this.zOrder = value;
                if (this.parent) {
                    (<Node>this.parent).sort(this);
                }
            }
        }

        computeAbsoluteCoordinates(pos: Core.Position): void {
            if (this.parent) {
                (<Node>this.parent).computeAbsoluteCoordinates(pos);
            }
            if (this.boundingBox) {
                pos.x += this.boundingBox.x;
                pos.y += this.boundingBox.y;
            }
        }

        abstract onInit(): void;
        abstract onTerm(): void;
        abstract onRender(con: Yendor.Console): void;
        abstract onUpdate(time: number): void;

		/*
			Function: sort
			One child needs to be sorted because its zOrder value changed
			
			Parameters:
			child - the child to sort
		*/
        protected sort(child: Node) {
            var index: number = 0;
            var len: number = this.children.length;
            while (index != len && this.children[index] !== child) {
                ++index;
            }
            while (index > 0 && (<Node>this.children[index - 1]).zOrder > child.zOrder) {
                this.children[index] = this.children[index - 1];
                this.children[index - 1] = child;
                --index;
            }
            while (index < len && (<Node>this.children[index + 1]).zOrder < child.zOrder) {
                this.children[index] = this.children[index + 1];
                this.children[index + 1] = child;
                ++index;
            }
        }

		/*
			Function: renderHierarchy
			Render this node, then this node children in ascending zOrder.

			Parameters:
			con - the console to render on
		*/
        renderHierarchy(con: Yendor.Console): void {
            if (this.visible) {
                this.onRender(con);
                for (var i: number = 0, len: number = this.children.length; i < len; ++i) {
                    var node: Node = <Node>this.children[i];
                    node.renderHierarchy(con);
                }
            }
        }

		/*
			Function: updateHierarchy
			Update this node, then this node children in ascending zOrder.

			Parameters:
			time - current game time
		*/
        updateHierarchy(time: number): void {
            if (this.visible) {
                this.onUpdate(time);
                for (var i: number = 0, len: number = this.children.length; i < len; ++i) {
                    var node: Node = <Node>this.children[i];
                    node.updateHierarchy(time);
                }
            }
        }

		/*
			Function: addChild
			Add a child keeping children sorted in zOrder.

			Parameters:
			node - the child node
		*/
        addChild(node: Node): void {
            var i: number = 0, len: number = this.children.length;
            while (i < len && (<Node>this.children[i]).zOrder < node.zOrder) {
                ++i;
            }
            if (i === len) {
                this.children.push(node);
            } else {
                this.children.splice(i, 0, node);
            }
        }

    }

}
