/**
	Section: items
*/
module Game {
    "use strict";

	/********************************************************************************
	 * Group: lighting
	 ********************************************************************************/
	/**
		Class: Light
		An item that produces light
	*/
    export class Light implements ActorFeature {
        className: string;
        protected _options: LightDef;
        protected rangeFactor1: number;
        protected rangeFactor2: number;
        protected __noise : Yendor.Noise;
        /**
            Field: patternTime
            Position in the pattern in milliseconds
        */
        protected patternTime: number;
        constructor(options: LightDef) {
            this.className = "Game.Light";
            this._options = options;
        }
        get options(): LightDef { return this._options; }
        public setRange(newRange: number) {
            this._options.range = newRange;
            switch (this._options.falloffType) {
                case LightFalloffType.LINEAR:
                    this.rangeFactor1 = 1 / (newRange * newRange);
                    break;
                case LightFalloffType.NORMAL:
                    this.rangeFactor1 = 1 / (1 + newRange * newRange * Constants.LIGHT_NORMAL_RANGE_FACTOR);
                    this.rangeFactor2 = 1 / (1 - this.rangeFactor1);
                    break;
                default:
                    this.rangeFactor1 = 0;
                    break;
            }
        }
        getPosition(owner: Actor) {
            if ( !owner.wallActor ) {
                return owner.pos;
            }
            let cells:Core.Position[] = owner.pos.getAdjacentCells(Engine.instance.map.w, Engine.instance.map.h);
            for (let i: number = 0, len: number = cells.length; i < len; ++i ) {
                if (!Engine.instance.map.isWall(cells[i].x, cells[i].y)) {
                    return cells[i];
                }
            }
            return owner.pos;
        }
        /**
            Function: computeIntensityVariation
            Compute intensity variation along time from the defined pattern
            
            Parameters :
            delay - amount of time since last call
            
            Returns :
            Intensity level : 1 == full 0 == no light
        */
        public computeIntensityVariation(delay: number): number {
            if (! this._options.intensityVariationPattern) {
                return 1;
            }
            if (!this.patternTime) {
                // start the pattern at a random position
                this.patternTime = Engine.instance.rng.getNumber(0, this._options.intensityVariationLength);
            }
            let value : number;
            if (this._options.intensityVariationPattern === "noise") {
                value = this.computeNoiseIntensityVariation(delay);
            } else {
                value = this.computePatternIntensityVariation(delay);
            }
            return 1 - this._options.intensityVariationRange + value * this._options.intensityVariationRange;
        }
        
        protected computeNoiseIntensityVariation(delay: number): number {
            if (! this.__noise) {
                this.__noise = new Yendor.SimplexNoise(Engine.instance.rng);
            }
            this.patternTime += delay / this._options.intensityVariationLength;
            return (this.__noise.get1D(this.patternTime, 1) + 1) * 0.5;
        }
                
        protected computePatternIntensityVariation(delay: number): number {
            this.patternTime += delay;
            while (this.patternTime > this._options.intensityVariationLength) {
                this.patternTime -= this._options.intensityVariationLength;
            }
            let patternLen = this._options.intensityVariationPattern.length;
            let patternPos = patternLen * this.patternTime / this._options.intensityVariationLength;
            let charPos = Math.floor(patternPos);
            let interpolateCoef = patternPos - charPos; 
            let charNextPos = (charPos + 1) % patternLen;
            // values between 0 and 9
            let value = this._options.intensityVariationPattern.charCodeAt(charPos) - Constants.BASE_LIGHT_PATTERN_ASCIICODE;
            let nextValue = this._options.intensityVariationPattern.charCodeAt(charNextPos) - Constants.BASE_LIGHT_PATTERN_ASCIICODE;
            // interpolate between the two values
            let interpolatedValue = (1-interpolateCoef) * value + interpolateCoef * nextValue;
            return interpolatedValue / 9;
        }

        public computeIntensity(squaredDistance: number): number {
            if (this.rangeFactor1 === undefined) {
                // compute factors only once to speed up computation
                this.setRange(this._options.range);
            }
            switch (this._options.falloffType) {
                case LightFalloffType.LINEAR:
                    return 1 - squaredDistance * this.rangeFactor1;
                case LightFalloffType.INVERSE_SQUARE:
                    return 1 / (1 + squaredDistance);
                case LightFalloffType.NORMAL:
                    // see http://roguecentral.org/doryen/articles/lights-in-full-color-roguelikes/
                    let intensityCoef1: number = 1 / (1 + squaredDistance * Constants.LIGHT_NORMAL_RANGE_FACTOR);
                    return (intensityCoef1 - this.rangeFactor1) * this.rangeFactor2;
                default:
                    return 1;
            }
        }

    }
}
