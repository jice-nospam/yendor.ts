/**
 * Section: Simplex noise generator
 */
import * as rng from "./rng";
/**
 * Class: Noise
 * Base for all noise generators implementations.
 * > let noise: Yendor.Noise = new SimplexNoise();
 * > let n: number = noise.get1D(0.5);
 */
export abstract class Noise {
    /**
     * Function: get1D
     * One dimension noise.
     * Parameters:
     * x - value
     * Returns:
     * A number between -1 and 1.
     */
    public abstract get1D(x: number, frequency: number): number;

    /**
     * Function: get2D
     * Two dimensions noise.
     * Parameters:
     * x - value
     * y - value
     * Returns:
     * A number between -1 and 1.
     */
    public abstract get2D(x: number, y: number, frequency: number): number;

    /**
     * Function: get3D
     * Three dimensions noise.
     * Parameters:
     * x - value
     * y - value
     * z - value
     * Returns:
     * A number between -1 and 1.
     */
    public abstract get3D(x: number, y: number, z: number, frequency: number): number;

    /**
     * function: fbm1D
     * Compute a one dimension fractal brownian motion.
     * Parameters :
     * x - value
     * frequency - noise scaling factor
     * octaves - how many noise we add (between 1 and 8)
     * lacunarity - frequency factor between each octave (between 1 and 4, default 2)
     * persistence - amplitude factor between each octave (between 0 and 1, default 0.5)
     */
    public fbm1D(x: number, frequency: number, octaves: number, lacunarity: number = 2, persistence: number = 0.5) {
        let sum = this.get1D(x, frequency);
        let amplitude = 1;
        let range = 1;
        for (let o = 1; o < octaves; o++) {
            frequency *= lacunarity;
            amplitude *= persistence;
            range += amplitude;
            sum += this.get1D(x, frequency) * amplitude;
        }
        return sum / range;
    }

    /**
     * function: fbm2D
     * Compute a two dimension fractal brownian motion.
     * Parameters :
     * x - value
     * y - value
     * frequency - noise scaling factor
     * octaves - how many noise we add (between 1 and 8)
     * lacunarity - frequency factor between each octave (between 1 and 4, default 2)
     * persistence - amplitude factor between each octave (between 0 and 1, default 0.5)
     */
    public fbm2D(x: number, y: number, frequency: number, octaves: number,
                 lacunarity: number = 2, persistence: number = 0.5) {
        let sum = this.get2D(x, y, frequency);
        let amplitude = 1;
        let range = 1;
        for (let o = 1; o < octaves; o++) {
            frequency *= lacunarity;
            amplitude *= persistence;
            range += amplitude;
            sum += this.get2D(x, y, frequency) * amplitude;
        }
        return sum / range;
    }

    /**
     * function: fbm3D
     * Compute a three dimension fractal brownian motion.
     * Parameters :
     * x - value
     * y - value
     * z - value
     * frequency - noise scaling factor
     * octaves - how many noise we add (between 1 and 8)
     * lacunarity - frequency factor between each octave (between 1 and 4, default 2)
     * persistence - amplitude factor between each octave (between 0 and 1, default 0.5)
     */
    public fbm3D(x: number, y: number, z: number, frequency: number, octaves: number,
                 lacunarity: number = 2, persistence: number = 0.5) {
        let sum = this.get3D(x, y, z, frequency);
        let amplitude = 1;
        let range = 1;
        for (let o = 1; o < octaves; o++) {
            frequency *= lacunarity;
            amplitude *= persistence;
            range += amplitude;
            sum += this.get3D(x, y, z, frequency) * amplitude;
        }
        return sum / range;
    }
}

/**
 * Class: SimplexNoise
 * Simplex noise implementation adapted from http://catlikecoding.com/unity/tutorials/simplex-noise/
 */
export class SimplexNoise extends Noise {
    protected static HASH_MASK: number = 255;
    protected static GRADIENTS_1D: number[] = [1, -1];
    protected static GRADIENTS_1D_MASK: number = 1;
    protected static INVERSE_MAX_FALLOF_1D: number = 64 / 27;

    protected static GRADIENTS_2D: number[][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    protected static GRADIENTS_2D_MASK: number = 3;
    protected static SQUARE_TO_TRIANGLE: number = (3 - Math.sqrt(3)) / 6;
    protected static TRIANGLE_TO_SQUARE: number = (Math.sqrt(3) - 1) / 2;
    protected static INVERSE_MAX_FALLOF_2D: number = 2916 * Math.sqrt(2) / 125;

    protected static GRADIENTS_3D: number[][] = [
        [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
        [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
        [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
        [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
        [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
        [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
        [1, 1, 1], [-1, 1, 1], [1, -1, 1], [-1, -1, 1],
        [1, 1, -1], [-1, 1, -1], [1, -1, -1], [-1, -1, -1],
    ];
    protected static GRADIENTS_3D_MASK: number = 31;
    protected static normalizedGradient3d: boolean = false;
    protected static INVERSE_MAX_FALLOF_3D: number = 8192 * Math.sqrt(3) / 375;
    private static normalizeGradient3d() {
        SimplexNoise.normalizedGradient3d = true;
        for (let i: number = 0; i <= SimplexNoise.GRADIENTS_3D_MASK; ++i) {
            let x = SimplexNoise.GRADIENTS_3D[i][0];
            let y = SimplexNoise.GRADIENTS_3D[i][1];
            let z = SimplexNoise.GRADIENTS_3D[i][2];
            let invLength = 1 / Math.sqrt(x * x + y * y + z * z);
            SimplexNoise.GRADIENTS_3D[i][0] *= invLength;
            SimplexNoise.GRADIENTS_3D[i][1] *= invLength;
            SimplexNoise.GRADIENTS_3D[i][2] *= invLength;
        }
    }

    private hash: number[];

    constructor(generator: rng.Random) {
        super();
        if (!SimplexNoise.normalizedGradient3d) {
            SimplexNoise.normalizeGradient3d();
        }
        this.hash = this.computeHash(generator);
    }

    public get1D(val: number, frequency: number): number {
        val *= frequency;
        let ix: number = Math.floor(val);
        let result = this.grad1d(val, ix);
        result += this.grad1d(val, ix + 1);
        // range [-1,1]
        return result  * SimplexNoise.INVERSE_MAX_FALLOF_1D;
    }

    public get2D(valx: number, valy: number, frequency: number): number {
        valx *= frequency;
        valy *= frequency;
        let skew = (valx + valy) * SimplexNoise.TRIANGLE_TO_SQUARE;
        let sx = valx + skew;
        let sy = valy + skew;
        let ix: number = Math.floor(sx);
        let iy: number = Math.floor(sy);
        let result = this.grad2d(valx, valy, ix, iy);
        result += this.grad2d(valx, valy, ix + 1, iy + 1);
        if (sx - ix >= sy - iy) {
            result += this.grad2d(valx, valy, ix + 1, iy);
        } else {
            result += this.grad2d(valx, valy, ix, iy + 1);
        }
        // range [-1,1]
        return result * SimplexNoise.INVERSE_MAX_FALLOF_2D;
    }

    public get3D(valx: number, valy: number, valz: number, frequency: number): number {
        valx *= frequency;
        valy *= frequency;
        valz *= frequency;
        let skew = (valx + valy + valz) * (1 / 3);
        let sx = valx + skew;
        let sy = valy + skew;
        let sz = valz + skew;
        let ix: number = Math.floor(sx);
        let iy: number = Math.floor(sy);
        let iz: number = Math.floor(sz);
        let result = this.grad3d(valx, valy, valz, ix, iy, iz);
        result += this.grad3d(valx, valy, valz, ix + 1, iy + 1, iz + 1);
        let x = sx - ix;
        let y = sy - iy;
        let z = sz - iz;
        if (x >= y) {
            if (x >= z) {
                result += this.grad3d(valx, valy, valz, ix + 1, iy, iz);
                if (y >= z) {
                    result += this.grad3d(valx, valy, valz, ix + 1, iy + 1, iz);
                } else {
                    result += this.grad3d(valx, valy, valz, ix + 1, iy, iz + 1);
                }
            } else {
                result += this.grad3d(valx, valy, valz, ix, iy, iz + 1);
                result += this.grad3d(valx, valy, valz, ix + 1, iy, iz + 1);
            }
        } else {
            if (y >= z) {
                result += this.grad3d(valx, valy, valz, ix, iy + 1, iz);
                if (x >= z) {
                    result += this.grad3d(valx, valy, valz, ix + 1, iy + 1, iz);
                } else {
                    result += this.grad3d(valx, valy, valz, ix, iy + 1, iz + 1);
                }
            } else {
                result += this.grad3d(valx, valy, valz, ix, iy, iz + 1);
                result += this.grad3d(valx, valy, valz, ix, iy + 1, iz + 1);
            }
        }
        // range [-1,1]
        return result * SimplexNoise.INVERSE_MAX_FALLOF_3D;
    }

    private computeHash(generator: rng.Random): number[] {
        let hash: number[] = [];
        let i: number;
        for (i = 0; i <= SimplexNoise.HASH_MASK; ++i) {
            hash[i] = i;
        }
        while (--i) {
            let idx = Math.floor(generator.getNumber(0, SimplexNoise.HASH_MASK));
            let tmp = hash[i];
            hash[i] = hash[idx];
            hash[idx] = tmp;
        }
        return hash;
    }

    private grad1d(val: number, ix: number): number {
        let x: number = val - ix;
        // falloff function : (1 - x2)3
        let f: number = 1 - x * x;
        f = f * f * f;
        let h: number = this.hash[ix & SimplexNoise.HASH_MASK];
        let v: number = SimplexNoise.GRADIENTS_1D[h & SimplexNoise.GRADIENTS_1D_MASK] * x;
        return f * v;
    }

    private grad2d(valx: number, valy: number, ix: number, iy: number): number {
        let unskew = (ix + iy) * SimplexNoise.SQUARE_TO_TRIANGLE;
        let x: number = valx - ix + unskew;
        let y: number = valy - iy + unskew;
        // falloff function : (0.5 - x2 - y2)3
        let f: number = 0.5 - x * x - y * y;
        if (f > 0) {
            f = f * f * f;
            let h: number = this.hash[(this.hash[ix & SimplexNoise.HASH_MASK] + iy) & SimplexNoise.HASH_MASK];
            let g: number[] = SimplexNoise.GRADIENTS_2D[h & SimplexNoise.GRADIENTS_2D_MASK];
            let v: number = g[0] * x + g[1] * y;
            return f * v;
        } else {
            return 0;
        }
    }

    private grad3d(valx: number, valy: number, valz: number, ix: number, iy: number, iz: number): number {
        let unskew = (ix + iy + iz) * (1 / 6);
        let x: number = valx - ix + unskew;
        let y: number = valy - iy + unskew;
        let z: number = valz - iz + unskew;
        // falloff function : (0.5 - x2 - y2 - z2)3
        let f: number = 0.5 - x * x - y * y - z * z;
        if (f > 0) {
            f = f * f * f;
            let h: number = this.hash[(this.hash[(this.hash[ix & SimplexNoise.HASH_MASK] + iy)
                & SimplexNoise.HASH_MASK] + iz) & SimplexNoise.HASH_MASK];
            let g: number[] = SimplexNoise.GRADIENTS_3D[h & SimplexNoise.GRADIENTS_3D_MASK];
            let v: number = g[0] * x + g[1] * y + g[2] * z;
            return f * v;
        } else {
            return 0;
        }
    }
}
