module Tests {
	"use strict";
	export class RngTests extends tsUnit.TestClass {
		private rng: Yendor.Random = new Yendor.ComplementaryMultiplyWithCarryRandom();

		isInRange() {
			let a: number = this.rng.getNumber(100, 200);

			this.isTrue( a >= 100 && a <= 200, "100 <= " + a + "<= 200" );
		}

		isNotConstant() {
			let a: number = this.rng.getNumber(300, 400);
			let b: number = this.rng.getNumber(300, 400);

			this.isTrue( a >= 300 && a <= 400, "300 <= " + a + "<= 400" );
			this.isTrue( b >= 300 && b <= 400, "300 <= " + b + "<= 400" );
			// fails sometimes
			this.isTrue( a !== b, a + " !=" + b );
		}

		handlesInvertedMinMax() {
			let a: number = this.rng.getNumber(200, 100);

			this.isTrue( a >= 100 && a <= 200, "100 <= " + a + "<= 200" );
		}

		isReproductible() {
			let rng: Yendor.Random = new Yendor.ComplementaryMultiplyWithCarryRandom(123);
			let a: number = rng.getNumber(0, 1000);
			rng = new Yendor.ComplementaryMultiplyWithCarryRandom(123);
			let b: number = rng.getNumber(0, 1000);

			this.isTrue( a === b, a + "==" + b );
		}

		checkRandomChances() {
			let a: string|number = this.rng.getRandomChance({"item_a": 50, "item_b": 50});
			this.isTrue( a === "item_a" || a === "item_b", "a is 'item_a' or 'item_b'");
			let b: string|number = this.rng.getRandomChance({"item_a": 0, "item_b": 50});
			this.isTrue( b === "item_b" , "b is 'item_b'");
			let c: string|number = this.rng.getRandomChance({"item_a": 10, "item_b": 0});
			this.isTrue( c === "item_a" , "c is 'item_a'");
		}
	}
}
