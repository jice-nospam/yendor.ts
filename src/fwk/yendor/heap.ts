/**
	Section: Binary heap
*/
/**
    Class: BinaryHeap
    A min heap used for A* algorithm.
    Adapted from http://www.openbookproject.net/books/mi2pwjs/app_b.html#binary-heaps-appendix
*/
export class BinaryHeap<T> {
    private content: T[] = [];
    private scoreFunction: (element: T) => number;
    constructor(scoreFunction: (element: T) => number) {
        this.scoreFunction = scoreFunction;
    }
    push(element: T) {
        this.content.push(element);
        this.bubbleUp(this.content.length - 1);
    }
    pushAll(elements: T[]) {
        let len: number = elements.length;
        for (let i: number = 0; i < len; ++i) {
            this.push(elements[i]);
        }
    }
    peek(index: number = 0): T {
        return this.content.length > index ? this.content[index] : undefined;
    }
    clear() {
        this.content = [];
    }
    pop(): T {
        let result: T = this.content[0];
        let end: T = this.content.pop();
        if (this.content.length > 0) {
            this.content[0] = end;
            this.sinkDown(0);
        }
        return result;
    }
    /**
        Function: contains
        Check if the heap contains en element. Only works if the elements implements <Comparable>
    */
    contains(element: T): boolean {
        let len: number = this.content.length;
        for (let i: number = 0; i < len; ++i) {
            if ((<any>element).equals(<any>(this.content[i]))) {
                return true;
            }
        }
        return false;
    }
    remove(element: T): boolean {
        let index: number = this.content.indexOf(element);
        if ( index === -1 ) {
            return false;
        }
        let end: T = this.content.pop();
        if (index !== this.content.length ) {
            this.content[index] = end;
            if (this.scoreFunction(end) < this.scoreFunction(element)) {
                this.bubbleUp(index);
            } else {
                this.sinkDown(index);
            }
        }
        return true;
    }
    size(): number {
        return this.content.length;
    }
    isEmpty(): boolean {
        return this.content.length === 0;
    }
    private bubbleUp(n: number) {
        let element: T = this.content[n];
        while (n > 0) {
            let parentN: number = Math.floor((n + 1) / 2) - 1;
            let parent: T = this.content[parentN];
            if (this.scoreFunction(element) <= this.scoreFunction(parent)) {
                this.content[parentN] = element;
                this.content[n] = parent;
                n = parentN;
            } else {
                break;
            }
        }
    }
    private sinkDown(n: number) {
        let length: number = this.content.length;
        let element: T = this.content[n];
        let elemScore: number = this.scoreFunction(element);
        while (true) {
            let child2N: number = (n + 1) * 2;
            let child1N: number = child2N - 1;
            let swap: number = undefined;
            let child1Score: number;
            if (child1N < length) {
                let child1 = this.content[child1N];
                child1Score = this.scoreFunction(child1);
                if (child1Score < elemScore) {
                    swap = child1N;
                }
            }
            if (child2N < length) {
                let child2 = this.content[child2N];
                let child2Score = this.scoreFunction(child2);
                if (child2Score < (swap === undefined ? elemScore : child1Score)) {
                    swap = child2N;
                }
            }
            if (swap !== undefined) {
                this.content[n] = this.content[swap];
                this.content[swap] = element;
                n = swap;
            } else {
                break;
            }
        }
    }
}
