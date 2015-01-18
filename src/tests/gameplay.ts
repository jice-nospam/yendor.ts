/// <reference path="tsUnit.ts" />
/// <reference path="../yendor/yendor.ts" />
/// <reference path="../game/engine.ts" />

module Tests {
	"use strict";

	/*
		Class: GameplayTests
		Not really unit tests but tools to help balance the game
	*/
	export class GameplayTests extends tsUnit.TestClass {
		private items: Game.Actor[];
		setUp() {
			Yendor.init();
			this.items = [];
			// build a table containing an item of each type
			for ( var i: number = 0; i < Game.ActorType.LAST_ACTOR_TYPE; ++i) {
				if (i !== Game.ActorType.PLAYER) {
					this.items.push(Game.ActorFactory.create(i));
				}
    		}
		}
		_formatNumber(n: number): number {
			return Math.floor(n * 100) / 100;
		}

		/*
			Function: weaponBalance
			Display on the console the list of weapons sorted by damages (per unit of time)
		*/
		weaponBalance() {
			console.log("Weapon damages");
			console.log("==============");
			var weaponsMinDps: { [index: string]: number } = {};
			var weaponsMaxDps: { [index: string]: number } = {};
			var weapons: string[] = [];
			this.items.forEach( (item: Game.Actor) => {
				if ( item.equipment && item.attacker ) {
					// a melee weapon
					var dps: number = item.attacker.power / item.attacker.attackTime;
					weaponsMinDps[item.name] = dps;
					weaponsMaxDps[item.name] = dps;
					weapons.push(item.name);
				} else if ( item.equipment && item.ranged ) {
					// a ranged weapon.
					// get range of damage for compatible projectiles
					var minProjectileDamage: number;
					var maxProjectileDamage: number;
					this.items.forEach( (projectile: Game.Actor) => {
						if ( projectile.isA( item.ranged.projectileType ) ) {
							var effect: Game.InstantHealthEffect = <Game.InstantHealthEffect>projectile.pickable.onThrowEffect;
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
			weapons = weapons.sort( (n1: string, n2: string) => { return weaponsMinDps[n1] + weaponsMaxDps[n1]
				- weaponsMinDps[n2] - weaponsMaxDps[n2]; } );
			weapons.forEach( (name: string) => {
				if ( weaponsMinDps[name] !== weaponsMaxDps[name]) {
					console.log(name + " : " + this._formatNumber(weaponsMinDps[name]) + " - " + this._formatNumber(weaponsMaxDps[name]));
				} else {
					console.log(name + " : " + this._formatNumber(weaponsMinDps[name]));
				}
			} );
		}
	}
}
