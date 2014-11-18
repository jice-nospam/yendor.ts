/*
	Section: Random number generator
*/
module Yendor {
	"use strict";

	/*
		Interface: Random
		Base for all RNG implementations.

		> var rng: Yendor.Random = new ComplementaryMultiplyWithCarryRandom();
		> var n: number = rng.getNumber(0,100);
	*/
	export interface Random {
		/*
			Function: getNumber
			Get a random number between two values.

			Parameters:
			min - minimum value
			max - maximum value

			Returns:
			A random number between min and max.
		*/
		getNumber(min: number, max: number): number;
	}

	/*
		Class: ComplementaryMultiplyWithCarryRandom
		Implements a RNG using <complementary multiply with carry 
		at https://en.wikipedia.org/wiki/Multiply-with-carry> algorithm by George Marsaglia.
	*/
	export class ComplementaryMultiplyWithCarryRandom implements Random {
		private cur: number = 0;
		private Q: number[];
		private c: number;

		/*
			Constructor: constructor

			Parameters:
			seed - *optional* use the same seed twice to get the same list of numbers. If not defined, a random seed is used.
		*/
		constructor(seed?: number) {
			if (! seed) {
				seed = Math.floor(Math.random() * 0x7FFFFFFF);
			}
			// fill the Q array with pseudorandom seeds
			var s = seed;
			this.Q = [];
			for (var i = 0; i < 4096; i++) {
				s = ((s * 1103515245) + 12345 ) % 0x100000000; // glibc LCG 
				this.Q[i] = s;
			}
			this.c = ((s * 1103515245) + 12345) % 809430660; // this max value is recommended by George Marsaglia 
		}

		getNumber(min: number, max: number): number {
			if ( max === min ) {
				return min;
			}
			if ( max < min ) {
				var tmp = max;
				max = min;
				min = tmp;
			}
			var delta = max - min + 1;
			return ( Math.abs(this.getCMWCNumber() % delta) ) + min;
		}

		private getCMWCNumber(): number {
			var t: number;
			var x: number;
			this.cur = (this.cur + 1) % 4096;
			t = 18782 * this.Q[this.cur] + this.c;
			this.c = Math.floor(t / Math.pow(2, 32));
			x = (t + this.c) % 0x100000000;
			if (x < this.c) {
				x++;
				this.c++;
			}
			if ( (x + 1) === 0 ) {
				this.c++;
				x = 0;
			}
			this.Q[this.cur] = 0xfffffffe - x;
			return this.Q[this.cur];
		}
	}
}
