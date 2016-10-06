/**
 * Section: Tree
 */
/**
 * Class: TreeNode
 * Tree data structure
 */
export class TreeNode {
    /**
     * Constructor: constructor
     * Parameters:
     * __parent : the parent node
     * children : the children array
     */
    constructor(public __parent?: TreeNode, public children: TreeNode[] = []) {
    }

    public addChild<T extends TreeNode>(node: T): T {
        this.children.push(node);
        node.__parent = this;
        return node;
    }

    public removeChild<T extends TreeNode>(node: T): T {
        let index: number = this.children.indexOf(node);
        if ( index !== -1 ) {
            this.children.splice(index, 1);
        }
        return node;
    }

    public contains(node: TreeNode): boolean {
        if (! this.children) {
            return false;
        }
        for (let child of this.children) {
            if ( child === node || child.contains(node)) {
                return true;
            }
        }
        return false;
    }

    public clearChildren() {
        this.children = [];
    }

    public postLoad() {
        for (let child of this.children) {
            child.__parent = this;
        }
    }
}
