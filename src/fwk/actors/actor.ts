/*
	Section: actors
*/
import * as Core from "../core/main";
import * as Yendor from "../yendor/main";
import * as Umbra from "../umbra/main";
import * as Map from "../map/main";
import {ActorDef, ConditionType} from "./actor_def";
import {ActorFeature, ActorId, ActorFeatureType} from "./actor_feature";
import {EVENT_LIGHT_ONOFF, SLOT_QUIVER, PERSISTENCE_ACTORS_KEY} from "./base";
import {Destructible, Attacker, Activable, Container, Pickable, Equipment, Ranged, Magic, Lockable} from "./actor_item";
import {Ai, XpHolder} from "./actor_creature";
import {Light} from "./actor_light";


	/********************************************************************************
	 * Group: actors
	 ********************************************************************************/

    export enum SpecialActors {
        PLAYER,
        // TODO replace stairs up by messager, stairs down by teleporter
        // keep stairs for multi-level maps
        STAIR_UP,
        STAIR_DOWN
    }

    /*
         Class: Actor
         The base class for all actors.
         Actor shouldn't hold references to other Actors, else there might be cyclic dependencies which
         keep the json serializer from working. Instead, hold ActorId and use ActorManager.getActor()
    */
    export class Actor extends Yendor.TimedEntity implements Core.Persistent {
        /** associative map actorId => Actor */
        static map: {[index: number]: Actor} = {};
        /** list of all current actors in the game */
        static list: Actor[] = [];
        /** fast way to retrieve some special actors like the player. SpecialActor => Actor */
        static specialActors: {[index: string]: Actor} = {};
        static scheduler: Yendor.Scheduler = new Yendor.Scheduler();

        _pos: Core.Position;
        /** map of all existing actors (key = actor.id) */
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

		/**
			Function: findClosestActor

			In the `actors` array, find the closest creature (except the player) from position `pos` within `range`.
			If range is 0, no range limitation.
		*/
        static findClosestEnemy(pos: Core.Position, range: number): Actor {
            let bestDistance: number = 1E8;
            let closestActor: Actor;
            Actor.list.map((actor: Actor) => {
                if (actor !== Actor.specialActors[SpecialActors.PLAYER] && actor.isA("creature") && ! actor.destructible.isDead()) {
                    let distance: number = Core.Position.distance(pos, actor.pos);
                    if (distance < bestDistance && (distance < range || range === 0)) {
                        bestDistance = distance;
                        closestActor = actor;
                    }
                }
            });
            return closestActor;
        }

        static load(persister: Core.Persister): Promise<void> {
            return new Promise<void>((resolve) => {
                persister.loadFromKey(PERSISTENCE_ACTORS_KEY).then((value) => {
                    Actor.list.map((actor: Actor) => {
                        let specialActor: SpecialActors;
                        if ( actor.isA("player")) {
                            specialActor = SpecialActors.PLAYER;
                        } else if ( actor.isA("stairs up")) {
                            specialActor = SpecialActors.STAIR_UP;
                        } else if ( actor.isA("stairs down")) {
                            specialActor = SpecialActors.STAIR_DOWN;
                        }
                        if ( specialActor !== undefined) {
                            Actor.specialActors[specialActor] = actor;
                        }
                    });
                    resolve();
                });
            });
        }
        static deleteSavedGame(persister: Core.Persister) {
            persister.deleteKey(PERSISTENCE_ACTORS_KEY);
        }

        get id() { return this._id; }
        get readableId() { return this._readableId; }

        constructor(readableId?: string) {
            super();
            this._pos = new Core.Position();
            if (readableId) {
                // readableId is undefined when loading a game
                this._readableId = readableId;
                this._id = Core.crc32(this._readableId);
                Actor.map[this._id] = this;
            }
            Actor.list.push(this);
        }

        /** register this actor in the scheduler */
        register() { // TODO clean this mess!
            if (Umbra.logger.isDebugEnabled()) {
                Umbra.logger.debug("new actor " + this.readableId + "[" + this._id.toString(16) + "]");
            }
            if (this.ai) {
                Actor.scheduler.add(this);
            }
            if (this.light && (!this.activable || this.activable.isActive())) {
                Umbra.EventManager.publishEvent(EVENT_LIGHT_ONOFF, this);
            }
            // possibly set the map transparency
            this.moveTo(this.pos.x, this.pos.y);
        }

		/**
			Function: postLoad
			json.stringify cannot handle cyclic dependencies so we have to rebuild them here.
            Also, when loading from persistence, constructor is called without parameters
		*/
        postLoad() {
            Actor.map[this._id] = this;
            this.register();
            // rebuild container -> listener backlinks
            if (this.ai && this.container) {
                this.container.setListener(this.ai);
            }
            if (this.light && (!this.activable || this.activable.isActive())) {
                Umbra.EventManager.publishEvent(EVENT_LIGHT_ONOFF, this);
            }
        }

		/**
			Function: getAttacker
			Determin what will be used to attack
		*/
        getAttacker(): Attacker {
            if (this.container) {
                // check for equipped weapons
                // TODO each equipped weapon should be used only once per turn
                for (let i: number = 0, n: number = this.container.size(); i < n; ++i) {
                    let item: Actor = this.container.get(i);
                    if (item.equipment && item.equipment.isEquipped() && item.attacker) {
                        return item.attacker;
                    }
                }
            }
            return this.attacker;
        }

        destroy() {
            let wearer: Actor = this.getWearer();
            if (wearer) {
                wearer.container.remove(this.id, wearer);
            }
            if (this.ai) {
                Actor.scheduler.remove(this);
            }
            if (this.activable && this.activable.isActive() && this.light) {
                this.activable.deactivate(this);
            }
            if (this.container) {
                let i: number = this.container.size();
                while ( i > 0 ) {
                    this.container.get(0).destroy();
                    --i;
                }
            }
            delete Actor.map[this._id];
            let index = Actor.list.indexOf(this);
            if ( index !== -1 ) {
                Actor.list.splice(index, 1);
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
            if (def.prototypes) {
                for (let type in def.prototypes) {
                    this.classes.push(def.prototypes[type]);
                }
            }
        }

        get pos(): Core.Position { return this._pos; }
        moveTo(x: number, y: number) {
            if (!this.transparent && Map.Map.current) {
                Map.Map.current.setTransparent(this.pos.x, this.pos.y, true);
                this._pos.moveTo(x, y);
                Map.Map.current.setTransparent(this.pos.x, this.pos.y, false);
            } else {
                this._pos.moveTo(x, y);
            }
            if (this.container) {
                // move items in inventory (needed for lights)
                for (let i: number = 0, len: number = this.container.size(); i < len; ++i) {
                    let actor: Actor = this.container.get(i);
                    if ( actor ) {
                        actor.moveTo(x, y);
                    }
                }
            }
        }

        computeThrowRange(thrower: Actor): number {
            let weight: number = this.pickable.weight;
            let maxRange: number = weight < 0.5 ? 3 : 15 / weight;
            if (this.equipment && this.equipment.getSlot() === SLOT_QUIVER) {
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
            return !this.destructible && (!this.equipment || !this.equipment.isEquipped() || this.equipment.getSlot() === SLOT_QUIVER);
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
                return Actor.map[this.pickable.containerId];
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
                this.ai.update(this);
            }
        }
    }
