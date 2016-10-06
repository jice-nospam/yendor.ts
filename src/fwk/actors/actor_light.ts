/**
 * Section: items
 */
import * as Core from "../core/main";
import * as Yendor from "../yendor/main";
import {IActorFeature} from "./actor_feature";
import {ILightDef, LightFalloffTypeEnum} from "./actor_def";
import {LIGHT_NORMAL_RANGE_FACTOR, BASE_LIGHT_PATTERN_ASCIICODE} from "./base";

/**
 * =============================================================================
 * Group: lighting
 * =============================================================================
 */
/**
 * Class: Light
 * An item that produces light
 */
export class Light implements IActorFeature {
    protected _options: ILightDef;
    protected rangeFactor1: number;
    protected rangeFactor2: number;
    protected __noise: Yendor.Noise;
    /** for wall torch, the light position must be on a floor tile whereas the owner is on a wall tile */
    protected pos: Core.Position;
    /**
     * Field: patternTime
     * Position in the pattern in milliseconds
     */
    protected patternTime: number;
    constructor(options: ILightDef) {
        this._options = options;
    }
    get options(): ILightDef { return this._options; }
    get position(): Core.Position { return this.pos; }
    set position(p: Core.Position) { this.pos = p; }

    public setRange(newRange: number) {
        this._options.range = newRange;
        switch (this._options.falloffType) {
            case LightFalloffTypeEnum.LINEAR:
                this.rangeFactor1 = 1 / (newRange * newRange);
                break;
            case LightFalloffTypeEnum.NORMAL:
                this.rangeFactor1 = 1 / (1 + newRange * newRange * LIGHT_NORMAL_RANGE_FACTOR);
                this.rangeFactor2 = 1 / (1 - this.rangeFactor1);
                break;
            default:
                this.rangeFactor1 = 0;
                break;
        }
    }
    /**
     * Function: computeIntensityVariation
     * Compute intensity variation along time from the defined pattern
     * Parameters :
     * delay - amount of time since last call
     * Returns :
     * Intensity level : 1 == full 0 == no light
     */
    public computeIntensityVariation(delay: number): number {
        if (! this._options.intensityVariationPattern) {
            return 1;
        }
        if (!this.patternTime && this._options.intensityVariationLength !== undefined) {
            // start the pattern at a random position
            this.patternTime = Yendor.CMWCRandom.default.getNumber(0, this._options.intensityVariationLength);
        }
        let value: number;
        if (this._options.intensityVariationPattern === "noise") {
            value = this.computeNoiseIntensityVariation(delay);
        } else {
            value = this.computePatternIntensityVariation(delay);
        }
        return 1 - this._options.intensityVariationRange + value * this._options.intensityVariationRange;
    }

    public computeIntensity(squaredDistance: number): number {
        if (this.rangeFactor1 === undefined) {
            // compute factors only once to speed up computation
            this.setRange(this._options.range);
        }
        switch (this._options.falloffType) {
            case LightFalloffTypeEnum.LINEAR:
                return 1 - squaredDistance * this.rangeFactor1;
            case LightFalloffTypeEnum.INVERSE_SQUARE:
                return 1 / (1 + squaredDistance);
            case LightFalloffTypeEnum.NORMAL:
                // see http://roguecentral.org/doryen/articles/lights-in-full-color-roguelikes/
                let intensityCoef1: number = 1 / (1 + squaredDistance * LIGHT_NORMAL_RANGE_FACTOR);
                return (intensityCoef1 - this.rangeFactor1) * this.rangeFactor2;
            default:
                return 1;
        }
    }

    protected computeNoiseIntensityVariation(delay: number): number {
        if (! this.__noise) {
            this.__noise = new Yendor.SimplexNoise(Yendor.CMWCRandom.default);
        }
        this.patternTime += delay / this._options.intensityVariationLength;
        return (this.__noise.get1D(this.patternTime, 1) + 1) * 0.5;
    }

    protected computePatternIntensityVariation(delay: number): number {
        if (this._options.intensityVariationPattern === undefined) {
            return 0;
        }
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
        let value = this._options.intensityVariationPattern.charCodeAt(charPos) - BASE_LIGHT_PATTERN_ASCIICODE;
        let nextValue = this._options.intensityVariationPattern.charCodeAt(charNextPos) - BASE_LIGHT_PATTERN_ASCIICODE;
        // interpolate between the two values
        let interpolatedValue = (1 - interpolateCoef) * value + interpolateCoef * nextValue;
        return interpolatedValue / 9;
    }
}
