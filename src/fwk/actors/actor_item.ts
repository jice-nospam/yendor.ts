/**
 * Section: items
 */
import * as Core from "../core/main";
import * as Umbra from "../umbra/main";
import * as Map from "../map/main";
import {Actor, SpecialActorsEnum, IProbabilityMap} from "./actor";
import {IActorDef, ActivableTypeEnum, IDestructibleDef, IAttackerDef, IContainerDef, IPickableDef, IEquipmentDef,
    IRangedDef, IMagicDef, IActivableDef, IDoorDef} from "./actor_def";
import {IActorFeature, ActorId} from "./actor_feature";
import {transformMessage} from "./base";
import {Effector, IEffect, TargetSelector} from "./actor_effect";
import {ActorFactory} from "./actor_factory";
import {EVENT_LIGHT_ONOFF, SLOT_BOTH_HANDS, SLOT_LEFT_HAND, SLOT_RIGHT_HAND,
    SLOT_QUIVER, PLAYER_WALK_TIME} from "./base";

/**
 * =============================================================================
 * Group: items
 * =============================================================================
 */

/**
 * Class: Destructible
 * Something that can take damages and heal/repair.
 */
export class Destructible implements IActorFeature {
    public defense: number = 0;
    public hp: number;
    public xp: number = 0;

    private _maxHp: number;
    private corpseName: string;
    private corpseChar: string;
    private wasBlocking: boolean;
    private wasTransparent: boolean;
    private deathMessage: string;
    private qualifiers: string[];
    private loot: IProbabilityMap;

    constructor(def: IDestructibleDef, template: Destructible) {
        if ( template ) {
            this.hp = template.hp;
            this._maxHp = template._maxHp;
            this.defense = template.defense;
            this.corpseChar = template.corpseChar;
            this.corpseName = template.corpseName;
            this.deathMessage = template.deathMessage;
            this.xp = template.xp;
            this.qualifiers = template.qualifiers;
            this.loot = template.loot;
        }
        if (def) {
            if ( def.healthPoints ) {
                this.hp = def.healthPoints;
                this._maxHp = def.healthPoints;
            }
            if (def.defense) {
                this.defense = def.defense;
            }
            if ( def.corpseName ) {
                this.corpseName = def.corpseName;
            }
            if (def.corpseChar) {
                this.corpseChar = def.corpseChar;
            }
            if (def.deathMessage) {
                this.deathMessage = def.deathMessage;
            }
            if (def.xp) {
                this.xp = def.xp;
            }
            if ( def.qualifiers) {
                this.qualifiers = def.qualifiers;
            }
            if ( def.loot) {
                this.loot = def.loot;
            }
        }
    }

    get maxHp() { return this._maxHp; }

    public isDead(): boolean {
        return this.hp <= 0;
    }

    public getQualifiedName(owner: Actor, count: number = 1): string {
        if (this.isDead() || this.qualifiers === undefined) {
            return owner.getname(count);
        }
        let coef: number = Math.floor(this.qualifiers.length * this.hp / this._maxHp);
        if ( coef === this.qualifiers.length ) {
            coef = this.qualifiers.length - 1;
        }
        return this.qualifiers[coef] + owner.getname(count);
    }

    public computeRealDefense(owner: Actor): number {
        let realDefense = this.defense;
        if (owner.container) {
            // add bonus from equipped items
            // TODO shield can block only one attack per turn
            let n: number = owner.container.size();
            for (let i: number = 0; i < n; i++) {
                let item: Actor|undefined = owner.container.get(i);
                if (item && item.equipment && item.equipment.isEquipped()) {
                    realDefense += item.equipment.getDefenseBonus();
                }
            }
        }
        return realDefense;
    }

    /**
     * Function: takeDamage
     * Deals damages to this actor. If health points reach 0, call the die function.
     * Parameters:
     * owner - the actor owning this Destructible
     * damage - amount of damages to deal
     * Returns:
     * the actual amount of damage taken
     */
    public takeDamage(owner: Actor, damage: number): number {
        if (this.isDead()) {
            return 0;
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
     * Function: heal
     * Recover some health points. Can resurrect a dead destructible
     * Parameters:
     * owner - the actor owning this Destructible
     * amount - amount of health points to recover
     * Returns:
     * the actual amount of health points recovered
     */
    public heal(owner: Actor, amount: number): number {
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

    /**
     * Function: die
     * Turn this actor into a corpse
     * Parameters:
     * owner - the actor owning this Destructible
     */
    public die(owner: Actor) {
        if (this.deathMessage) {
            let wearer: Actor|undefined = owner.getWearer();
            if ( wearer ) {
                Umbra.logger.info(transformMessage(this.deathMessage, owner, wearer));
            }
        }
        if ( this.loot) {
            this.dropLoot(owner);
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

    private swapNameAndCorpseName(owner: Actor) {
        if ( this.corpseName ) {
            let tmp: string = owner.name;
            owner.name = this.corpseName;
            this.corpseName = tmp;
        }
        if ( this.corpseChar ) {
            let tmp: string = owner.ch;
            owner.ch = this.corpseChar;
            this.corpseChar = tmp;
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
     * Fill the creature inventory with loot when it dies
     */
    private dropLoot(owner: Actor) {
        // TODO multi-level probabilities
        let items: Actor[] = ActorFactory.createRandomActors(this.loot, 0);
        for (let item of items) {
            item.pickable.pick(item, owner, false);
        }
    }
}

/**
 * Class: Attacker
 * An actor that can deal damages to another one
 */
export class Attacker implements IActorFeature {
    /**
     * Property: power
     * Amount of damages given
     */
    public power: number;
    private _attackTime: number = PLAYER_WALK_TIME;

    constructor(def: IAttackerDef) {
        if (def) {
            this.power = def.hitPoints;
            this._attackTime = def.attackTime;
        }
    }

    get attackTime() { return this._attackTime; }

    /**
     * Function: attack
     * Deal damages to another actor
     * Parameters:
     * owner - the actor owning this Attacker
     * target - the actor being attacked
     */
    public attack(owner: Actor, target: Actor) {
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

/**
 * =============================================================================
 * Group: inventory
 * =============================================================================
 */

/**
 * Interface: ContainerListener
 * Something that must be notified when an item is added or removed from the container,
 * like the AI that needs to compute overencumbered state
 */
export interface IContainerListener {
    onAdd(itemId: ActorId, container: Container, owner: Actor): void;
    onRemove(itemId: ActorId, container: Container, owner: Actor): void;
}
/**
 * Class: Container
 * An actor that can contain other actors :
 * - creatures with inventory
 * - containers : chests, barrels, ...
 * - socketed items
 */
export class Container implements IActorFeature {
    private _capacity: number = 0;
    private filter: string[]|undefined;
    private actorIds: ActorId[] = [];
    private __listener: IContainerListener|undefined;
    // list of existing slots on this container
    private _slots: string[]|undefined;
    // actor equipped on each slot
    private _slotActors: (ActorId|undefined)[] = [];

    get capacity() { return this._capacity; }

    constructor(def: IContainerDef, listener?: IContainerListener) {
        this.__listener = listener;
        if (def) {
            this._capacity = def.capacity;
            this.filter = def.filter;
            this._slots = def.slots;
        }
    }

    /**
     * Returns "bag of weapons" instead of just "bag" whenever possible
     */
    public getQualifiedName(owner: Actor, count: number = 1): string {
        if (this.actorIds.length === 0) {
            return "empty " + owner.getname(count);
        }
        if ( this.filter ) {
            return this.getCapacityQualifier() + owner.getname(count);
        }
        // associate an item type with a count
        let typeMap: {[index: string]: number} = {};
        for (let actorId of this.actorIds) {
            let item: Actor|undefined = Actor.fromId(actorId);
            if (item) {
                for (let clazz of item.getClasses()) {
                    let def: IActorDef = ActorFactory.getActorDef(clazz);
                    if (def.containerQualifier) {
                        let amount: number = typeMap[clazz] || 0;
                        typeMap[clazz] = amount + 1;
                    }
                }
            }
        }
        // check if the majority of items in this container belong to a type
        let maxCount: number = 1;
        let bestType: string|undefined = undefined;
        for (let type in typeMap) {
            if (typeMap.hasOwnProperty(type)) {
                if ( typeMap[type] > maxCount ) {
                    maxCount = typeMap[type];
                    bestType = type;
                }
            }
        }
        if ( maxCount > 0.75 * this.actorIds.length && bestType) {
            return this.getCapacityQualifier() + owner.getname(count)
                + " of " + ActorFactory.getActorTypeName(bestType, 2);
        }
        return this.getCapacityQualifier() + owner.getname(count);
    }

    public getContent(typeFilter: string|undefined, deep: boolean = false, result?: Actor[]): Actor[] {
        if ( result === undefined ) {
            result = [];
        }
        for (let i: number = 0, len: number = this.size(); i < len; ++i) {
            let actor: Actor|undefined = this.get(i);
            if (! actor ) {
                continue;
            }
            if (!typeFilter || actor.isA(typeFilter)) {
                result.push(actor);
            }
            if ( deep && actor.container ) {
                actor.container.getContent(typeFilter, deep, result);
            }
        }
        return result;
    }

    public getSlots(): string[]|undefined {
        return this._slots;
    }

    public getSlotActors(): (ActorId|undefined)[] {
        return this._slotActors;
    }

    public size(): number { return this.actorIds.length; }

    // used to rebuilt listener link after loading
    public setListener(listener: IContainerListener) {
        this.__listener = listener;
    }

    public get(index: number): Actor|undefined {
        return Actor.fromId(this.actorIds[index]);
    }

    public contains(actorId: ActorId, recursive: boolean): boolean {
        for (let i: number = 0, n: number = this.size(); i < n; i++) {
            if (actorId === this.actorIds[i]) {
                return true;
            }
        }
        if ( recursive ) {
            for (let i: number = 0, n: number = this.size(); i < n; i++) {
                let item: Actor|undefined = Actor.fromId(this.actorIds[i]);
                if ( item && item.container && item.container.contains(actorId, true)) {
                    return true;
                }
            }
        }
        return false;
    }

    public hasSlot(slot: string) {
        return this._slots && this._slots.indexOf(slot) !== -1;
    }

    public getFromSlot(slot: string): Actor|undefined {
        let index = this._slots ? this._slots.indexOf(slot) : -1;
        if ( index === -1 ) {
            return undefined;
        }
        return Actor.fromId(this._slotActors[index]);
    }

    public equip(owner: Actor, item: Actor, slot: string): boolean {
        let index = this._slots ? this._slots.indexOf(slot) : -1;
        if ( index === -1 ) {
            return false;
        }
        this._slotActors[index] = item.id;
        item.pickable.pick(item, owner, false, true);
        return true;
    }

    /**
     * function: shouldAutoEquip
     * Check if there's an available slot on this container and an equivalent item is not already equipped
     */
    public shouldAutoEquip(owner: Actor, item: Actor): boolean {
        if (! this._slots || ! item.equipment || ! item.equipment.getSlots()
            || (owner.destructible && owner.destructible.isDead())) {
            return false;
        }
        // try to find an empty compatible slot
        let itemSlots: string[] = item.equipment.getSlots();
        let isSlotAvailable = false;
        for (let i: number = 0, count: number = itemSlots.length; i < count && ! isSlotAvailable; ++i) {
            if (item.equipment.tryEquipOnSlot(owner, itemSlots[i])) {
                isSlotAvailable = true;
            }
        }
        if (! isSlotAvailable ) {
            return false;
        }
        // find item's inventory qualifiers
        let qualifier: string|undefined = item.getInventoryQualifier();
        // check if similar item not already equipped (to avoid auto-equipping a second torch when you already use one)
        if ( qualifier ) {
            for (let actorId of this._slotActors) {
                let slotActor: Actor|undefined = Actor.fromId(actorId);
                if ( slotActor && slotActor.isA(qualifier)) {
                    return false;
                }
            }
        }
        return true;
    }

    /**
     * function: unequip
     * unequip an item
     * returns: the slot where the item was, or undefined
     */
    public unequip(item: Actor): string|undefined {
        let index = this._slotActors ? this._slotActors.indexOf(item.id) : -1;
        if ( index === -1 ) {
            return undefined;
        }
        this._slotActors[index] = undefined;
        return this._slots ? this._slots[index] : undefined;
    }

    public isSlotEmpty(slot: string): boolean {
        let index = this._slots ? this._slots.indexOf(slot) : -1;
        if ( index === -1 ) {
            return false;
        }
        if (this._slotActors[index]) {
            return false;
        }
        if (slot === SLOT_RIGHT_HAND || slot === SLOT_LEFT_HAND ) {
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

    public canContain(item: Actor): boolean {
        if (!item || !item.pickable) {
            return false;
        }
        if ( this.filter ) {
            let allowedItem: boolean = false;
            // can only contain certain type of items (ex.: key ring)
            for (let filter of this.filter) {
                if (item.isA(filter)) {
                    allowedItem = true;
                    break;
                }
            }
            if (! allowedItem ) {
                return false;
            }
        }
        return this.computeTotalWeight() + item.pickable.weight <= this._capacity;
    }

    public computeTotalWeight(): number {
        let weight: number = 0;
        for (let actorId of this.actorIds) {
            let actor: Actor|undefined = Actor.fromId(actorId);
            if (actor && actor.pickable) {
                weight += actor.pickable.weight;
            }
        }
        return weight;
    }

    /**
     * Function: add
     * add a new actor in this container. This is a low level operation.
     * To put an item in another, use item.pickable.pick.
     * Parameters:
     * actor - the actor to add
     * Returns:
     * false if the operation failed because the container is full
     */
    public add(actor: Actor, owner: Actor): boolean {
        if (! this.canContain(actor)) {
            return false;
        }
        this.actorIds.push(actor.id);
        if (this.__listener) {
            this.__listener.onAdd(actor.id, this, owner);
        }
        return true;
    }

    /**
     * Function: remove
     * remove an actor from this container
     * Parameters:
     * actorId - the id of the actor to remove
     * owner - the actor owning the container
     */
    public remove(actorId: ActorId, owner: Actor) {
        let idx: number = this.actorIds.indexOf(actorId);
        if (idx !== -1) {
            this.actorIds.splice(idx, 1);
            if (this.__listener) {
                this.__listener.onRemove(actorId, this, owner);
            }
        }
    }

    private getCapacityQualifier(): string {
        let coef: number = this.computeTotalWeight() / this._capacity;
        return coef > 0.8 ? "almost full " : "";
    }
}

/**
 * Class: Pickable
 * An actor that can be picked by a creature
 */
export class Pickable implements IActorFeature {
    /**
     * Property: onUseEffector
     * What happens when this item is used.
     */
    private onUseEffector: Effector;
    /**
     * Property: onThrowEffector
     * What happens when this item is thrown.
     */
    private onThrowEffector: Effector;
    private _weight: number;
    private _destroyedWhenThrown: boolean = false;
    private _containerId: ActorId|undefined;

    get weight() { return this._weight; }
    get onThrowEffect() { return this.onThrowEffector ? this.onThrowEffector.effect : undefined; }
    get destroyedWhenThrown() { return this._destroyedWhenThrown; }
    get containerId() { return this._containerId; }

    constructor(def: IPickableDef) {
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

    public getOnThrowEffector(): Effector {
        return this.onThrowEffector;
    }
    public getOnUseEffector(): Effector {
        return this.onUseEffector;
    }

    public setOnUseEffect(effect: IEffect, targetSelector: TargetSelector, message?: string,
                          destroyOnEffect: boolean = false) {
        this.onUseEffector = new Effector(effect, targetSelector, message, destroyOnEffect);
    }

    public setOnThrowEffect(effect: IEffect, targetSelector: TargetSelector, message?: string,
                            destroyOnEffect: boolean = false) {
        this.onThrowEffector = new Effector(effect, targetSelector, message, destroyOnEffect);
    }

    /**
     * Function: pick
     * Put this actor in a container actor
     * Parameters:
     * owner - the actor owning this Pickable (the item)
     * wearer - the container (the creature picking the item)
     * Returns:
     * true if the operation succeeded
     */
    public pick(owner: Actor, wearer: Actor, withMessage: boolean, fromEquip?: boolean): boolean {
        if (this._containerId !== wearer.id && wearer.container && wearer.container.add(owner, wearer)) {
            if ( this._containerId) {
                let oldContainer: Actor|undefined = Actor.fromId(this._containerId);
                if ( oldContainer) {
                    owner.pickable.drop(owner, oldContainer, wearer, undefined, undefined, undefined, fromEquip);
                }
            }
            this._containerId = wearer.id;
            owner.moveTo(wearer.pos.x, wearer.pos.y);
            if ( withMessage && (wearer.isA("creature[s]")
                && (! wearer.destructible || !wearer.destructible.isDead()))) {
                Umbra.logger.info(transformMessage("[The actor1] pick[s] [the actor2].", wearer, owner));
            }

            if (! fromEquip) {
                if ( owner.equipment && wearer.isPlayer() && wearer.container.shouldAutoEquip(wearer, owner)) {
                    // equippable and slot is empty : auto-equip
                    owner.equipment.equip(owner, wearer);
                } else if (owner.equipment && owner.activable && owner.activable.isActive()) {
                    // picking an equipable, active item and not equipping it turns it off
                    owner.activable.deactivate(owner);
                }
            }
            return true;
        }
        // wearer is not a container or is full
        return false;
    }

    /**
     * Function: drop
     * Drop this actor on the ground.
     * Parameters:
     * owner - the actor owning this Pickable (the item)
     * wearer - the container (the creature holding the item). Note that the item can be in a sub-container.
     * pos - coordinate if the position is not the wearer's position
     * verb - verb to use in the message (drop/throw/...)
     * withMessage - whether a message should be logged
     */
    public drop(owner: Actor, wearer: Actor, newContainer?: Actor, pos?: Core.Position, verb: string = "drop",
                withMessage: boolean = false, fromEquip?: boolean) {
        let container: Actor|undefined = Actor.fromId(this._containerId);
        if ( container ) {
            container.container.remove(owner.id, wearer);
        }
        if (! newContainer ) {
            this._containerId = undefined;
            owner.pos.x = pos ? pos.x : wearer.pos.x;
            owner.pos.y = pos ? pos.y : wearer.pos.y;
            owner.register();
        }
        if (! fromEquip && owner.equipment) {
            owner.equipment.unequip(owner, wearer, true);
        }
        if (withMessage) {
            Umbra.logger.info(wearer.getThename() + " " + verb + wearer.getVerbEnd() + owner.getthename());
        }
    }

    /**
     * Function: use
     * Use this item. If it has a onUseEffector, apply the effect and destroy the item.
     * If it's an equipment, equip/unequip it.
     * Parameters:
     * owner - the actor owning this Pickable (the item)
     * wearer - the container (the creature using the item)
     * Returns:
     * true if this effect was applied, false if it only triggered the tile picker
     */
    public use(owner: Actor, wearer: Actor): Promise<boolean> {
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
     * Function: throw
     * Throw this item. If it has a onThrowEffector, apply the effect.
     * Parameters:
     * owner - the actor owning this Pickable (the item)
     * wearer - the actor throwing the item
     * maxRange - maximum distance where the item can be thrown.
     *      If not defined, max range is computed from the item's weight
     */
    public throw(owner: Actor, wearer: Actor, maxRange?: number): Promise<void> {
        return new Promise<void>((resolve) => {
            if (!maxRange) {
                maxRange = owner.computeThrowRange(wearer);
            }
            // create a Core.Position instead of using directly wearer to avoid TilePicker
            // -> actor dependency which would break json serialization
            if ( wearer.ai.tilePicker) {
                wearer.ai.tilePicker.pickATile("Left-click where to throw the " + owner.name
                    + ",\nor right-click to cancel.", new Core.Position(wearer.pos.x, wearer.pos.y), maxRange).then(
                        (pos: Core.Position) => {
                            this.throwOnPos(owner, wearer, false, pos);
                            resolve();
                        });
            }
        });
    }

    private throwOnPos(owner: Actor, wearer: Actor, fromFire: boolean, pos: Core.Position, coef: number = 1) {
        owner.pickable.drop(owner, wearer, undefined, pos, "throw", !fromFire);
        if (owner.pickable.onThrowEffector) {
            owner.pickable.onThrowEffector.apply(owner, wearer, pos, coef);
            if (owner.pickable.destroyedWhenThrown) {
                owner.destroy();
            }
        }
    }
}

/**
 * Class: Equipment
 * An item that can be equipped
 */
export class Equipment implements IActorFeature {
    private slots: string[];
    private equipped: boolean = false;
    private defenseBonus: number = 0;

    constructor(def: IEquipmentDef) {
        if (def) {
            this.slots = def.slots;
            if (def.defense) {
                this.defenseBonus = def.defense;
            }
        }
    }

    public isEquipped(): boolean { return this.equipped; }

    public getSlots(): string[] { return this.slots; }
    public getDefenseBonus(): number { return this.defenseBonus; }

    /**
     * Function: use
     * Use (equip or unequip) this item.
     * Parameters:
     * owner: the actor owning this Equipment (the item)
     * wearer: the container (the creature using this item)
     */
    public use(owner: Actor, wearer: Actor) {
        if (this.equipped) {
            this.unequip(owner, wearer);
        } else {
            this.equip(owner, wearer);
        }
    }

    public canUseSlot(slot: string) {
        return this.slots && this.slots.indexOf(slot) !== -1;
    }

    /**
     * function: tryEquipOnSlot
     * Check if the slot is available
     */
    public tryEquipOnSlot(wearer: Actor, slot: string): boolean {
        if ( !wearer.container.hasSlot(slot)) {
            return false;
        }
        let previousEquipped = wearer.container.getFromSlot(slot);
        if (previousEquipped) {
            return false;
        } else if (slot === SLOT_BOTH_HANDS) {
            if (wearer.container.getFromSlot(SLOT_RIGHT_HAND)) {
                return false;
            }
            if (wearer.container.getFromSlot(SLOT_LEFT_HAND)) {
                return false;
            }
        } else if (slot === SLOT_RIGHT_HAND || slot === SLOT_LEFT_HAND ) {
            if (wearer.container.getFromSlot(SLOT_BOTH_HANDS)) {
                return false;
            }
        }
        return true;
    }

    public equipOnSlot(owner: Actor, wearer: Actor, slot: string) {
        let previousEquipped = wearer.container.getFromSlot(slot);
        if (previousEquipped) {
            // first unequip previously equipped item
            previousEquipped.equipment.unequip(previousEquipped, wearer);
        } else if (slot === SLOT_BOTH_HANDS) {
            // unequip both hands when equipping a two hand weapon
            let rightHandItem = wearer.container.getFromSlot(SLOT_RIGHT_HAND);
            if (rightHandItem) {
                rightHandItem.equipment.unequip(rightHandItem, wearer);
            }
            let leftHandItem = wearer.container.getFromSlot(SLOT_LEFT_HAND);
            if (leftHandItem) {
                leftHandItem.equipment.unequip(leftHandItem, wearer);
            }
        } else if (slot === SLOT_RIGHT_HAND || slot === SLOT_LEFT_HAND ) {
            // unequip two hands weapon when equipping single hand weapon
            let twoHandsItem = wearer.container.getFromSlot(SLOT_BOTH_HANDS);
            if (twoHandsItem) {
                twoHandsItem.equipment.unequip(twoHandsItem, wearer);
            }
        }
        this.equipped = true;
        wearer.container.equip(wearer, owner, slot);
        if (wearer === Actor.specialActors[SpecialActorsEnum.PLAYER]) {
            Umbra.logger.warn(transformMessage("[The actor1] equip[s] [the actor2] on [its] " + slot, wearer, owner));
        }
        if (owner.activable && !owner.activable.isActive()) {
            owner.activable.activate(owner);
        }
    }

    public equip(owner: Actor, wearer: Actor) {
        if (! this.slots ) {
            Umbra.logger.error(transformMessage("Error! Cannot equip [the actor1]", owner));
            return;
        }
        if (this.slots.length > 1) {
            // try to find an empty slot
            for (let slot of this.slots) {
                if (this.tryEquipOnSlot(wearer, slot)) {
                    this.equipOnSlot(owner, wearer, slot);
                    return;
                }
            }
        }
        // use first slot, unequipping existing item
        this.equipOnSlot(owner, wearer, this.slots[0]);
    }

    public unequip(owner: Actor, wearer: Actor, beforeDrop: boolean = false) {
        this.equipped = false;
        let slot: string|undefined = wearer.container.unequip(owner);
        if (slot && !beforeDrop && wearer === Actor.specialActors[SpecialActorsEnum.PLAYER]) {
            Umbra.logger.warn(transformMessage("[The actor1] unequip[s] [the actor2] from [its] "
                + slot, wearer, owner));
        }
        if (!beforeDrop && owner.activable) {
            owner.activable.deactivate(owner);
        }
    }
}

/**
 * Class: Ranged
 * an item that throws other items. It's basically a shortcut to throw projectile items with added damages.
 * For example instead of [t]hrowing an arrow by hand, you equip a bow and [f]ire it. The result is the same
 * except that :
 * - the arrow will deal more damages
 * - the action will take more time because you need time to load the projectile on the weapon
 * The same arrow will deal different damages depending on the bow you use.
 * A ranged weapon can throw several type of projectiles (for example dwarven and elven arrows).
 * The projectileType property makes it possible to look for an adequate item in the inventory.
 * If a compatible type is equipped (on quiver), it will be used. Else the first compatible item will be used.
 */
export class Ranged implements IActorFeature {
    /**
     * Property: _damageCoef
     * Damage multiplicator when using this weapon to fire a projectile.
     */
    private _damageCoef: number;
    /**
     * Property: _projectileType
     * The actor type that this weapon can fire.
     */
    private _projectileType: string;
    /**
     * Property: _loadTime
     * Time to load this weapon with a projectile
     */
    private _loadTime: number;
    /**
     * Property:  _range
     * This weapon's maximum firing distance
     */
    private _range: number;

    private projectileId: ActorId;

    get loadTime() { return this._loadTime; }
    get damageCoef() { return this._damageCoef; }
    get projectileType() { return this._projectileType; }
    get projectile() { return this.projectileId ? Actor.fromId(this.projectileId) : undefined; }
    get range() { return this._range; }

    constructor(def: IRangedDef) {
        if (def) {
            this._damageCoef = def.damageCoef;
            this._projectileType = def.projectileType;
            this._loadTime = def.loadTime;
            this._range = def.range;
        }
    }

    public fire(wearer: Actor): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            let projectile: Actor|undefined = this.findCompatibleProjectile(wearer);
            if (!projectile) {
                // no projectile found. cannot fire
                if (wearer === Actor.specialActors[SpecialActorsEnum.PLAYER]) {
                    Umbra.logger.warn("No " + this._projectileType + " available.");
                    resolve(false);
                }
            } else {
                this.projectileId = projectile.id;
                Umbra.logger.info(transformMessage("[The actor1] fire[s] [a actor2].", wearer, projectile));
                projectile.pickable.throw(projectile, wearer, this._range).then(() => {
                    resolve(true);
                });
            }
        });
    }

    private findCompatibleProjectile(wearer: Actor): Actor|undefined {
        let projectile: Actor|undefined = undefined;
        if (wearer.container) {
            // if a projectile type is selected (equipped in quiver), use it
            projectile = wearer.container.getFromSlot(SLOT_QUIVER);
            if (!projectile || !projectile.isA(this._projectileType)) {
                // else use the first compatible projectile
                projectile = undefined;
                let n: number = wearer.container.size();
                for (let i: number = 0; i < n; ++i) {
                    let item: Actor|undefined = wearer.container.get(i);
                    if (item && item.isA(this._projectileType)) {
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
 * Class: Magic
 * Item with magic properties (staff wands, ...)
 */
export class Magic implements IActorFeature {
    public maxCharges: number;
    private _charges: number;
    private onFireEffector: Effector;

    get charges() { return this._charges; }

    constructor(def: IMagicDef) {
        if (def) {
            this.maxCharges = def.charges;
            this._charges = def.charges;
            this.onFireEffector = ActorFactory.createEffector(def.onFireEffect);
        }
    }

    /**
     * Function: zap
     * Use the magic power of the item
     * Returns:
     * true if this effect was applied, false if it only triggered the tile picker
     */
    public zap(owner: Actor, wearer: Actor): Promise<boolean> {
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
 * Class: Activable
 * Something that can be turned on/off
 */
export class Activable implements IActorFeature {
    private active: boolean = false;
    private activateMessage: string|undefined;
    private deactivateMessage: string|undefined;
    private onActivateEffector: Effector;
    private type: ActivableTypeEnum;

    constructor(def: IActivableDef) {
        if ( def ) {
            this.init(def);
        }
    }
    public init(def: IActivableDef) {
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

    public isActive(): boolean { return this.active; }

    public activate(owner: Actor, activator?: Actor): boolean {
        if (owner.lock && owner.lock.isLocked()) {
            // unlock if the activator has the key
            let keyId = owner.lock.keyId;
            if (activator && activator.container && activator.container.contains(keyId, true)) {
                owner.lock.unlock(keyId);
                activator.container.remove(keyId, activator);
                let key: Actor|undefined = Actor.fromId(keyId);
                if ( key ) {
                    key.destroy();
                }
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
        if ( this.type !== ActivableTypeEnum.SINGLE ) {
            if (owner.light) {
                Umbra.EventManager.publishEvent(EVENT_LIGHT_ONOFF, owner);
            }
        } else {
            // SINGLE is immediately deactivated
            this.active = false;
        }
        if ( this.onActivateEffector && activator ) {
            this.onActivateEffector.apply(owner, activator);
        }
        return true;
    }

    public deactivate(owner: Actor): boolean {
        this.active = false;
        this.displayState(owner);
        if (owner.light) {
            Umbra.EventManager.publishEvent(EVENT_LIGHT_ONOFF, owner);
        }
        return true;
    }

    public switchLever(owner: Actor, activator?: Actor): boolean {
        if (this.active) {
            return this.deactivate(owner);
        } else {
            return this.activate(owner, activator);
        }
    }

    private displayState(owner: Actor) {
        if (this.isActive()) {
            if ( this.activateMessage ) {
                Umbra.logger.info(transformMessage(this.activateMessage, owner));
            }
        } else if ( this.deactivateMessage ) {
            Umbra.logger.info(transformMessage(this.deactivateMessage, owner));
        }
    }
}

/**
 * Class: Lever
 * An Activable that controls a remote Activable
 */
export class Lever extends Activable {
    private actorId: ActorId;

    constructor(def: IActivableDef) {
        super(def);
    }

    public activate(_owner: Actor, activator?: Actor): boolean {
        let mechanism = this.actorId !== undefined ? Actor.fromId(this.actorId) : undefined;
        return mechanism && mechanism.activable ? mechanism.activable.activate(mechanism, activator) : false;
    }

    public deactivate(_owner: Actor, _activator?: Actor): boolean {
        let mechanism = this.actorId !== undefined ? Actor.fromId(this.actorId) : undefined;
        return mechanism && mechanism.activable ? mechanism.activable.deactivate(mechanism) : false;
    }

    public switchLever(_owner: Actor, activator?: Actor): boolean {
        let mechanism = this.actorId !== undefined ? Actor.fromId(this.actorId) : undefined;
        return mechanism && mechanism.activable ? mechanism.activable.switchLever(mechanism, activator) : false;
    }
}

/**
 * Class: Lockable
 * Something that can be locked/unlocked
 */
export class Lockable implements IActorFeature {
    private locked: boolean = true;
    private _keyId: ActorId;
    constructor(keyId: ActorId) {
        this._keyId = keyId;
    }

    public isLocked(): boolean { return this.locked; }
    get keyId() { return this._keyId; }

    public unlock(keyId: ActorId): boolean {
        if (this._keyId === keyId) {
            this.locked = false;
            return true;
        }
        return false;
    }
    public lock() {
        this.locked = true;
    }
}

/**
 * Class: Door
 * Can be open/closed. Does not necessarily block sight (portcullis).
 */
export class Door extends Activable {
    private seeThrough: boolean;
    constructor(def: IDoorDef) {
        super(def);
        if (def) {
            this.seeThrough = def.seeThrough;
        }
    }

    public activate(owner: Actor, activator?: Actor): boolean {
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

    public deactivate(owner: Actor): boolean {
        // don't close if there's a living actor on the cell
        let currentMap: Map.Map = Map.Map.current;
        if (!currentMap.canWalk(owner.pos.x, owner.pos.y)) {
            Umbra.logger.info(transformMessage("Cannot close [the actor1]", owner));
            return false;
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
