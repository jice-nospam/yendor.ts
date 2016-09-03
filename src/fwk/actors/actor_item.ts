/**
	Section: items
*/
import * as Core from "../core/main";
import * as Umbra from "../umbra/main";
import * as Map from "../map/main";
import {Actor, SpecialActors} from "./actor";
import {ActivableType, DestructibleDef, AttackerDef, ContainerDef, PickableDef, EquipmentDef, RangedDef, MagicDef, ActivableDef, DoorDef} from "./actor_def";
import {ActorFeature, ActorId} from "./actor_feature";
import {transformMessage} from "./base";
import {Effector, Effect, TargetSelector} from "./actor_effect";
import {ActorFactory} from "./actor_factory";
import {EVENT_LIGHT_ONOFF, SLOT_BOTH_HANDS, SLOT_LEFT_HAND, SLOT_RIGHT_HAND, SLOT_QUIVER, PLAYER_WALK_TIME} from "./base";

/********************************************************************************
 * Group: items
 ********************************************************************************/

/**
    Class: Destructible
    Something that can take damages and heal/repair.
*/
export class Destructible implements ActorFeature {
    private _maxHp: number;
    defense: number = 0;
    hp: number;
    private corpseName: string;
    private corpseChar: string;
    private wasBlocking: boolean;
    private wasTransparent: boolean;
    private deathMessage: string;
    xp: number = 0;

    constructor(def: DestructibleDef) {
        if (def) {
            this.hp = def.healthPoints;
            this._maxHp = def.healthPoints;
            if (def.defense) {
                this.defense = def.defense;
            }
            this.corpseName = def.corpseName;
            this.corpseChar = def.corpseChar;
            this.deathMessage = def.deathMessage;
            if (def.xp) {
                this.xp = def.xp;
            }
        }
    }

    get maxHp() { return this._maxHp; }

    isDead(): boolean {
        return this.hp <= 0;
    }

    public computeRealDefense(owner: Actor): number {
        let realDefense = this.defense;
        if (owner.container) {
            // add bonus from equipped items
            // TODO shield can block only one attack per turn
            let n: number = owner.container.size();
            for (let i: number = 0; i < n; i++) {
                let item: Actor = owner.container.get(i);
                if (item.equipment && item.equipment.isEquipped()) {
                    realDefense += item.equipment.getDefenseBonus();
                }
            }
        }
        return realDefense;
    }

    /**
        Function: takeDamage
        Deals damages to this actor. If health points reach 0, call the die function.

        Parameters:
        owner - the actor owning this Destructible
        damage - amount of damages to deal

        Returns:
        the actual amount of damage taken
    */
    takeDamage(owner: Actor, damage: number): number {
        if (this.isDead()) {
            return;
        }
        damage -= this.computeRealDefense(owner);
        if (damage > 0) {
            this.hp -= damage;
            if (this.isDead()) {
                this.hp = 0;
                this.die(owner);
            }
        } else {
            damage = 0;
        }
        return damage;
    }

    /**
        Function: heal
        Recover some health points. Can resurrect a dead destructible

        Parameters:
        owner - the actor owning this Destructible
        amount - amount of health points to recover

        Returns:
        the actual amount of health points recovered
    */
    heal(owner: Actor, amount: number): number {
        let wasDead: boolean = this.isDead();
        this.hp += amount;
        if (this.hp > this._maxHp) {
            amount -= this.hp - this._maxHp;
            this.hp = this._maxHp;
        }
        if (wasDead && this.hp > 0) {
            this.resurrect(owner);
        }
        return amount;
    }

    private swapNameAndCorpseName(owner: Actor) {
        if ( this.corpseName ) {
            let tmp: string = owner.name;
            owner.name = this.corpseName;
            this.corpseName = tmp;
        }
        if ( this.corpseChar ) {
            let tmp: string = owner.ch;
            owner.ch = this.corpseChar;
            this.corpseChar = owner.ch;
        }

    }

    private resurrect(owner: Actor) {
        this.swapNameAndCorpseName(owner);
        owner.blocks = this.wasBlocking;
        owner.transparent = this.wasTransparent;
        if (!owner.transparent) {
            Map.Map.current.setTransparent(owner.pos.x, owner.pos.y, false);
        }
        if ( owner.activable ) {
            if (!owner.equipment || owner.equipment.isEquipped()) {
                owner.activable.activate(owner);
            }
        }
    }

    /**
        Function: die
        Turn this actor into a corpse

        Parameters:
        owner - the actor owning this Destructible
    */
    die(owner: Actor) {
        if (this.deathMessage) {
            let wearer: Actor = owner.getWearer();
            if ( wearer ) {
                Umbra.logger.info(transformMessage(this.deathMessage, owner, wearer));
            }
        }
        if (!this.corpseName) {
            owner.destroy();
            return;
        }
        // save name in case of resurrection
        this.swapNameAndCorpseName(owner);
        this.wasBlocking = owner.blocks;
        this.wasTransparent = owner.transparent;
        owner.blocks = false;
        if (!owner.transparent) {
            Map.Map.current.setTransparent(owner.pos.x, owner.pos.y, true);
            owner.transparent = true;
        }
        if (owner.activable) {
            owner.activable.deactivate(owner);
        }
    }
}

/**
    Class: Attacker
    An actor that can deal damages to another one
*/
export class Attacker implements ActorFeature {
    /**
        Property: power
        Amount of damages given
    */
    power: number;
    private _attackTime: number = PLAYER_WALK_TIME;

    constructor(def: AttackerDef) {
        if (def) {
            this.power = def.hitPoints;
            this._attackTime = def.attackTime;
        }
    }

    get attackTime() { return this._attackTime; }

    /**
        Function: attack
        Deal damages to another actor

        Parameters:
        owner - the actor owning this Attacker
        target - the actor being attacked
    */
    attack(owner: Actor, target: Actor) {
        if (target.destructible && !target.destructible.isDead()) {
            let damage = this.power - target.destructible.computeRealDefense(target);
            let msg: string = "[The actor1] attack[s] [the actor2]";
            let logLevel: Umbra.LogLevel = Umbra.LogLevel.INFO;
            let gainedXp: number = 0;
            if (damage >= target.destructible.hp) {
                msg += " and kill[s] [it2] !";
                logLevel = Umbra.LogLevel.WARN;
                if (owner.xpHolder && target.destructible.xp) {
                    msg += "\n[The actor2] [is2] dead. [The actor1] gain[s] " + target.destructible.xp + " xp.";
                    gainedXp = target.destructible.xp;
                }
            } else if (damage > 0) {
                msg += " for " + damage + " hit points.";
                logLevel = Umbra.LogLevel.WARN;
            } else {
                msg += " but it has no effect!";
            }
            Umbra.logger.log(logLevel, transformMessage(msg, owner, target));
            target.destructible.takeDamage(target, this.power);
            if (gainedXp > 0) {
                owner.xpHolder.addXp(owner, gainedXp);
            }
        }
    }
}

/********************************************************************************
 * Group: inventory
 ********************************************************************************/

/**
     Interface: ContainerListener
        Something that must be notified when an item is added or removed from the container
*/
export interface ContainerListener {
    onAdd(itemId: ActorId, container: Container, owner: Actor): void;
    onRemove(itemId: ActorId, container: Container, owner: Actor): void;
}
/**
     Class: Container
        An actor that can contain other actors :
        - creatures with inventory
        - chests, barrels, ...
*/
export class Container implements ActorFeature {
    private _capacity: number = 0;
    private actorIds: ActorId[] = [];
    private __listener: ContainerListener;

    get capacity() { return this._capacity; }

    constructor(def: ContainerDef, listener?: ContainerListener) {
        this.__listener = listener;
        if (def) {
            this._capacity = def.capacity;
        }
    }

    size(): number { return this.actorIds.length; }

    // used to rebuilt listener link after loading
    setListener(listener: ContainerListener) {
        this.__listener = listener;
    }

    get(index: number): Actor {
        return Actor.map[this.actorIds[index]];
    }

    contains(actorId: ActorId): boolean {
        for (let i: number = 0, n: number = this.size(); i < n; i++) {
            if (actorId === this.actorIds[i]) {
                return true;
            }
        }
        return false;
    }

    getFromSlot(slot: string): Actor {
        for (let i: number = 0, n: number = this.size(); i < n; i++) {
            let actor: Actor = this.get(i);
            if (actor.equipment && actor.equipment.isEquipped() && actor.equipment.getSlot() === slot) {
                return actor;
            }
        }
        return undefined;
    }

    isSlotEmpty(slot: string): boolean {
        if (this.getFromSlot(slot)) {
            return false;
        }
        if (slot === SLOT_RIGHT_HAND || slot === SLOT_LEFT_HAND) {
            if (this.getFromSlot(SLOT_BOTH_HANDS)) {
                return false;
            }
        } else if (slot === SLOT_BOTH_HANDS) {
            if (this.getFromSlot(SLOT_LEFT_HAND) || this.getFromSlot(SLOT_RIGHT_HAND)) {
                return false;
            }
        }
        return true;
    }

    canContain(item: Actor): boolean {
        if (!item || !item.pickable) {
            return false;
        }
        return this.computeTotalWeight() + item.pickable.weight <= this._capacity;
    }

    computeTotalWeight(): number {
        let weight: number = 0;
        this.actorIds.forEach((actorId: ActorId) => {
            let actor: Actor = Actor.map[actorId];
            if (actor.pickable) {
                weight += actor.pickable.weight;
            }
        });
        return weight;
    }

    /**
             Function: add
            add a new actor in this container

            Parameters:
            actor - the actor to add

            Returns:
            false if the operation failed because the container is full
    */
    add(actor: Actor, owner: Actor) {
        let weight: number = this.computeTotalWeight();
        if (actor.pickable.weight + weight > this._capacity) {
            return false;
        }
        this.actorIds.push(actor.id);
        actor.pickable.shortcut = undefined;
        if (this.__listener) {
            this.__listener.onAdd(actor.id, this, owner);
        }
        return true;
    }

    /**
             Function: remove
            remove an actor from this container

            Parameters:
            actorId - the id of the actor to remove
            owner - the actor owning the container
    */
    remove(actorId: ActorId, owner: Actor) {
        let idx: number = this.actorIds.indexOf(actorId);
        if (idx !== -1) {
            this.actorIds.splice(idx, 1);
            if (this.__listener) {
                this.__listener.onRemove(actorId, this, owner);
            }
        }
    }
}

/**
    Class: Pickable
    An actor that can be picked by a creature
*/
export class Pickable implements ActorFeature {
    /**
        Property: onUseEffector
        What happens when this item is used.
    */
    private onUseEffector: Effector;
    /**
        Property: onThrowEffector
        What happens when this item is thrown.
    */
    private onThrowEffector: Effector;
    private _weight: number;
    private _destroyedWhenThrown: boolean = false;
    private _containerId: ActorId;
    /**
        Property: _shortcut
        Inventory shortcut between 0 (a) and 25 (z)
    */
    shortcut: number;

    get weight() { return this._weight; }
    get onThrowEffect() { return this.onThrowEffector ? this.onThrowEffector.effect : undefined; }
    get destroyedWhenThrown() { return this._destroyedWhenThrown; }
    get containerId() { return this._containerId; }
    getOnThrowEffector(): Effector {
        return this.onThrowEffector;
    }
    getOnUseEffector(): Effector {
        return this.onUseEffector;
    }

    constructor(def: PickableDef) {
        if (def) {
            this._weight = def.weight;
            if (def.destroyedWhenThrown) {
                this._destroyedWhenThrown = def.destroyedWhenThrown;
            }
            if (def.onUseEffector) {
                this.onUseEffector = ActorFactory.createEffector(def.onUseEffector);
            }
            if (def.onThrowEffector) {
                this.onThrowEffector = ActorFactory.createEffector(def.onThrowEffector);
            }
        }
    }

    setOnUseEffect(effect?: Effect, targetSelector?: TargetSelector, message?: string, destroyOnEffect: boolean = false) {
        this.onUseEffector = new Effector(effect, targetSelector, message, destroyOnEffect);
    }

    setOnThrowEffect(effect?: Effect, targetSelector?: TargetSelector, message?: string, destroyOnEffect: boolean = false) {
        this.onThrowEffector = new Effector(effect, targetSelector, message, destroyOnEffect);
    }

    /**
        Function: pick
        Put this actor in a container actor

        Parameters:
        owner - the actor owning this Pickable (the item)
        wearer - the container (the creature picking the item)

        Returns:
        true if the operation succeeded
    */
    pick(owner: Actor, wearer: Actor): boolean {
        if (wearer.container && wearer.container.add(owner, wearer)) {
            this._containerId = wearer.id;
            Umbra.logger.info(transformMessage("[The actor1] pick[s] [the actor2].", wearer, owner));

            if (owner.equipment && wearer.container.isSlotEmpty(owner.equipment.getSlot())) {
                // equippable and slot is empty : auto-equip
                owner.equipment.equip(owner, wearer);
            } else if (owner.equipment && owner.activable && owner.activable.isActive()) {
                // picking an equipable, active item and not equipping it turns it off
                owner.activable.deactivate(owner);
            }
            return true;
        }
        // wearer is not a container or is full
        return false;
    }

    /**
        Function: drop
        Drop this actor on the ground.

        Parameters:
        owner - the actor owning this Pickable (the item)
        wearer - the container (the creature picking the item)
        pos - coordinate if the position is not the wearer's position
        verb - verb to use in the message (drop/throw/...)
        withMessage - whether a message should be logged
    */
    drop(owner: Actor, wearer: Actor, pos?: Core.Position, verb: string = "drop", withMessage: boolean = false) {
        wearer.container.remove(owner.id, wearer);
        this._containerId = undefined;
        owner.pos.x = pos ? pos.x : wearer.pos.x;
        owner.pos.y = pos ? pos.y : wearer.pos.y;
        owner.register();
        if (owner.equipment) {
            owner.equipment.unequip(owner, wearer, true);
        }
        if (!withMessage) {
            Umbra.logger.info(wearer.getThename() + " " + verb + wearer.getVerbEnd() + owner.getthename());
        }
    }

    /**
        Function: use
        Use this item. If it has a onUseEffector, apply the effect and destroy the item.
        If it's an equipment, equip/unequip it.

        Parameters:
        owner - the actor owning this Pickable (the item)
        wearer - the container (the creature using the item)

        Returns:
        true if this effect was applied, false if it only triggered the tile picker
    */
    use(owner: Actor, wearer: Actor): Promise<boolean> {
        if (this.onUseEffector) {
            return this.onUseEffector.apply(owner, wearer);
        } else if (owner.equipment) {
            owner.equipment.use(owner, wearer);
        } else if (owner.activable) {
            owner.activable.activate(owner);
        }
        return new Promise<boolean>((resolve) => {
            resolve(true);
        });
    }

    /**
        Function: throw
        Throw this item. If it has a onThrowEffector, apply the effect.

        Parameters:
        owner - the actor owning this Pickable (the item)
        wearer - the actor throwing the item
        maxRange - maximum distance where the item can be thrown. If not defined, max range is computed from the item's weight
    */
    throw(owner: Actor, wearer: Actor, maxRange?: number): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!maxRange) {
                maxRange = owner.computeThrowRange(wearer);
            }
            // create a Core.Position instead of using directly wearer to avoid TilePicker -> actor dependency which would break json serialization
            wearer.ai.tilePicker.pickATile("Left-click where to throw the " + owner.name
                + ",\nor right-click to cancel.", new Core.Position(wearer.pos.x, wearer.pos.y), maxRange).then((pos:Core.Position) => {
                    this.throwOnPos(owner, wearer, false, pos);
                    resolve();
            });
        });
    }

    private throwOnPos(owner: Actor, wearer: Actor, fromFire: boolean, pos: Core.Position, coef: number = 1) {
        owner.pickable.drop(owner, wearer, pos, "throw", !fromFire);
        if (owner.pickable.onThrowEffector) {
            owner.pickable.onThrowEffector.apply(owner, wearer, pos, coef);
            if (owner.pickable.destroyedWhenThrown) {
                owner.destroy();
            }
        }
    }
}

/**
    Class: Equipment
    An item that can be equipped
*/
export class Equipment implements ActorFeature {
    private slot: string;
    private equipped: boolean = false;
    private defenseBonus: number = 0;

    constructor(def: EquipmentDef) {
        if (def) {
            this.slot = def.slot;
            if (def.defense) {
                this.defenseBonus = def.defense;
            }
        }
    }

    isEquipped(): boolean { return this.equipped; }

    getSlot(): string { return this.slot; }
    getDefenseBonus(): number { return this.defenseBonus; }

    /**
        Function: use
        Use (equip or unequip) this item.
        Parameters:
        owner: the actor owning this Equipment (the item)
        wearer: the container (the creature using this item)
    */
    use(owner: Actor, wearer: Actor) {
        if (this.equipped) {
            this.unequip(owner, wearer);
        } else {
            this.equip(owner, wearer);
        }
    }

    equip(owner: Actor, wearer: Actor) {
        let previousEquipped = wearer.container.getFromSlot(this.slot);
        if (previousEquipped) {
            // first unequip previously equipped item
            previousEquipped.equipment.unequip(previousEquipped, wearer);
        } else if (this.slot === SLOT_BOTH_HANDS) {
            // unequip both hands when equipping a two hand weapon
            let rightHandItem = wearer.container.getFromSlot(SLOT_RIGHT_HAND);
            if (rightHandItem) {
                rightHandItem.equipment.unequip(rightHandItem, wearer);
            }
            let leftHandItem = wearer.container.getFromSlot(SLOT_LEFT_HAND);
            if (leftHandItem) {
                leftHandItem.equipment.unequip(leftHandItem, wearer);
            }
        } else if (this.slot === SLOT_RIGHT_HAND || this.slot === SLOT_LEFT_HAND) {
            // unequip two hands weapon when equipping single hand weapon
            let twoHandsItem = wearer.container.getFromSlot(SLOT_BOTH_HANDS);
            if (twoHandsItem) {
                twoHandsItem.equipment.unequip(twoHandsItem, wearer);
            }
        }
        this.equipped = true;
        if (wearer === Actor.specialActors[SpecialActors.PLAYER]) {
            Umbra.logger.warn(transformMessage("[The actor1] equip[s] [the actor2] on [its] " + this.slot, wearer, owner));
        }
        if (owner.activable && !owner.activable.isActive()) {
            owner.activable.activate(owner);
        }
    }

    unequip(owner: Actor, wearer: Actor, beforeDrop: boolean = false) {
        this.equipped = false;
        if (!beforeDrop && wearer === Actor.specialActors[SpecialActors.PLAYER]) {
            Umbra.logger.warn(transformMessage("[The actor1] unequip[s] [the actor2] from [its] " + this.slot, wearer, owner));
        }
        if (!beforeDrop && owner.activable) {
            owner.activable.deactivate(owner);
        }
    }
}

/**
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
    /**
        Property: _damageCoef
        Damage multiplicator when using this weapon to fire a projectile.
    */
    private _damageCoef: number;
    /**
        Property: _projectileType
        The actor type that this weapon can fire.
    */
    private _projectileType: string;
    /**
        Property: _loadTime
        Time to load this weapon with a projectile
    */
    private _loadTime: number;
    /**
        Property:  _range
        This weapon's maximum firing distance
    */
    private _range: number;

    private projectileId: ActorId;

    get loadTime() { return this._loadTime; }
    get damageCoef() { return this._damageCoef; }
    get projectileType() { return this._projectileType; }
    get projectile() { return this.projectileId ? Actor.map[this.projectileId] : undefined; }
    get range() { return this._range; }

    constructor(def: RangedDef) {
        if (def) {
            this._damageCoef = def.damageCoef;
            this._projectileType = def.projectileType;
            this._loadTime = def.loadTime;
            this._range = def.range;
        }
    }

    fire(owner: Actor, wearer: Actor): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            let projectile: Actor = this.findCompatibleProjectile(wearer);
            if (!projectile) {
                // no projectile found. cannot fire
                if (wearer === Actor.specialActors[SpecialActors.PLAYER]) {
                    Umbra.logger.warn("No " + this._projectileType + " available.");
                    resolve(false);
                }
            }
            this.projectileId = projectile.id;
            Umbra.logger.info(transformMessage("[The actor1] fire[s] [a actor2].", wearer, projectile));
            projectile.pickable.throw(projectile, wearer, this._range).then(() => {
                resolve(true);
            });
        });
    }

    private findCompatibleProjectile(wearer: Actor): Actor {
        let projectile: Actor = undefined;
        if (wearer.container) {
            // if a projectile type is selected (equipped in quiver), use it
            projectile = wearer.container.getFromSlot(SLOT_QUIVER);
            if (!projectile || !projectile.isA(this._projectileType)) {
                // else use the first compatible projectile
                projectile = undefined;
                let n: number = wearer.container.size();
                for (let i: number = 0; i < n; ++i) {
                    let item: Actor = wearer.container.get(i);
                    if (item.isA(this._projectileType)) {
                        projectile = item;
                        break;
                    }
                }
            }
        }
        return projectile;
    }
}

/**
    Class: Magic
    Item with magic properties (staff wands, ...)
*/
export class Magic implements ActorFeature {
    maxCharges: number;
    private _charges: number;
    private onFireEffector: Effector;

    get charges() { return this._charges; }

    constructor(def: MagicDef) {
        if (def) {
            this.maxCharges = def.charges;
            this._charges = def.charges;
            this.onFireEffector = ActorFactory.createEffector(def.onFireEffect);
        }
    }

    /**
        Function: zap
        Use the magic power of the item

        Returns:
        true if this effect was applied, false if it only triggered the tile picker
    */
    zap(owner: Actor, wearer: Actor): Promise<boolean> {
        if (this._charges === 0) {
            Umbra.logger.info(transformMessage("[The actor1's] " + owner.name + " is uncharged", wearer));
        } else if (this.onFireEffector) {
            this.onFireEffector.apply(owner, wearer).then((applied: boolean) => {
                if ( applied ) {
                    this.doPostZap(owner, wearer);
                }
                return new Promise<boolean>((resolve) => {
                    resolve(applied);
                });
            });
        }
        return new Promise<boolean>((resolve) => {
            resolve(false);
        });
    }

    private doPostZap(owner: Actor, wearer: Actor) {
        this._charges--;
        if (this._charges > 0) {
            Umbra.logger.info("Remaining charges : " + this._charges);
        } else {
            Umbra.logger.info(transformMessage("[The actor1's] " + owner.name + " is uncharged", wearer));
        }
    }
}

/**
    Class: Activable
    Something that can be turned on/off
*/
export class Activable implements ActorFeature {
    private active: boolean = false;
    private activateMessage: string;
    private deactivateMessage: string;
    private onActivateEffector: Effector;
    private type: ActivableType;

    constructor(def: ActivableDef) {
        if ( def ) {
            this.init(def);
        }
    }
    init(def: ActivableDef) {
        if ( def ) {
            this.activateMessage = def.activateMessage;
            this.deactivateMessage = def.deactivateMessage;
            this.type = def.type;
            if ( def.onActivateEffector ) {
                this.onActivateEffector = ActorFactory.createEffector(def.onActivateEffector);
            }
            if ( def.activeByDefault ) {
                this.active = true;
            }
        }
    }

    isActive(): boolean { return this.active; }

    private displayState(owner: Actor) {
        if (this.isActive()) {
            if ( this.activateMessage ) {
                Umbra.logger.info(transformMessage(this.activateMessage, owner));
            }
        } else if ( this.deactivateMessage ) {
            Umbra.logger.info(transformMessage(this.deactivateMessage, owner));
        }
    }

    activate(owner: Actor, activator?: Actor): boolean {
        if (owner.lock && owner.lock.isLocked()) {
            // unlock if the activator has the key
            let keyId = owner.lock.keyId;
            if (activator && activator.container && activator.container.contains(keyId)) {
                owner.lock.unlock(keyId);
                activator.container.remove(keyId, activator);
                Actor.map[keyId].destroy();
                Umbra.logger.info(transformMessage("[The actor1] unlock[s] [the actor2].", activator, owner));
            } else {
                Umbra.logger.info(transformMessage("[The actor1] is locked.", owner));
                return false;
            }
        }
        if ( owner.destructible && owner.destructible.isDead()) {
            return false;
        }
        this.active = true;
        this.displayState(owner);
        if ( this.type !== ActivableType.SINGLE ) {
            if (owner.light) {
                Umbra.EventManager.publishEvent(EVENT_LIGHT_ONOFF, owner);
            }
        } else {
            // SINGLE is immediately deactivated
            this.active = false;
        }
        if ( this.onActivateEffector ) {
            this.onActivateEffector.apply(owner, activator);
        }
        return true;
    }

    deactivate(owner: Actor): boolean {
        this.active = false;
        this.displayState(owner);
        if (owner.light) {
            Umbra.EventManager.publishEvent(EVENT_LIGHT_ONOFF, owner);
        }
        return true;
    }

    switch(owner: Actor, activator?: Actor): boolean {
        if (this.active) {
            return this.deactivate(owner);
        } else {
            return this.activate(owner, activator);
        }
    }
}

/**
    Class: Lever
    An Activable that controls a remote Activable
*/
export class Lever extends Activable {
    actorId: ActorId;

    constructor(def: ActivableDef) {
        super(def);
    }

    activate(owner: Actor, activator?: Actor): boolean {
        let mechanism = this.actorId !== undefined ? Actor.map[this.actorId] : undefined;
        return mechanism && mechanism.activable ? mechanism.activable.activate(mechanism, activator) : false;
    }

    deactivate(owner: Actor, activator?: Actor): boolean {
        let mechanism = this.actorId !== undefined ? Actor.map[this.actorId] : undefined;
        return mechanism && mechanism.activable ? mechanism.activable.deactivate(mechanism) : false;
    }

    switch(owner: Actor, activator?: Actor): boolean {
        let mechanism = this.actorId !== undefined ? Actor.map[this.actorId] : undefined;
        return mechanism && mechanism.activable ? mechanism.activable.switch(mechanism, activator) : false;
    }
}

/**
    Class: Lockable
    Something that can be locked/unlocked
*/
export class Lockable implements ActorFeature {
    private locked: boolean = true;
    private _keyId: ActorId;
    constructor(keyId: ActorId) {
        this._keyId = keyId;
    }

    isLocked(): boolean { return this.locked; }
    get keyId() { return this._keyId; }

    unlock(keyId: ActorId): boolean {
        if (this._keyId === keyId) {
            this.locked = false;
            return true;
        }
        return false;
    }
    lock() {
        this.locked = true;
    }
}

/**
    Class: Door
    Can be open/closed. Does not necessarily block sight (portcullis).
*/
export class Door extends Activable {
    private seeThrough: boolean;
    constructor(def: DoorDef) {
        super(def);
        if (def) {
            this.seeThrough = def.seeThrough;
        }
    }

    activate(owner: Actor, activator?: Actor): boolean {
        if (super.activate(owner, activator)) {
            let currentMap: Map.Map = Map.Map.current;
            owner.ch = "/";
            owner.blocks = false;
            owner.transparent = true;
            currentMap.setWalkable(owner.pos.x, owner.pos.y, true);
            currentMap.setTransparent(owner.pos.x, owner.pos.y, true);
            return true;
        }
        return false;
    }

    deactivate(owner: Actor): boolean {
        // don't close if there's a living actor on the cell
        let currentMap: Map.Map = Map.Map.current;
        if (!currentMap.canWalk(owner.pos.x, owner.pos.y)) {
            Umbra.logger.info(transformMessage("Cannot close [the actor1]", owner));
            return;
        }
        super.deactivate(owner);
        owner.ch = "+";
        owner.blocks = true;
        owner.transparent = this.seeThrough;
        currentMap.setWalkable(owner.pos.x, owner.pos.y, false);
        currentMap.setTransparent(owner.pos.x, owner.pos.y, this.seeThrough);
        return true;
    }
}
