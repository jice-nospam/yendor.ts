/// <reference path="tsUnit.ts" />
/// <reference path="../yendor/path.ts" />
module Tests {
	"use strict";
	export class PathTests extends tsUnit.TestClass {
		binaryHeap() {
			var heap = new Yendor.BinaryHeap<number>((x: number) => { return x; });
			[10, 3, 4, 8, 2, 9, 7, 1, 2, 6, 5].forEach((n: number) => { heap.push(n); });

			heap.remove(2);
			var result = "";
			while (heap.size() > 0) {
				result += heap.pop() + "|";
			}
			this.isTrue( result === "1|2|3|4|5|6|7|8|9|10|", "result === '1|2|3|4|5|6|7|8|9|10|'");
		}
	}
}
