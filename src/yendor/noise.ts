/*
	Section: Simplex noise generator
*/
module Yendor {
    "use strict";

	/*
		Class: Noise
		Base for all noise generators implementations.

		> var noise: Yendor.Noise = new SimplexNoise();
		> var n: number = noise.get1D(0.5);
	*/
    export abstract class Noise {
		/*
			Function: get1D
			One dimension noise.

			Parameters:
			x - value

			Returns:
			A number between -1 and 1.
		*/
        abstract get1D(x: number): number;
    }

	/*
		Class: SimplexNoise
	*/
    export class SimplexNoise extends Noise {
        protected static HASH_MASK_1D: number = 255;
        protected static GRADIENTS_1D: number[] = [1, -1];
        protected static GRADIENTS_1D_MASK: number = 1;
        protected static INVERSE_MAX_FALLOF_1D: number = 64/27;
         
        private hash: number[];
        private frequency: number;
        constructor(rng: Random, frequency: number) {
            super();
            this.hash = this.computeHash(rng);
            this.frequency = frequency;
        }
        
        private computeHash(rng: Random): number[] {
            var hash = [];
            for (var i: number = 0; i <= SimplexNoise.HASH_MASK_1D; ++i) {
                hash[i] = i;
            }
            while (--i) {
                var idx = Math.floor(rng.getNumber(0, SimplexNoise.HASH_MASK_1D));
                var tmp = hash[i];
                hash[i] = hash[idx];
                hash[idx] = tmp;
            }
            return hash;
        }

        public get1D(val: number): number {
            val *= this.frequency;
            var ix: number = Math.floor(val);
            var result = this.grad1d(val, ix);
            result += this.grad1d(val, ix + 1);
            // range [-1,1]
            return result * 2 - 1;
        }

        private grad1d(val: number, ix: number): number {
            var x: number = val - ix;
            // falloff function : (1 - x2)3
            var f: number = 1 - x * x;
            f = f * f * f;
            var h: number = this.hash[ix & SimplexNoise.HASH_MASK_1D];
            var v: number = SimplexNoise.GRADIENTS_1D[h & SimplexNoise.GRADIENTS_1D_MASK] * x;
            return f * v * SimplexNoise.INVERSE_MAX_FALLOF_1D;
        }
    }
}
