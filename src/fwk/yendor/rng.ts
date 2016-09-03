/**
	Section: Random number generator
*/

/**
    Class: Random
    Base for all RNG implementations.

    > let rng: Yendor.Random = new ComplementaryMultiplyWithCarryRandom();
    > let n: number = rng.getNumber(0,100);
*/
export abstract class Random {
    /**
        Function: getNumber
        Get a random number between two values.

        Parameters:
        min - minimum value
        max - maximum value

        Returns:
        A random number between min and max.
    */
    abstract getNumber(min: number, max: number): number;

    /**
        Function: getRandomChance
        Choose one value from a list, taking chances into account.
        For example with hashmap {"orc":30, "troll":10}, the function returns "orc" with a probability
        of 30/40 and "troll" with a probability of 10/40.

        You can also use enums as keys :
        > enum Type { ORC, TROLL };
        hashmap : {Type.ORC: 30, Type.TROLL: 10}

        The function will return Type.ORC or Type.TROLL.

        Parameters:
        chances - hashmap { key: string | number => number of chances }

        Returns:
        the key of the selected entry (either a string or a number depending on the input hashmap key type)

    */
    getRandomChance(chances: { [index: string]: number }): string | number {
        let chancesSum: number = 0;
        for (let key in chances) {
            if (chances.hasOwnProperty(key)) {
                if (chances[key] > 0) {
                    chancesSum += chances[key];
                }
            }
        }
        // the dice will land on some number between 1 and the sum of the chances
        let dice: number = this.getNumber(0, chancesSum);
        let currentChanceSum = 0;
        for (let key2 in chances) {
            if (chances.hasOwnProperty(key2) && chances[key2] > 0) {
                // go through all chances, keeping the sum so far
                currentChanceSum += chances[key2];
                // see if the dice landed in the part that corresponds to this choice
                if (dice <= currentChanceSum) {
                    return key2;
                }
            }
        }
        return undefined;
    }
}

/**
    Class: CMWCRandom
    Implements a RNG using <complementary multiply with carry
    at https://en.wikipedia.org/wiki/Multiply-with-carry> algorithm by George Marsaglia.
*/
export class CMWCRandom extends Random {
    static DIVIDER: number = 1 / Math.pow(2, 32);
    private cur: number = 0;
    private Q: number[];
    private c: number;

    private static _default: CMWCRandom;
    /**
        Property: default
        Some default generator.
        */
    static get default() {
        if ( CMWCRandom._default === undefined ) {
            CMWCRandom._default = new CMWCRandom(new Date().getTime());
        }
        return CMWCRandom._default;
    }

    /**
        Constructor: constructor

        Parameters:
        seed - *optional* use the same seed twice to get the same list of numbers. If not defined, a random seed is used.
    */
    constructor(seed?: number) {
        super();
        if (!seed) {
            seed = Math.floor(Math.random() * 0x7FFFFFFF);
        }
        // fill the Q array with pseudorandom seeds
        let s = seed;
        this.Q = [];
        for (let i = 0; i < 4096; i++) {
            s = ((s * 1103515245) + 12345) % 0x100000000; // glibc LCG
            this.Q[i] = s;
        }
        this.c = ((s * 1103515245) + 12345) % 809430660; // this max value is recommended by George Marsaglia
    }

    getNumber(min: number, max: number): number {
        if (max === min) {
            return min;
        }
        if (max < min) {
            let tmp = max;
            max = min;
            min = tmp;
        }
        let delta = max - min + 1;
        return (Math.abs(this.getCMWCNumber() % delta)) + min;
    }

    private getCMWCNumber(): number {
        let t: number;
        let x: number;
        this.cur = (this.cur + 1) % 4096;
        t = 18782 * this.Q[this.cur] + this.c;
        this.c = Math.floor(t * CMWCRandom.DIVIDER);
        x = (t + this.c) % 0x100000000;
        if (x < this.c) {
            x++;
            this.c++;
        }
        if (x === -1) {
            this.c++;
            x = 0;
        }
        this.Q[this.cur] = 0xfffffffe - x;
        return this.Q[this.cur];
    }
}
