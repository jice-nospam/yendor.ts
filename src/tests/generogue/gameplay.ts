import * as tsUnit from "../tsUnit";
import * as Actors from "../../fwk/actors/main";
import {ActorType} from "../../generogue/config_actors";
/**
    Class: GameplayTests
    Not really unit tests but tools to help balance the game
*/
export class GameplayTests extends tsUnit.TestClass {
    private actors: Actors.Actor[];
    setUp() {
        this.actors = [];
        // build a table containing an item of each type but player
        for ( let i: number = 0; i < ActorType.ACTOR_TYPE_COUNT; ++i) {
            if (i !== ActorType.PLAYER) {
                this.actors.push(Actors.ActorFactory.create(ActorType[i]));
            }
        }
    }
    private _formatNumber(n: number): number {
        return Math.floor(n * 100) / 100;
    }

    private _sortAndDisplayList(names: string[], minDmg: { [index: string]: number }, maxDmg: { [index: string]: number }) {
        names = names.sort( (n1: string, n2: string) => { return minDmg[n1] + maxDmg[n1]
            - minDmg[n2] - maxDmg[n2]; } );
        names.forEach( (name: string) => {
            if ( minDmg[name] !== maxDmg[name]) {
                console.log(name + " : " + this._formatNumber(minDmg[name]) + " - " + this._formatNumber(maxDmg[name]));
            } else {
                console.log(name + " : " + this._formatNumber(minDmg[name]));
            }
        } );
    }

    /**
        Function: weaponBalance
        Display on the console the list of weapons sorted by damages (per unit of time)
    */
    weaponBalance() {
        console.log("==============");
        console.log("Weapon damages");
        let weaponsMinDps: { [index: string]: number } = {};
        let weaponsMaxDps: { [index: string]: number } = {};
        let weapons: string[] = [];
        this.actors.forEach( (item: Actors.Actor) => {
            if ( item.equipment && item.attacker ) {
                // a melee weapon
                let dps: number = item.attacker.power / item.attacker.attackTime;
                weaponsMinDps[item.name] = dps;
                weaponsMaxDps[item.name] = dps;
                weapons.push(item.name);
            } else if ( item.equipment && item.ranged ) {
                // a ranged weapon.
                // get range of damage for compatible projectiles
                let minProjectileDamage: number;
                let maxProjectileDamage: number;
                this.actors.forEach( (projectile: Actors.Actor) => {
                    if ( projectile.isA( item.ranged.projectileType ) ) {
                        let effect: Actors.InstantHealthEffect = <Actors.InstantHealthEffect>projectile.pickable.onThrowEffect;
                        if (! minProjectileDamage || minProjectileDamage > -effect.amount ) {
                            minProjectileDamage = -effect.amount;
                        }
                        if (! maxProjectileDamage || maxProjectileDamage < -effect.amount ) {
                            maxProjectileDamage = -effect.amount;
                        }
                    }
                });
                weaponsMinDps[item.name] = minProjectileDamage * item.ranged.damageCoef / item.ranged.loadTime;
                weaponsMaxDps[item.name] = maxProjectileDamage * item.ranged.damageCoef / item.ranged.loadTime;
                weapons.push(item.name);
            }
        });
        this._sortAndDisplayList(weapons, weaponsMinDps, weaponsMaxDps);
    }

    /**
        Function: weaponBalance
        Display on the console the list of creatures sorted by damages (per unit of time) * max health
    */
    creatureBalance() {
        console.log("==============");
        console.log("Creature power");
        let minDps: { [index: string]: number } = {};
        let creatures: string[] = [];
        this.actors.forEach( (actor: Actors.Actor) => {
            if ( actor.ai && actor.attacker && actor.destructible ) {
                // a creature
                minDps[actor.name] = actor.attacker.power / actor.attacker.attackTime * actor.destructible.maxHp;
                creatures.push(actor.name);
            }
        });
        this._sortAndDisplayList(creatures, minDps, minDps);
    }
}
