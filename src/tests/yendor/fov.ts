import * as tsUnit from "../tsUnit";
import * as Yendor from "../../fwk/yendor/main";

export class FovTests extends tsUnit.TestClass {
    private fov: Yendor.Fov;
    private inFov: boolean[][];
    public setUp() {
        this.fov = new Yendor.Fov(20, 20);
        this.inFov = [];
        for (let x = 0; x < 20; x++) {
            this.inFov[x] = [];
            for (let y = 0; y < 20; y++) {
                this.fov.setTransparent(x, y, true);
            }
        }
    }

    public noWall() {
        this.fov.computeFov(this.inFov, 10, 10, 20);

        for (let x = 0; x < 20; x++) {
            for (let y = 0; y < 20; y++) {
                this.isTrue(this.fov.isTransparent(x, y), "fov.isTransparent(" + x + "," + y + ")");
                this.isTrue(this.inFov[x][y], "fov.isInFov(" + x + "," + y + ")");
            }
        }
    }

    public pillar() {
        this.fov.setTransparent(10, 10, false);
        this.fov.computeFov(this.inFov, 10, 11, 20, true);

        for (let x = 0; x < 20; x++) {
            this.isTrue(this.inFov[x][10], "fov.isInFov(" + x + ",10)");
        }
        for (let y = 0; y < 20; y++) {
            if (y < 10) {
                this.isTrue(!this.inFov[10][y], "!fov.isInFov(10," + y + ")");
            } else {
                this.isTrue(this.inFov[10][y], "fov.isInFov(10," + y + ")");
            }
        }
    }

    public wall() {
        for (let x = 0; x < 20; x++) {
            this.fov.setTransparent(x, 10, false);
        }
        this.fov.computeFov(this.inFov, 10, 11, 20, true);

        for (let x2 = 0; x2 < 20; x2++) {
            for (let y = 0; y < 20; y++) {
                if (y < 10) {
                    this.isTrue(!this.inFov[x2][y], "!fov.isInFov(" + x2 + "," + y + ")");
                } else {
                    this.isTrue(this.inFov[x2][y], "fov.isInFov(" + x2 + "," + y + ")");
                }
            }
        }
    }

    public dontLightWalls() {
        for (let x = 0; x < 20; x++) {
            this.fov.setTransparent(x, 10, false);
        }
        this.fov.computeFov(this.inFov, 10, 11, 20, false);

        for (let x2 = 0; x2 < 20; x2++) {
            for (let y = 0; y < 20; y++) {
                if (y <= 10) {
                    this.isTrue(!this.inFov[x2][y], "!fov.isInFov(" + x2 + "," + y + ")");
                } else {
                    this.isTrue(this.inFov[x2][y], "fov.isInFov(" + x2 + "," + y + ")");
                }
            }
        }
    }
}
