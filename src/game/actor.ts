/*
	Section: actors
*/
module Game {
    "use strict";

	/********************************************************************************
	 * Group: actors
	 ********************************************************************************/
	/*
		Type: ActorId
		The CRC32 hashed value of the actor's readable id.
	*/
    export type ActorId = number;

    export enum ActorFeatureType {
        /** can be destroyed/killed */
        DESTRUCTIBLE,
        /** can deal damages */
        ATTACKER,
        /** updates itself */
        AI,
        /** can be picked (put inside a container actor) */
        PICKABLE,
        /** can contain other actors */
        CONTAINER,
        /** can be equipped on a slot */
        EQUIPMENT,
        /** can throw away some type of actors */
        RANGED,
        /** has magic properties */
        MAGIC,
        /** can be turned on and off */
        ACTIVABLE,
        /** can be locked/unlocked */
        LOCKABLE,
        /** can produce light */
        LIGHT,
        /** accumulates xp */
        XP_HOLDER,
        /** can refill another actor */
        AMMO,
    }

    export interface ActorFeature extends Core.Persistent {
    }

    /*
         Class: Actor
         The base class for all actors.
         Actor shouldn't hold references to other Actors, else there might be cyclic dependencies which
         keep the json serializer from working. Instead, hold ActorId and use ActorManager.getActor()
    */
    export class Actor extends Yendor.TimedEntity implements Core.Persistent {
        _pos: Core.Position;
        // persister classname
        className: string;
        private classes: string[] = [];
        private _id: ActorId;
        private _readableId: string;
        // the ascii code of the symbol representing this actor on the map
        private _ch: number;
        // the name to be used by mouse look or the inventory screen
        name: string;
        // the color associated with this actor's symbol
        col: Core.Color;

        private features: { [index: number]: ActorFeature } = {};

        /** whether you can walk on the tile where this actor is */
        blocks: boolean = false;
        /** whether light goes through this actor */
        transparent: boolean = true;
        /** whether you can see this actor only if it's in your field of view */
        fovOnly: boolean = true;
        /** whether this actor should be placed on a floor or wall tile */
        wallActor: boolean = false;
        /** whether this actor name is singular (you can write "a <name>") */
        private _singular: boolean = true;

        get id() { return this._id; }
        get readableId() { return this._readableId; }

        constructor(readableId?: string) {
            super();
            this._pos = new Core.Position();
            this.className = "Game.Actor";
            if (readableId) {
                // readableId is undefined when loading a game
                this._readableId = readableId;
                this._id = Core.crc32(readableId);
                Engine.instance.actorManager.registerActor(this);
            }
        }

        equals(c: Actor): boolean {
            return this._id === c._id;
        }

        init(name: string, def: ActorDef) {
            if (!def) {
                return;
            }
            if (def.ch) {
                this._ch = def.ch.charCodeAt(0);
            }
            if (name) {
                this.name = name;
            }
            if (def.color !== undefined) {
                this.col = def.color;
            }
            if (def.plural !== undefined) {
                this._singular = !def.plural;
            }
            if (def.blockWalk !== undefined) {
                this.blocks = def.blockWalk;
            }
            if (def.blockSight !== undefined) {
                this.transparent = !def.blockSight;
            }
            if (def.wallActor) {
                this.wallActor = def.wallActor;
            }
            if (def.displayOutOfFov !== undefined) {
                this.fovOnly = !def.displayOutOfFov;
            }
            if (def.classes) {
                for (let type in def.classes) {
                    this.classes.push(def.classes[type]);
                }
            }
        }

        get pos(): Core.Position { return this._pos; }
        moveTo(x: number, y: number) {
            if (!this.transparent) {
                Engine.instance.map.setTransparent(this.pos.x, this.pos.y, true);
                this._pos.moveTo(x, y);
                Engine.instance.map.setTransparent(this.pos.x, this.pos.y, false);
            } else {
                this._pos.moveTo(x, y);
            }
            if (this.container) {
                // move items in inventory (needed for lights)
                for (let i: number = 0, len: number = this.container.size(); i < len; ++i) {
                    let actor: Actor = this.container.get(i);
                    actor.moveTo(x, y);
                }
            }
        }

        computeThrowRange(thrower: Actor): number {
            let weight: number = this.pickable.weight;
            let maxRange: number = weight < 0.5 ? 3 : 15 / weight;
            if (this.equipment && this.equipment.getSlot() === Constants.SLOT_QUIVER) {
                // increase projectile throw range
                maxRange *= 2.5;
            }
            // TODO should also depend on thrower's force
            return maxRange;
        }

        isA(type: string): boolean {
            return this.name === type || this.classes.indexOf(type) !== -1;
        }

        get ch() { return String.fromCharCode(this._ch); }
        get charCode() { return this._ch; }
        set ch(newValue: string) { this._ch = newValue.charCodeAt(0); }

        isSingular(): boolean {
            return this._singular;
        }

        isStackable(): boolean {
            return !this.destructible && (!this.equipment || !this.equipment.isEquipped() || this.equipment.getSlot() === Constants.SLOT_QUIVER);
        }

        // feature getters & setters
        hasFeature(featureType: ActorFeatureType): boolean {
            return this.features[featureType] !== undefined;
        }

        /**
            Function: getWearer
            Return the actor wearing (containing) this actor
         */
        getWearer(): Actor {
            if (this.pickable && this.pickable.containerId) {
                return Engine.instance.actorManager.getActor(this.pickable.containerId);
            }
            return undefined;
        }

        get destructible(): Destructible { return <Destructible>this.features[ActorFeatureType.DESTRUCTIBLE]; }
        set destructible(newValue: Destructible) { this.features[ActorFeatureType.DESTRUCTIBLE] = newValue; }

        get attacker(): Attacker { return <Attacker>this.features[ActorFeatureType.ATTACKER]; }
        set attacker(newValue: Attacker) { this.features[ActorFeatureType.ATTACKER] = newValue; }

        get ai(): Ai { return <Ai>this.features[ActorFeatureType.AI]; }
        set ai(newValue: Ai) { this.features[ActorFeatureType.AI] = newValue; }

        get pickable(): Pickable { return <Pickable>this.features[ActorFeatureType.PICKABLE]; }
        set pickable(newValue: Pickable) { this.features[ActorFeatureType.PICKABLE] = newValue; }

        get container(): Container { return <Container>this.features[ActorFeatureType.CONTAINER]; }
        set container(newValue: Container) { this.features[ActorFeatureType.CONTAINER] = newValue; }

        get equipment(): Equipment { return <Equipment>this.features[ActorFeatureType.EQUIPMENT]; }
        set equipment(newValue: Equipment) { this.features[ActorFeatureType.EQUIPMENT] = newValue; }

        get ranged(): Ranged { return <Ranged>this.features[ActorFeatureType.RANGED]; }
        set ranged(newValue: Ranged) { this.features[ActorFeatureType.RANGED] = newValue; }

        get magic(): Magic { return <Magic>this.features[ActorFeatureType.MAGIC]; }
        set magic(newValue: Magic) { this.features[ActorFeatureType.MAGIC] = newValue; }

        get activable(): Activable { return <Activable>this.features[ActorFeatureType.ACTIVABLE]; }
        set activable(newValue: Activable) { this.features[ActorFeatureType.ACTIVABLE] = newValue; }

        get lock(): Lockable { return <Lockable>this.features[ActorFeatureType.LOCKABLE]; }
        set lock(newValue: Lockable) { this.features[ActorFeatureType.LOCKABLE] = newValue; }

        get light(): Light { return <Light>this.features[ActorFeatureType.LIGHT]; }
        set light(newValue: Light) { this.features[ActorFeatureType.LIGHT] = newValue; }

        get xpHolder(): XpHolder { return <XpHolder>this.features[ActorFeatureType.XP_HOLDER]; }
        set xpHolder(newValue: XpHolder) { this.features[ActorFeatureType.XP_HOLDER] = newValue; }

        isInContainer(): boolean { return this.pickable && this.pickable.containerId !== undefined; }
        contains(actorId: ActorId): boolean {
            return this.container && this.container.contains(actorId);
        }

        getname(): string {
            if (this.ai && this.ai.hasCondition(ConditionType.FROZEN)) {
                return "frozen " + this.name;
            }
            return this.name;
        }

		/**
			Function: getaname
			Returns " a <name>" or " an <name>" or " <name>"
		*/
        getaname(): string {
            if (!this.isSingular()) {
                return " " + this.getname();
            }
            let curName = this.getname();
            let article: string = ("aeiou".indexOf(curName[0]) !== -1 ? " an " : " a ");
            return article + curName;
        }

		/**
			Function: getAname
			Returns "A <name>" or "An <name>" or "<name>"
		*/
        getAname(): string {
            if (!this.isSingular()) {
                return this.getname();
            }
            let curName = this.getname();
            let article: string = ("aeiou".indexOf(curName[0]) !== -1 ? "An " : "A ");
            return article + curName;
        }

		/**
			Function: getTheresaname
			Returns "There's a <name>" or "There's an <name>" or "There are <name>"
		*/
        getTheresaname(): string {
            let verb = this.isSingular() ? "'s" : " are";
            return "There" + verb + this.getaname();
        }

		/**
			Function: getthename
			Returns " the <name>"
		*/
        getthename(): string {
            return " the " + this.getname();
        }

		/**
			Function: getThename
			Returns "The <name>"
		*/
        getThename(): string {
            return "The " + this.getname();
        }

		/**
			Function: getThenames
			Returns "The <name>'s "
		*/
        getThenames(): string {
            return this.getThename() + "'s ";
        }

		/**
			Function: getthenames
			Returns " the <name>'s "
		*/
        getthenames(): string {
            return this.getthename() + "'s ";
        }

        getits(): string {
            return " its ";
        }

        getit(): string {
            return " it";
        }

        getis(): string {
            return this.isSingular() ? " is" : " are";
        }

        getVerbEnd(): string {
            return this.isSingular() ? "s" : "";
        }

        getDescription(): string {
            let desc = this.name;
            if (this.destructible) {
                let hpPercent = Math.floor(this.destructible.hp * 100 / this.destructible.maxHp);
                desc += " [" + hpPercent + "%]";
            }
            if (this.magic) {
                if (this.magic.charges > 0) {
                    desc += ", " + this.magic.charges + " charges";
                } else {
                    desc += ", uncharged";
                }
            }
            if (this.equipment && this.equipment.isEquipped()) {
                desc += ", on " + this.equipment.getSlot();
            }
            if (this.ai) {
                let condDesc: string = this.ai.getConditionDescription();
                if (condDesc) {
                    desc += ", " + condDesc;
                }
            }
            return desc;
        }

        update() {
            if (this.ai) {
                this.ai.update();
            }
        }

		/**
			Function: postLoad
			json.stringify cannot handle cyclic dependencies so we have to rebuild them here
		*/
        postLoad() {
            // rebuild container -> listener backlinks
            if (this.ai && this.container) {
                this.container.setListener(this.ai);
            }
            if (this.light && (!this.activable || this.activable.isActive())) {
                Umbra.EventManager.publishEvent(EventType[EventType.LIGHT_ONOFF], this);
            }
        }

    }
}
