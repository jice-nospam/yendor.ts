/**
	Section: Tree
*/
module Core {
    "use strict";
	/**
		Class: TreeNode
		Tree data structure
	*/
    export class TreeNode {
		/**
			Property: parent
		*/
        protected parent: TreeNode;

		/**
			Property: children
		*/
        protected children: TreeNode[] = [];

		/**
			Constructor: constructor

			Parameters:
			_parent : the parent node
			_children : the children array
		*/
        constructor(_parent?: TreeNode, _children?: TreeNode[]) {
            if (_parent) {
                this.parent = _parent;
            }
            if (_children) {
                this.children = _children;
            }
        }

    }
}