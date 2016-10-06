import * as Core from "../core/main";
import * as Umbra from "../umbra/main";
import {Actor} from "./actor";

// unlimited fov
export const FOV_RADIUS: number = 0;

// some material colors
export const FROST_COLOR: Core.Color = 0xE0E0FF;

// gameplay
export const LIGHT_NORMAL_RANGE_FACTOR = 1 / 20;
// light intensity pattern lower value is 48 = '0'
export const BASE_LIGHT_PATTERN_ASCIICODE: number = 48;
// minimum light level to see actors
export const PENUMBRA_THRESHOLD: number = 0.25;
// character to use for actors in penumbra (63 = '?')
export const PENUMBRA_ASCIICODE: number = 63;
export const SCENT_THRESHOLD: number = 10;
export const PLAYER_WALK_TIME: number = 5;
// how many turns you are confused after being stunned
export const AFTER_STUNNED_CONFUSION_DELAY: number = 3;
// overencumbered inventory capacity (percentage of capacity)
export const OVERENCUMBERED_THRESHOLD: number = 0.9;
// when overencumbered, walkTime is multiplied by this value
export const OVERENCUMBERED_MULTIPLIER: number = 1.5;
export const FROZEN_MULTIPLIER: number = 3;

// equipment slots names
export const SLOT_RIGHT_HAND: string = "right hand";
export const SLOT_LEFT_HAND: string = "left hand";
export const SLOT_BOTH_HANDS: string = "hands";
export const SLOT_QUIVER: string = "quiver";

// persistence local storage keys
export const PERSISTENCE_ACTORS_KEY: string = "actors";
export const PERSISTENCE_ACTORS_SEQ_KEY: string = "actorsSeq";

// event types
/** a light has been turned on or off. Associated data : the Actor containing the light */
export const EVENT_LIGHT_ONOFF: string = "LIGHT_ONOFF";

export interface INumberSelector {
    selectNumber(message: string, minValue: number, maxValue: number, initialValue?: number): Promise<number>;
}

export enum PlayerActionEnum {
/** empty action. still triggers a new turn */
NOACTION = 1,
MOVE_NORTH,
MOVE_SOUTH,
MOVE_EAST,
MOVE_WEST,
MOVE_NW,
MOVE_NE,
MOVE_SW,
MOVE_SE,
MOVE_UP,
MOVE_DOWN,
WAIT,
GRAB,
USE_ITEM,
DROP_ITEM,
THROW_ITEM,
FIRE,
ZAP,
SELECT_TILE,
SELECT_ITEM,
ACTIVATE,
VALIDATE,
CANCEL
}

export let getLastPlayerAction = function(): PlayerActionEnum|undefined {
    let lastActionName: string|undefined = Umbra.getLastAxisName();
    if ( lastActionName ) {
        return (<any> PlayerActionEnum)[lastActionName];
    }
    return undefined;
};

/**
 * Function: convertActionToPosition
 * convert a movement action into an actual dx, dy movement
 * Returns:
 * the Core.Position containing the movement, 0,0 if the action is not a movement action
 */
export let convertActionToPosition = function(action: PlayerActionEnum): Core.Position {
    let move: Core.Position = new Core.Position(0, 0);
    switch (action) {
        case PlayerActionEnum.MOVE_NORTH:
            move.y = -1;
            break;
        case PlayerActionEnum.MOVE_SOUTH:
            move.y = 1;
            break;
        case PlayerActionEnum.MOVE_EAST:
            move.x = 1;
            break;
        case PlayerActionEnum.MOVE_WEST:
            move.x = -1;
            break;
        case PlayerActionEnum.MOVE_NW:
            move.x = -1;
            move.y = -1;
            break;
        case PlayerActionEnum.MOVE_NE:
            move.x = 1;
            move.y = -1;
            break;
        case PlayerActionEnum.MOVE_SW:
            move.x = -1;
            move.y = 1;
            break;
        case PlayerActionEnum.MOVE_SE:
            move.x = 1;
            move.y = 1;
            break;
        default: break;
    }
    return move;
};

/**
 * Function: transformMessage
 * Convert variables inside a text into their actual value.
 * Available variables (example for actor1  = a sword or the player) :
 * - [The actor1's] - The sword's / Your
 * - [the actor1's] - the sword's  / your
 * - [The actor1] - The sword / You
 * - [the actor1] - the sword / you
 * - [A actor1] - A sword / You
 * - [a actor1] - a sword / you
 * - [s] - s / <empty>  (verb ending)
 * - [it] - it / you
 * - [its] - its / your
 * - [is] - is / are
 * The same variables are available for a second actor :
 * - [The actor2's]
 * - [the actor2's]
 * - [The actor2]
 * - [the actor2]
 * - [A actor2]
 * - [a actor2]
 * - [s2]
 * - [it2]
 * - [its2]
 * - [is2]
 * There are also two numerical values [value1] and [value2].
 * Example :
 * [The actor1] hit[s] with [a actor2] for [value1] points.
 * applied to actor1 = player, actor2 = sword, value1 = 5 :
 * You hit with a sword for 5 points.
 * applied to actor1 = orc, actor2 = axe, value1 = 5 :
 * The orc hits with an axe for 5 points.
 */
export let transformMessage = function(text: string, actor1: Actor, actor2?: Actor,
                                       value1?: number, value2?: number): string {
    let newText = text;
    if ( actor1) {
        newText = newText.replace(/\[The actor1\'s\] /g, actor1.getThenames());
        newText = newText.replace(/ \[the actor1\'s\] /g, actor1.getthenames());
        newText = newText.replace(/\[The actor1\]/g, actor1.getThename());
        newText = newText.replace(/ \[the actor1\]/g, actor1.getthename());
        newText = newText.replace(/\[A actor1\]/g, actor1.getAname());
        newText = newText.replace(/ \[a actor1\]/g, actor1.getaname());
        newText = newText.replace(/\[s\]/g, actor1.getVerbEnd());
        newText = newText.replace(/ \[it\]/g, actor1.getit());
        newText = newText.replace(/ \[its\] /g, actor1.getits());
        newText = newText.replace(/ \[is\]/g, actor1.getis());
    }
    if (actor2) {
        newText = newText.replace(/\[The actor2\'s\] /g, actor2.getThenames());
        newText = newText.replace(/ \[the actor2\'s\] /g, actor2.getthenames());
        newText = newText.replace(/\[The actor2\]/g, actor2.getThename());
        newText = newText.replace(/ \[the actor2\]/g, actor2.getthename());
        newText = newText.replace(/\[A actor2\]/g, actor2.getAname());
        newText = newText.replace(/ \[a actor2\]/g, actor2.getaname());
        newText = newText.replace(/\[s2\]/g, actor2.getVerbEnd());
        newText = newText.replace(/ \[it2\]/g, actor2.getit());
        newText = newText.replace(/ \[its2\] /g, actor2.getits());
        newText = newText.replace(/ \[is2\]/g, actor2.getis());
    }
    if (value1 !== undefined) {
        newText = newText.replace(/\[value1\]/g, "" + value1);
    }
    if (value2 !== undefined) {
        newText = newText.replace(/\[value2\]/g, "" + value2);
    }
    return newText;
};
