/// <reference path="tsUnit.ts" />
/// <reference path="../yendor/rng.ts" />
module Tests {
	export class RngTests extends tsUnit.TestClass {
		private rng: Yendor.Random = new Yendor.ComplementaryMultiplyWithCarryRandom();

		isInRange() {
			var a: number = this.rng.getNumber(100, 200);

			this.isTrue( a >= 100 && a <= 200, "100 <= " + a + "<= 200" );
		}

		isNotConstant() {
			var a: number = this.rng.getNumber(300, 400);
			var b: number = this.rng.getNumber(300, 400);

			this.isTrue( a >= 300 && a <= 400, "300 <= " + a + "<= 400" );
			this.isTrue( b >= 300 && b <= 400, "300 <= " + b + "<= 400" );
			// fails sometimes
			this.isTrue( a !== b, a + " !=" + b );
		}

		handlesInvertedMinMax() {
			var a: number = this.rng.getNumber(200, 100);

			this.isTrue( a >= 100 && a <= 200, "100 <= " + a + "<= 200" );
		}

		isReproductible() {
			var rng: Yendor.Random = new Yendor.ComplementaryMultiplyWithCarryRandom(123);
			var a: number = rng.getNumber(0, 1000);
			rng = new Yendor.ComplementaryMultiplyWithCarryRandom(123);
			var b: number = rng.getNumber(0, 1000);

			this.isTrue( a === b, a + "==" + b );
		}
	}
}
