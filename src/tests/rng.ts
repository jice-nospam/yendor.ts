/// <reference path="tsUnit.ts" />
/// <reference path="../yendor/rng.ts" />
module Tests {
	"use strict";
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

		checkRandomChances() {
			var a: string = this.rng.getRandomChance({"item_a": 50, "item_b": 50});
			this.isTrue( a === "item_a" || a === "item_b", "a is 'item_a' or 'item_b'");
			var b: string = this.rng.getRandomChance({"item_a": 0, "item_b": 50});
			this.isTrue( b === "item_b" , "b is 'item_b'");
			var c: string = this.rng.getRandomChance({"item_a": 10, "item_b": 0});
			this.isTrue( c === "item_a" , "c is 'item_a'");
		}
	}
}
