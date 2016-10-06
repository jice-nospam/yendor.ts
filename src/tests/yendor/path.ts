import * as tsUnit from "../tsUnit";
import * as Yendor from "../../fwk/yendor/main";

export class PathTests extends tsUnit.TestClass {
    public binaryHeap() {
        let heap = new Yendor.BinaryHeap<number>((x: number) => { return x; });
        for (let n of [10, 3, 4, 8, 2, 9, 7, 1, 2, 6, 5]) {
            heap.push(n);
        }
        heap.remove(2);
        let result = "";
        while (heap.size() > 0) {
            result += heap.pop() + "|";
        }
        this.isTrue( result === "1|2|3|4|5|6|7|8|9|10|", "result === '1|2|3|4|5|6|7|8|9|10|'");
    }
}
