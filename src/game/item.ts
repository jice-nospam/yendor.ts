/*
	Section: items
*/
module Game {
	"use strict";

	/********************************************************************************
	 * Group: items
	 ********************************************************************************/

	/*
		Class: Destructible
		Something that can take damages and heal/repair.
	*/
	export class Destructible implements ActorFeature {
		className: string;
		private _maxHp: number;
		private _defense: number;
		private _hp: number;
		private _corpseName: string;
		private _xp: number = 0;
		/*
			Constructor: constructor

			Parameters:
			_maxHp - initial amount of health points
			_defense - when attacked, how much hit points are deflected
			_corpseName - new name of the actor when its health points reach 0
		*/
		constructor(_maxHp: number = 0, _defense: number = 0, _corpseName: string = "") {
			this.className = "Destructible";
			this._hp = _maxHp;
			this._maxHp = _maxHp;
			this._defense = _defense;
			this._corpseName = _corpseName;
		}

		get hp() { return this._hp; }
		set hp(newValue: number) { this._hp = newValue; }

		get xp() { return this._xp; }
		set xp(newValue: number) { this._xp = newValue; }

		get maxHp() { return this._maxHp; }

		get defense() { return this._defense; }
		set defense(newValue: number) { this._defense = newValue; }

		isDead(): boolean {
			return this._hp <= 0;
		}

		public computeRealDefense(owner: Actor): number {
			var realDefense = this.defense;
			if ( owner.container ) {
				// add bonus from equipped items
				// TODO shield can block only one attack per turn
				var n: number = owner.container.size();
				for ( var i: number = 0; i < n; i++) {
					var item: Actor = owner.container.get(i);
					if ( item.equipment && item.equipment.isEquipped() ) {
						realDefense += item.equipment.getDefenseBonus();
					}
				}
			}
			return realDefense;
		}

		/*
			Function: takeDamage
			Deals damages to this actor. If health points reach 0, call the die function.

			Parameters:
			owner - the actor owning this Destructible
			damage - amount of damages to deal

			Returns:
			the actual amount of damage taken
		*/
		takeDamage(owner: Actor, damage: number): number {
			damage -= this.computeRealDefense(owner);
			if ( damage > 0 ) {
				this._hp -= damage;
				if ( this.isDead() ) {
					this._hp = 0;
					this.die(owner);
				}
			} else {
				damage = 0;
			}
			return damage;
		}

		/*
			Function: heal
			Recover some health points

			Parameters:
			amount - amount of health points to recover

			Returns:
			the actual amount of health points recovered
		*/
		heal(amount: number): number {
			this._hp += amount;
			if ( this._hp > this._maxHp ) {
				amount -= this._hp - this._maxHp;
				this._hp = this._maxHp;
			}
			return amount;
		}

		/*
			Function: die
			Turn this actor into a corpse

			Parameters:
			owner - the actor owning this Destructible
		*/
		die(owner: Actor) {
			owner.ch = "%";
			owner.name = this._corpseName;
			owner.blocks = false;
			if (! owner.transparent) {
				Engine.instance.map.setTransparent(owner.x, owner.y, true);
				owner.transparent = true;
			}
		}
	}

	/*
		Class: Attacker
		An actor that can deal damages to another one
	*/
	export class Attacker implements ActorFeature {
		className: string;
		private _power: number;
		private _attackTime: number;
		/*
			Constructor: constructor

			Parameters:
			_power : amount of damages given
		*/
		constructor(_power: number = 0, attackTime: number = Constants.PLAYER_WALK_TIME) {
			this.className = "Attacker";
			this._power = _power;
			this._attackTime = attackTime;
		}

		/*
			Property: power
			Amount of damages given
		*/
		get power() { return this._power; }
		set power(newValue: number) { this._power = newValue; }

		get attackTime() { return this._attackTime; }

		/*
			Function: attack
			Deal damages to another actor

			Parameters:
			owner - the actor owning this Attacker
			target - the actor being attacked
		*/
		attack(owner: Actor, target: Actor) {
			if ( target.destructible && ! target.destructible.isDead() ) {
				var damage = this._power - target.destructible.computeRealDefense(target);
				var msg: string = "[The actor1] attack[s] [the actor2]";
				var msgColor: Yendor.Color;
				if ( damage >= target.destructible.hp ) {
					msg += " and kill[s] [it2] !";
					msgColor = Constants.LOG_WARN_COLOR;
				} else if ( damage > 0 ) {
					msg += " for " + damage + " hit points.";
					msgColor = Constants.LOG_WARN_COLOR;
				} else {
					msg += " but it has no effect!";
				}
				log(transformMessage(msg, owner, target), msgColor);
				target.destructible.takeDamage(target, this._power);
			}
		}
	}

	/********************************************************************************
	 * Group: inventory
	 ********************************************************************************/

	 /*
	 	Interface: ContainerListener
	 	Something that must be notified when an item is added or removed from the container
	 */
	 export interface ContainerListener {
	 	onAdd(item: Actor, container: Container, owner: Actor);
	 	onRemove(item: Actor, container: Container, owner: Actor);
	 }
	 /*
	 	Class: Container
	 	An actor that can contain other actors :
	 	- creatures with inventory
	 	- chests, barrels, ...
	 */
	 export class Container implements ActorFeature {
		className: string;
	 	private _capacity: number;
	 	private actorIds: ActorId[] = [];
	 	private __listener: ContainerListener;

	 	/*
	 		Constructor: constructor

	 		Parameters:
	 		_capacity - this container's maximum weight
	 	*/
	 	constructor(_capacity: number = 0, listener?: ContainerListener) {
			this.className = "Container";
	 		this._capacity = _capacity;
	 		this.__listener = listener;
	 	}

	 	get capacity(): number { return this._capacity; }
	 	set capacity(newValue: number) {this._capacity = newValue; }
	 	size(): number { return this.actorIds.length; }

	 	// used to rebuilt listener link after loading
	 	setListener(listener: ContainerListener) {
	 		this.__listener = listener;
	 	}

	 	get(index: number) : Actor {
	 		return Engine.instance.actorManager.getActor(this.actorIds[index]);
	 	}

	 	getFromSlot(slot: string): Actor {
	 		var n: number = this.size();
	 		for ( var i: number = 0; i < n; i++) {
	 			var actor: Actor = this.get(i);
	 			if ( actor.equipment && actor.equipment.isEquipped() && actor.equipment.getSlot() === slot ) {
	 				return actor;
	 			}
	 		}
	 		return undefined;
	 	}

	 	isSlotEmpty(slot: string): boolean {
	 		if ( this.getFromSlot(slot)) {
	 			return false;
	 		}
	 		if ( slot === Constants.SLOT_RIGHT_HAND || slot === Constants.SLOT_LEFT_HAND ) {
	 			if ( this.getFromSlot(Constants.SLOT_BOTH_HANDS)) {
	 				return false;
	 			}
	 		} else if ( slot === Constants.SLOT_BOTH_HANDS ) {
	 			if ( this.getFromSlot(Constants.SLOT_LEFT_HAND) || this.getFromSlot(Constants.SLOT_RIGHT_HAND) ) {
	 				return false;
	 			}
	 		}
	 		return true;
	 	}

	 	canContain(item: Actor): boolean {
	 		if (! item || ! item.pickable ) {
	 			return false;
	 		}
	 		return this.computeTotalWeight() + item.pickable.weight <= this._capacity;
	 	}

	 	computeTotalWeight(): number {
	 		var weight: number = 0;
	 		this.actorIds.forEach((actorId: ActorId) => {
	 			var actor: Actor = Engine.instance.actorManager.getActor(actorId);
	 			if ( actor.pickable ) {
	 				weight += actor.pickable.weight;
	 			}
	 		});
	 		return weight;
	 	}

	 	/*
	 		Function: add
	 		add a new actor in this container

	 		Parameters:
	 		actor - the actor to add

	 		Returns:
	 		false if the operation failed because the container is full
	 	*/
	 	add(actor: Actor, owner: Actor) {
	 		var weight: number = this.computeTotalWeight();
	 		if ( actor.pickable.weight + weight > this._capacity ) {
	 			return false;
	 		}
	 		this.actorIds.push( actor.id );
	 		actor.pickable.shortcut = undefined;
	 		if (this.__listener) {
	 			this.__listener.onAdd(actor, this, owner);
	 		}
	 		return true;
	 	}

	 	/*
	 		Function: remove
	 		remove an actor from this container

	 		Parameters:
	 		actor - the actor to remove
	 		owner - the actor owning the container
	 	*/
	 	remove(actor: Actor, owner: Actor) {
	 		var idx: number = this.actorIds.indexOf(actor.id);
	 		if ( idx !== -1 ) {
	 			this.actorIds.splice(idx, 1);
		 		if (this.__listener) {
		 			this.__listener.onRemove(actor, this, owner);
		 		}
	 		}
	 	}
	}

	/*
		Class: Pickable
		An actor that can be picked by a creature
	*/
	export class Pickable implements ActorFeature {
		className: string;
		/*
			Property: onUseEffector
			What happens when this item is used.
		*/
		private onUseEffector: Effector;
		/*
			Property: onThrowEffector
			What happens when this item is thrown.
		*/
		private onThrowEffector: Effector;
		private _weight: number;
		private _destroyedWhenThrown: boolean;
		private _container: ActorId;
		/*
			Property: _shortcut
			Inventory shortcut between 0 (a) and 25 (z)
		*/
		shortcut: number;

		get weight() { return this._weight; }
		get onThrowEffect() { return this.onThrowEffector ? this.onThrowEffector.effect : undefined; }
		get destroyedWhenThrown() { return this._destroyedWhenThrown; }
		get container() { return this._container; }

		constructor(weight: number, destroyedWhenThrown: boolean = false) {
			this.className = "Pickable";
			this._weight = weight;
			this._destroyedWhenThrown = destroyedWhenThrown;
		}

		setOnUseEffect(effect?: Effect, targetSelector?: TargetSelector, message?: string, destroyOnEffect: boolean = false) {
			this.onUseEffector = new Effector(effect, targetSelector, message, destroyOnEffect);
		}

		setOnUseEffector(effector: Effector) {
			this.onUseEffector = effector;
		}

		setOnThrowEffect(effect?: Effect, targetSelector?: TargetSelector, message?: string, destroyOnEffect: boolean = false) {
			this.onThrowEffector = new Effector(effect, targetSelector, message, destroyOnEffect);
		}

		setOnThrowEffector(effector: Effector) {
			this.onThrowEffector = effector;
		}

		/*
			Function: pick
			Put this actor in a container actor

			Parameters:
			owner - the actor owning this Pickable (the item)
			wearer - the container (the creature picking the item)

			Returns:
			true if the operation succeeded
		*/
		pick(owner: Actor, wearer: Actor): boolean {
			if ( wearer.container && wearer.container.add(owner, wearer)) {
				this._container = wearer.id;
				log(transformMessage("[The actor1] pick[s] [the actor2].", wearer, owner));

				if ( owner.equipment && wearer.container.isSlotEmpty(owner.equipment.getSlot())) {
					// equippable and slot is empty : auto-equip
					owner.equipment.equip(owner, wearer);
				}

				// remove this actor from item list
				Engine.instance.actorManager.removeItem(owner.id);
				return true;
			}
			// wearer is not a container or is full
			return false;
		}

		/*
			Function: drop
			Drop this actor on the ground.
			
			Parameters:
			owner - the actor owning this Pickable (the item)
			wearer - the container (the creature picking the item)
			pos - coordinate if the position is not the wearer's position
		*/
		drop(owner: Actor, wearer: Actor, pos?: Yendor.Position, verb: string = "drop", fromFire: boolean = false) {
			wearer.container.remove(owner, wearer);
			this._container = undefined;
			owner.x = pos ? pos.x : wearer.x;
			owner.y = pos ? pos.y : wearer.y;
			Engine.instance.actorManager.addItem(owner);
			if ( owner.equipment ) {
				owner.equipment.unequip(owner, wearer, true);
			}
			if (! fromFire) {
				log(wearer.getThename() + " " + verb + wearer.getVerbEnd() + owner.getthename());
			}
		}

		/*
			Function: use
			Use this item. If it has a onUseEffector, apply the effect and destroy the item.
			If it's an equipment, equip/unequip it.

			Parameters:
			owner - the actor owning this Pickable (the item)
			wearer - the container (the creature using the item)

			Returns:
			true if this effect was applied, false if it only triggered the tile picker						
		*/
		use(owner: Actor, wearer: Actor): boolean {
			if ( this.onUseEffector ) {
				return this.onUseEffector.apply(owner, wearer);
			}
			if ( owner.equipment ) {
				owner.equipment.use(owner, wearer);
			}
			return true;
		}

		useOnPos(owner: Actor, wearer: Actor, pos: Yendor.Position) {
			this.onUseEffector.applyOnPos(owner, wearer, pos);
		}

		/*
			Function: throw
			Throw this item. If it has a onUseEffector, apply the effect.

			Parameters:
			owner - the actor owning this Pickable (the item)
			wearer - the actor throwing the item
		*/
		throw(owner: Actor, wearer: Actor, maxRange?: number) {
			log("Left-click where to throw the " + owner.name
				+ ",\nor right-click to cancel.", Constants.LOG_WARN_COLOR);
			if (! maxRange) {
				var weight: number = owner.pickable.weight;
				maxRange = weight < 0.5 ? 3 : 15 / weight;
				if ( owner.equipment && owner.equipment.getSlot() === Constants.SLOT_QUIVER) {
					// increase projectile throw range
					maxRange *= 2.5;
				}
			}
			var data: TilePickerEventData = { range: maxRange, origin: new Yendor.Position(wearer.x, wearer.y) };
			Engine.instance.eventBus.publishEvent(EventType.PICK_TILE, data);
		}

		throwOnPos(owner: Actor, wearer: Actor, fromFire: boolean, pos: Yendor.Position, coef: number = 1) {
			owner.pickable.drop(owner, wearer, pos, "throw", fromFire);
			if (owner.pickable.onThrowEffector) {
				owner.pickable.onThrowEffector.apply(owner, wearer, pos, coef);
				if (owner.pickable.destroyedWhenThrown) {
					Engine.instance.actorManager.destroyActor(owner.id);
				}
			}
		}
	}

	/*
		Class: Equipment
		An item that can be equipped
	*/
	export class Equipment implements ActorFeature {
		className: string;
		private slot: string;
		private equipped: boolean = false;
		private defenseBonus: number = 0;

		constructor(slot: string, defenseBonus: number = 0) {
			this.className = "Equipment";
			this.slot = slot;
			this.defenseBonus = defenseBonus;
		}

		isEquipped(): boolean { return this.equipped; }

		getSlot(): string { return this.slot; }
		getDefenseBonus(): number { return this.defenseBonus; }

		/*
			Function: use
			Use (equip or unequip) this item.
			Parameters:
			owner: the actor owning this Equipment (the item)
			wearer: the container (the creature using this item)
		*/
		use(owner: Actor, wearer: Actor) {
			if ( this.equipped ) {
				this.unequip(owner, wearer);
			} else {
				this.equip(owner, wearer);
			}
		}

		equip(owner: Actor, wearer: Actor) {
			var previousEquipped = wearer.container.getFromSlot(this.slot);
			if ( previousEquipped ) {
				// first unequip previously equipped item
				previousEquipped.equipment.unequip( previousEquipped, wearer );
			} else if (this.slot === Constants.SLOT_BOTH_HANDS) {
				// unequip both hands when equipping a two hand weapon
				var rightHandItem = wearer.container.getFromSlot(Constants.SLOT_RIGHT_HAND);
				if ( rightHandItem ) {
					rightHandItem.equipment.unequip( rightHandItem, wearer );
				}
				var leftHandItem = wearer.container.getFromSlot(Constants.SLOT_LEFT_HAND);
				if ( leftHandItem ) {
					leftHandItem.equipment.unequip( leftHandItem, wearer );
				}
			} else if ( this.slot === Constants.SLOT_RIGHT_HAND || this.slot === Constants.SLOT_LEFT_HAND) {
				// unequip two hands weapon when equipping single hand weapon
				var twoHandsItem = wearer.container.getFromSlot(Constants.SLOT_BOTH_HANDS);
				if ( twoHandsItem) {
					twoHandsItem.equipment.unequip( twoHandsItem, wearer );
				}
			}
			this.equipped = true;
			if ( wearer === Engine.instance.actorManager.getPlayer()) {
				log(transformMessage("[The actor1] equip[s] [the actor2] on [its] " + this.slot, wearer, owner), 0xFFA500 );
			}
		}

		unequip(owner: Actor, wearer: Actor, beforeDrop: boolean = false) {
			this.equipped = false;
			if ( !beforeDrop && wearer === Engine.instance.actorManager.getPlayer()) {
				log(transformMessage("[The actor1] unequip[s] [the actor2] from [its] " + this.slot, wearer, owner), 0xFFA500 );
			}
		}
	}

	/*
		class: Ranged
		an item that throws other items. It's basically a shortcut to throw projectile items with added damages.
		For example instead of [t]hrowing an arrow by hand, you equip a bow and [f]ire it. The result is the same
		except that :
		- the arrow will deal more damages
		- the action will take more time because you need time to load the projectile on the weapon

		The same arrow will deal different damages depending on the bow you use.
		A ranged weapon can throw several type of projectiles (for example dwarven and elven arrows). 
		The projectileType property makes it possible to look for an adequate item in the inventory.
		If a compatible type is equipped (on quiver), it will be used. Else the first compatible item will be used.
	*/
	export class Ranged implements ActorFeature {
		className: string;
		/*
			Property: _damageCoef
			Damage multiplicator when using this weapon to fire a projectile.
		*/
		private _damageCoef: number;
		/*
			Property: _projectileType
			The actor type that this weapon can fire.
		*/
		private _projectileType: ActorClass;
		/*
			Property: _loadTime
			Time to load this weapon with a projectile
		*/
		private _loadTime: number;
		/*
			Property:  _range
			This weapon's maximum firing distance
		*/
		private _range: number;

		private _projectile: Actor;

		get loadTime() { return this._loadTime; }
		get damageCoef() { return this._damageCoef; }
		get projectileType() { return this._projectileType; }
		get projectile() { return this._projectile; }
		get range() { return this._range; }

		constructor(_damageCoef: number, projectileTypeName: string, loadTime: number, range: number) {
			this.className = "Ranged";
			this._damageCoef = _damageCoef;
			this._projectileType  = ActorClass.buildClassHierarchy("weapon|projectile|" + projectileTypeName);
			this._loadTime = loadTime;
			this._range = range;
		}

		fire(owner: Actor, wearer: Actor) {
			this._projectile = this.findCompatibleProjectile(wearer);
			if (! this._projectile) {
				// no projectile found. cannot fire
				if ( wearer === Engine.instance.actorManager.getPlayer()) {
					log("No " + this._projectileType.name + " available.", 0xFF0000);
					return;
				}
			}
			log(transformMessage("[The actor1] fire[s] [a actor2].", wearer, this._projectile));
			this._projectile.pickable.throw(this._projectile, wearer, this._range);
		}

		private findCompatibleProjectile(wearer: Actor): Actor {
			var projectile = undefined;
			if ( wearer.container ) {
				// if a projectile type is selected (equipped in quiver), use it
				projectile = wearer.container.getFromSlot(Constants.SLOT_QUIVER);
				if (! projectile || ! projectile.isA(this._projectileType)) {
					// else use the first compatible projectile
					projectile = undefined;
					var n: number = wearer.container.size();
					for ( var i: number = 0; i < n; ++i) {
						var item: Actor = wearer.container.get(i);
						if ( item.isA(this._projectileType)) {
							projectile = item;
							break;
						}
					}
				}
			}
			return projectile;
		}
	}

	/*
		Class: Magic
		Item with magic properties (staff wands, ...)
	*/
	export class Magic implements ActorFeature {
		className: string;
		private _maxCharges: number;
		private _charges: number;
		private onFireEffector: Effector;

		get maxCharges() { return this._maxCharges; }
		set maxCharges(newValue: number) { this._maxCharges = newValue; }

		constructor(maxCharges: number) {
			this.className = "Magic";
			this._maxCharges = maxCharges;
			this._charges = this._maxCharges;
		}

		setFireEffector(effect: Effect, targetSelector: TargetSelector, message?: string) {
			this.onFireEffector = new Effector(effect, targetSelector, message);
		}

		/*
			Function: zap
			Use the magic power of the item

			Returns:
			true if this effect was applied, false if it only triggered the tile picker
		*/
		zap(owner: Actor, wearer: Actor): boolean {
			if ( this._charges === 0 ) {
				log(transformMessage("[The actor1's] " + owner.name + " is uncharged", wearer));
			} else if ( this.onFireEffector ) {
				if (this.onFireEffector.apply(owner, wearer)) {
					this.doPostZap(owner, wearer);
					return true;
				}
			}
			return false;
		}

		zapOnPos(owner: Actor, wearer: Actor, pos: Yendor.Position) {
			if (this.onFireEffector.applyOnPos(owner, wearer, pos)) {
				this.doPostZap(owner, wearer);
			} else {
				// TODO fail message
			}
		}

		private doPostZap(owner: Actor, wearer: Actor) {
			this._charges --;
			if ( this._charges > 0 ) {
				log("Remaining charges : " + this._charges );
			} else {
				log(transformMessage("[The actor1's] " + owner.name + " is uncharged", wearer));
			}
		}
	}

	export interface LeverAction {
		(): void;
	}

	/*
		Class: Lever
		Can be activated with E key when standing on an adjacent cell.
		This can be used to open/close doors, turn wall torchs on/off, or implement actual levers...
	*/
	export class Lever implements ActorFeature {
		className: string;
		action: LeverAction;
		constructor(action: LeverAction) {
			this.className = "Lever";
			this.action = action;
		}

		activate() {
			this.action();
		}
	}

	/*
		Class: Door
		Can be open/closed. Does not necessarily block sight (portcullis).
	*/
	export class Door implements ActorFeature {
		className: string;
		private closed: boolean = true;
		private seeThrough: boolean;
		constructor(seeThrough: boolean) {
			this.className = "Door";
			this.seeThrough = seeThrough;
		}

		isClosed(): boolean { return this.closed; }

		open(owner: Actor) {
			this.closed = false;
			owner.ch = "/";
			owner.blocks = false;
			owner.transparent = true;
			Engine.instance.map.setWalkable(owner.x, owner.y, true);
			Engine.instance.map.setTransparent(owner.x, owner.y, true);
			log(transformMessage("[The actor1] is open.", owner));
		}

		close(owner: Actor) {
			// don't close if there's a living actor on the cell
			if (! Engine.instance.map.canWalk(owner.x, owner.y)) {
				log(transformMessage("Cannot close [the actor1]", owner));
				return;
			}
			this.closed = true;
			owner.ch = "+";
			owner.blocks = true;
			owner.transparent = this.seeThrough;
			Engine.instance.map.setWalkable(owner.x, owner.y, false);
			Engine.instance.map.setTransparent(owner.x, owner.y, this.seeThrough);
			log(transformMessage("[The actor1] is closed.", owner));
		}

		openOrClose(owner: Actor) {
			if ( this.closed ) {
				this.open(owner);
			} else {
				this.close(owner);
			}
		}
	}
}
