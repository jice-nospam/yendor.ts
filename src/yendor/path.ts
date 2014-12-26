/*
	Section: Path finding
*/
module Yendor {
	"use strict";

	/*
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
		pop(): T {
			var result: T = this.content[0];
			var end: T = this.content.pop();
			if ( this.content.length > 0 ) {
				this.content[0] = end;
				this.sinkDown(0);
			}
			return result;
		}
		remove(element: T) {
			var len: number = this.content.length;
			for (var i: number = 0; i < len; ++i) {
				if ( this.content[i] === element ) {
					var end: T = this.content.pop();
					if (i !== len - 1) {
						this.content[i] = end;
						if (this.scoreFunction(end) < this.scoreFunction(element)) {
							this.bubbleUp(i);
						} else {
							this.sinkDown(i);
						}
					}
					return;
				}
			}
		}
		size(): number {
			return this.content.length;
		}
		private bubbleUp(n: number) {
			var element: T = this.content[n];
			while (n > 0) {
				var parentN: number = Math.floor((n + 1) / 2) - 1;
                var parent: T = this.content[parentN];
                if (this.scoreFunction(element) < this.scoreFunction(parent)) {
                	this.content[parentN] = element;
                	this.content[n] = parent;
                	n = parentN;
                } else {
                	break;
                }
			}
		}
		private sinkDown(n: number) {
			var length: number = this.content.length;
            var element: T = this.content[n];
            var elemScore: number = this.scoreFunction(element);
            while (true) {
            	var child2N: number = (n + 1) * 2;
            	var child1N: number = child2N - 1;
            	var swap: number = undefined;
            	if (child1N < length) {
            		var child1 = this.content[child1N];
            		var child1Score = this.scoreFunction(child1);
            		if (child1Score < elemScore) {
            			swap = child1N;
            		}
            	}
            	if (child2N < length) {
            		var child2 = this.content[child2N];
            		var child2Score = this.scoreFunction(child2);
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

	/*
		Class: PathFinder
		Find the shortest path on a map using A* algorithm
	*/
	class PathFinder {
		// TODO
	}
}
