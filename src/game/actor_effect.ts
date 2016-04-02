/**
	Section: effects
*/
module Game {
    "use strict";


	/********************************************************************************
	 * Group: target selection
	 ********************************************************************************/
	/**
		Class: TargetSelector
		Various ways to select actors
	*/
    export class TargetSelector implements Core.Persistent {
        className: string;
        private _method: TargetSelectionMethod;
        private actorType: string; 
        private _range: number;
        private _radius: number;
        __selectedTargets: Actor[];

        constructor(def: TargetSelectorDef) {
            this.className = "Game.TargetSelector";
            if (def) {
                this._method = def.method;
                this._range = def.range;
                this._radius = def.radius;
                this.actorType = def.actorType;
            }
        }

		/**
			Property: method
			The target selection method (read-only)
		*/
        get method() { return this._method; }

		/**
			Property: range
			The selection range (read-only)
		*/
        get range() { return this._range; }

		/**
			Property: radius
			Radius of effect around the selected position
		*/
        get radius() { return this._radius; }

		/**
			Function: selectTargets
			Populates the __selectedTargets field, or triggers the tile picker

			Parameters:
			owner - the actor owning the effect (the magic item or the scroll)
			wearer - the actor using the item
			cellPos - the selected cell where the effect applies (for types SELECTED_ACTOR and SELECTED_RANGE)

			Returns:
			true if targets have been selected (else wait for TILE_SELECTED event, then call <onTileSelected>)
		*/
        selectTargets(owner: Actor, wearer: Actor, cellPos: Core.Position): boolean {
            this.__selectedTargets = [];
            let data: TilePickerEventData;
            switch (this._method) {
                case TargetSelectionMethod.WEARER:
                    this.__selectedTargets.push(wearer);
                    return true;
                case TargetSelectionMethod.WEARER_INVENTORY:
                    // check if there's only one corresponding target
                    if ( !wearer.container ) {
                        return true;
                    }
                    for (let i: number = 0, len: number = wearer.container.size(); i < len; ++i) {
                        let actor: Actor = wearer.container.get(i);
                        if (!this.actorType || actor.isA(this.actorType)) {
                            this.__selectedTargets.push(actor);
                        }
                    }
                    if ( this.__selectedTargets.length === 1 ) {
                        // auto-select item when there's only one corresponding.
                        return true;
                    } else {
                        // player must select an actor from his inventory.
                        this.__selectedTargets = [];
                        Umbra.EventManager.publishEvent(EventType[EventType.OPEN_INVENTORY], 
                            { title: "select an item", itemClassFilter:this.actorType, eventType: EventType.ACTOR_SELECTED });
                    }
                    return false;
                case TargetSelectionMethod.ACTOR_ON_CELL:
                    this.__selectedTargets = Engine.instance.actorManager.filter(function(actor: Actor): boolean {
                        return actor.pos.equals(cellPos) && actor.isA("creature");
                    });
                    return true;
                case TargetSelectionMethod.CLOSEST_ENEMY:
                    let actor = Engine.instance.actorManager.findClosestEnemy(cellPos ? cellPos : wearer.pos, this.range);
                    if (actor) {
                        this.__selectedTargets.push(actor);
                    }
                    return true;
                case TargetSelectionMethod.ACTORS_IN_RANGE:
                    this.__selectedTargets = Engine.instance.actorManager.filter(function(actor: Actor): boolean {
                        return actor.isA("creature") && Core.Position.distance(cellPos ? cellPos : wearer.pos, actor.pos) < this.range;
                    }.bind(this));
                    return true;
                case TargetSelectionMethod.SELECTED_ACTOR:
                    log("Left-click a target creature,\nor right-click to cancel.", Constants.LOG_WARN_COLOR);
                    data = { origin: new Core.Position(wearer.pos.x, wearer.pos.y), range: this._range, radius: this._radius };
                    Umbra.EventManager.publishEvent(EventType[EventType.PICK_TILE], data);
                    return false;
                case TargetSelectionMethod.SELECTED_RANGE:
                    log("Left-click a target tile,\nor right-click to cancel.", Constants.LOG_WARN_COLOR);
                    data = { origin: new Core.Position(wearer.pos.x, wearer.pos.y), 
                        range: this._range ? this._range : owner.computeThrowRange(wearer), 
                        radius: this._radius };
                    Umbra.EventManager.publishEvent(EventType[EventType.PICK_TILE], data);
                    return false;
                default :
                    return false;
            }
        }

		/**
			Function: onTileSelected
			Populates the __selectedTargets field for selection methods that require a tile selection
		*/
        onTileSelected(pos: Core.Position) {
            switch (this._method) {
                case TargetSelectionMethod.SELECTED_ACTOR:
                    this.__selectedTargets =  this.__selectedTargets = Engine.instance.actorManager.filter(function(actor: Actor): boolean {
                        return actor.pos.equals(pos) && actor.isA("creature");
                    });
                    break;
                case TargetSelectionMethod.SELECTED_RANGE:
                    this.__selectedTargets = Engine.instance.actorManager.filter(function(actor: Actor): boolean {
                        return actor.isA("creature") && Core.Position.distance(pos, actor.pos) < this._radius;
                    }.bind(this));
                    break;
            }
        }
    }

	/********************************************************************************
	 * Group: effects
	 ********************************************************************************/

	/**
		Interface: Effect
		Some effect that can be applied to actors. The effect might be triggered by using an item or casting a spell.
	*/
    export interface Effect extends Core.Persistent {
		/**
			Function: applyTo
			Apply an effect to an actor

			Parameters:
			actor - the actor this effect is applied to
			coef - a multiplicator to apply to the effect

			Returns:
			false if effect cannot be applied
		*/
        applyTo(actor: Actor, coef: number): boolean;
    }

	/**
		Class: InstantHealthEffect
		Add or remove health points.
	*/
    export class InstantHealthEffect implements Effect {
        className: string;
        private _amount: number = 0;
        private canResurrect: boolean = false;
        private successMessage: string;
        private failureMessage: string;

        get amount() { return this._amount; }

        constructor(def: InstantHealthEffectDef) {
            this.className = "Game.InstantHealthEffect";
            if ( def ) {
                this._amount = def.amount;
                this.successMessage = def.successMessage;
                this.failureMessage = def.failureMessage;
                if ( def.canResurrect !== undefined ) {
                    this.canResurrect = def.canResurrect;
                }
            }
        }

        applyTo(actor: Actor, coef: number = 1.0): boolean {
            if (!actor.destructible) {
                return false;
            }
            if (this._amount > 0) {
                if (this.canResurrect || !  actor.destructible.isDead()) {
                return this.applyHealingEffectTo(actor, coef);
                }
            }
            return this.applyWoundingEffectTo(actor, coef);
        }

        private applyHealingEffectTo(actor: Actor, coef: number = 1.0): boolean {
            let healPointsCount: number = actor.destructible.heal(actor, coef * this._amount);
            let wearer: Actor = actor.getWearer();
            if (healPointsCount > 0 && this.successMessage) {
                log(transformMessage(this.successMessage, actor, wearer, healPointsCount));
            } else if (healPointsCount <= 0 && this.failureMessage) {
                log(transformMessage(this.failureMessage, actor));
            }
            return true;
        }

        private applyWoundingEffectTo(actor: Actor, coef: number = 1.0): boolean {
            let realDefense: number = actor.destructible.computeRealDefense(actor);
            let damageDealt = -this._amount * coef - realDefense;
            let wearer: Actor = actor.getWearer();
            if (damageDealt > 0 && this.successMessage) {
                log(transformMessage(this.successMessage, actor, wearer, damageDealt));
            } else if (damageDealt <= 0 && this.failureMessage) {
                log(transformMessage(this.failureMessage, actor, wearer));
            }
            return actor.destructible.takeDamage(actor, -this._amount * coef) > 0;
        }
    }

	/**
		Class: TeleportEffect
		Teleport the target at a random location.
	*/
    export class TeleportEffect implements Effect {
        className: string;
        private successMessage: string;

        constructor(successMessage?: string) {
            this.className = "Game.TeleportEffect";
            this.successMessage = successMessage;
        }

        applyTo(actor: Actor, coef: number = 1.0): boolean {
            let x: number = Engine.instance.rng.getNumber(0, Engine.instance.map.w - 1);
            let y: number = Engine.instance.rng.getNumber(0, Engine.instance.map.h - 1);
            while (!Engine.instance.map.canWalk(x, y)) {
                x++;
                if (x === Engine.instance.map.w) {
                    x = 0;
                    y++;
                    if (y === Engine.instance.map.h) {
                        y = 0;
                    }
                }
            }
            actor.moveTo(x, y);
            if (this.successMessage) {
                log(transformMessage(this.successMessage, actor));
            }
            return true;
        }
    }

	/**
		Class: ConditionEffect
		Add a condition to an actor.
	*/
    export class ConditionEffect implements Effect {
        className: string;
        conditionDef: ConditionDef;
        private message: string;
        constructor(def: ConditionDef, message?: string) {
            this.className = "Game.ConditionEffect";
            this.message = message;
            this.conditionDef = def;
        }

        applyTo(actor: Actor, coef: number = 1.0): boolean {
            if (!actor.ai) {
                return false;
            }
            actor.ai.addCondition(Condition.create(this.conditionDef));
            if (this.message) {
                log(transformMessage(this.message, actor));
            }
            return true;
        }
    }

    export class MapRevealEffect implements Effect {
        className: string;
        constructor() {
            this.className = "Game.MapRevealEffect";
        }

        applyTo(actor: Actor, coef: number = 1.0): boolean {
            if (actor === Engine.instance.actorManager.getPlayer()) {
                Engine.instance.map.reveal();
                return true;
            }
            return false;
        }
    }

	/**
	 	Class: Effector
	 	Combines an effect and a target selector. Can also display a message before applying the effect.
	*/
    export class Effector implements Core.Persistent {
        className: string;
        private _effect: Effect;
        private targetSelector: TargetSelector;
        private message: string;
        private _coef: number;
        private destroyOnEffect: boolean;

        get effect() { return this._effect; }
        get coef() { return this._coef; }

        constructor(_effect?: Effect, _targetSelector?: TargetSelector, _message?: string, destroyOnEffect: boolean = false) {
            this.className = "Game.Effector";
            this._effect = _effect;
            this.targetSelector = _targetSelector;
            this.message = _message;
            this.destroyOnEffect = destroyOnEffect;
        }

		/**
			Function: apply
			Select targets and apply the effect.

			Returns:
			false if a tile needs to be selected (in that case, wait for TILE_SELECTED event, then call <applyOnPos>)
		*/
        apply(owner: Actor, wearer: Actor, cellPos?: Core.Position, coef: number = 1.0): boolean {
            this._coef = coef;
            if (this.targetSelector.selectTargets(owner, wearer, cellPos)) {
                this.applyEffectToActorList(owner, wearer, this.targetSelector.__selectedTargets);
                return true;
            }
            return false;
        }

		/**
			Function: applyOnActor
			apply the effect once an actor has been selected.

			Returns:
			false if no target has been selected
		*/
        applyOnActor(owner: Actor, wearer: Actor, target: Actor): boolean {
            this.targetSelector.__selectedTargets.push(target);
            this.applyEffectToActorList(owner, wearer, this.targetSelector.__selectedTargets);
            return true;
        }
        
		/**
			Function: applyOnPos
			Select targets and apply the effect once a tile has been selected.

			Returns:
			false if no target has been selected
		*/
        applyOnPos(owner: Actor, wearer: Actor, pos: Core.Position): boolean {
            this.targetSelector.onTileSelected(pos);
            if (this.targetSelector.__selectedTargets.length > 0) {
                this.applyEffectToActorList(owner, wearer, this.targetSelector.__selectedTargets);
                return true;
            } else {
                return false;
            }
        }

        private applyEffectToActorList(owner: Actor, wearer: Actor, actors: Actor[]) {
            let success: boolean = false;
            if (this.message) {
                log(transformMessage(this.message, wearer));
            }

            for (let i: number = 0, len: number = actors.length; i < len; ++i) {
                if (this._effect.applyTo(actors[i], this._coef)) {
                    success = true;
                }
            }
            if (this.destroyOnEffect && success && wearer && wearer.container) {
                // actually remove actor from actorManager
                Engine.instance.actorManager.destroyActor(owner.id);
            }
        }
    }
}
