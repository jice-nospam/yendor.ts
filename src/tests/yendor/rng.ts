import * as tsUnit from "../tsUnit";
import * as Yendor from "../../fwk/yendor/main";

export class RngTests extends tsUnit.TestClass {
    private rng: Yendor.Random = new Yendor.CMWCRandom();

    public isInRange() {
        let a: number = this.rng.getNumber(100, 200);

        this.isTrue( a >= 100 && a <= 200, "100 <= " + a + "<= 200" );
    }

    public isNotConstant() {
        let a: number = this.rng.getNumber(300, 400);
        let b: number = this.rng.getNumber(300, 400);

        this.isTrue( a >= 300 && a <= 400, "300 <= " + a + "<= 400" );
        this.isTrue( b >= 300 && b <= 400, "300 <= " + b + "<= 400" );
        // fails sometimes
        this.isTrue( a !== b, a + " !=" + b );
    }

    public handlesInvertedMinMax() {
        let a: number = this.rng.getNumber(200, 100);

        this.isTrue( a >= 100 && a <= 200, "100 <= " + a + "<= 200" );
    }

    public isReproductible() {
        let rng: Yendor.Random = new Yendor.CMWCRandom(123);
        let a: number = rng.getNumber(0, 1000);
        rng = new Yendor.CMWCRandom(123);
        let b: number = rng.getNumber(0, 1000);

        this.isTrue( a === b, a + "==" + b );
    }

    public checkRandomChances() {
        let a: string = <string> this.rng.getRandomChance({0: 50, 1: 50});
        this.isTrue( a === "0" || a === "1", "a is " + a + " instead of 0 or 1");
        let b: string = <string> this.rng.getRandomChance({0: 0, 1: 50});
        this.isTrue( b === "1" , "b is " + b + " instead of 1");
        let c: string = <string> this.rng.getRandomChance({0: 10, 1: 0});
        this.isTrue( c === "0" , "c is " + c + " instead of 0");
    }
}
