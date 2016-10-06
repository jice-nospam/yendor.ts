import * as tsUnit from "../tsUnit";
import * as Yendor from "../../fwk/yendor/main";

export class NoiseTests extends tsUnit.TestClass {
    private static RANGE_TEST: number = 0.7;
    private rng: Yendor.Random = new Yendor.CMWCRandom();
    private noise: Yendor.Noise = new Yendor.SimplexNoise(this.rng);

    public isInRange1D() {
        let a: number = 0;
        let min: number = 0;
        let max: number = 0;
        let x: number = this.rng.getNumber(0, 1000);
        for (let i: number = 0; i < 100; ++i) {
            a = this.noise.get1D(x, 2);
            if (a < min) { min = a; }
            if (a > max) { max = a; }
            if (a < -1 || a > 1) {
                break;
            }
            x += 0.1;
        }
        this.isTrue(a >= -1 && a <= 1, "value not in range : -1 <= " + a + "<= 1");
        this.isTrue(min < -NoiseTests.RANGE_TEST, "bad min : " + min + "< -" + NoiseTests.RANGE_TEST);
        this.isTrue(max > NoiseTests.RANGE_TEST, "bad max : " + max + "> " + NoiseTests.RANGE_TEST);
    }

    public isInRange2D() {
        let a: number = 0;
        let min: number = 0;
        let max: number = 0;
        let x: number = this.rng.getNumber(0, 1000);
        for (let i: number = 0; i < 10000; ++i) {
            a = this.noise.get2D(x, 0, 2);
            if (a < min) { min = a; }
            if (a > max) { max = a; }
            if (a < -1 || a > 1) {
                break;
            }
            x += 0.05;
        }
        this.isTrue(a >= -1 && a <= 1, "value not in range : -1 <= " + a + "<= 1");
        this.isTrue(min < -NoiseTests.RANGE_TEST, "bad min : " + min + "< -" + NoiseTests.RANGE_TEST);
        this.isTrue(max > NoiseTests.RANGE_TEST, "bad max : " + max + "> " + NoiseTests.RANGE_TEST);
    }

    public isInRange3D() {
        let a: number = 0;
        let min: number = 0;
        let max: number = 0;
        let x: number = this.rng.getNumber(0, 1000);
        for (let i: number = 0; i < 10000; ++i) {
            a = this.noise.get3D(x, 0, 0, 2);
            if (a < min) { min = a; }
            if (a > max) { max = a; }
            if (a < -1 || a > 1) {
                break;
            }
            x += 0.01;
        }
        this.isTrue(a >= -1 && a <= 1, "value not in range : -1 <= " + a + "<= 1");
        this.isTrue(min < -NoiseTests.RANGE_TEST, "bad min : " + min + "< -" + NoiseTests.RANGE_TEST);
        this.isTrue(max > NoiseTests.RANGE_TEST, "bad max : " + max + "> " + NoiseTests.RANGE_TEST);
    }
}
