import * as Core from "../../fwk/core/main";
import * as tsUnit from "../../tests/tsUnit";

export class CoreTests extends tsUnit.TestClass {
    public crc32() {
        this.areIdentical(2240272485, Core.crc32("abcde"));
    }
}
