/*
	Section: Scheduler.
*/
module Yendor {
	"use strict";

	/*
		Enum: EntityUpdateResult
		What to do after updating an entity

		CONTINUE - put back the entity in the queue
		REMOVE - stop scheduling this entity (typically when a creature dies)
		PAUSE - stop updating entities (typically to wait for a keypress when it's the player's turn)
	*/
	export enum EntityUpdateResult {
		CONTINUE,
		REMOVE,
		PAUSE
	};

	/*
		Interface: TimedEntity
		Something that must be updated every once in a while
	*/
	export interface TimedEntity {
		/*
			Function: update
			Update the entity and set its new waitTime

			Returns:
			what to do next (see <EntityUpdateResult>)
		*/
		update(): EntityUpdateResult;

		/*
			Property: waitTime
			Time until the next update() call. This represents the number of times 
			<Scheduler.run()> must be called before this entity is updated again.
		*/
		waitTime: number;
	}
	/*
		Class: Scheduler
		Handles timed entities and the order in which they are updated
	*/
	export class Scheduler {
		private entities: BinaryHeap<TimedEntity>;
		private paused: boolean = false;

		constructor() {
			this.entities = new BinaryHeap<TimedEntity>((entity: TimedEntity) => {
				return entity.waitTime;
			});
		}

		add(entity: TimedEntity) {
			this.entities.push(entity);
		}

		addAll(entities: TimedEntity[]) {
			this.entities.pushAll(entities);
		}

		pause() {
			this.paused = true;
		}
		resume() {
			this.paused = false;
		}
		run() {
			if ( this.paused || this.entities.isEmpty() ) {
				return;
			}
			var entitiesToPush : TimedEntity[] = [];
			do {
				var entity: TimedEntity = this.entities.pop();
				var result: EntityUpdateResult = EntityUpdateResult.CONTINUE;
				entity.waitTime --;
				if ( entity.waitTime <= 0 ) {
					result = entity.update();
				}
				if (result !== EntityUpdateResult.REMOVE) {
					entitiesToPush.push(entity);
				}
				if ( result === EntityUpdateResult.PAUSE ) {
					this.pause();
					break;
				}
			} while (! this.entities.isEmpty());
			this.entities.pushAll(entitiesToPush);
		}
	}
}
