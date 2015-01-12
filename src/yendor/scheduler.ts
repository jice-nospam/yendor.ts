/*
	Section: Scheduler
*/
module Yendor {
	"use strict";

	/*
		Interface: TimedEntity
		Something that must be updated every once in a while
	*/
	export interface TimedEntity {
		/*
			Function: update
			Update the entity and set its new waitTime.
			Any call to update MUST increase waitTime to keep the creature from locking the scheduler.
		*/
		update();

		/*
			Property: waitTime
			Time until the next update() call. This is an arbitrary value.
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

		/*
			Function: add
		*/
		add(entity: TimedEntity) {
			this.entities.push(entity);
		}

		/*
			Function: addAll
		*/
		addAll(entities: TimedEntity[]) {
			this.entities.pushAll(entities);
		}

		/*
			Function: remove
		*/
		remove(entity: TimedEntity) {
			this.entities.remove(entity);
		}

		/*
			Function: clear
			Remove all timed entities from the scheduler.
		*/
		clear() {
			this.entities.clear();
		}

		/*
			Function: pause
			Calling <run> has no effect until <resume> is called. You can use this to wait for a keypress in turn by turn games.
		*/
		pause() {
			this.paused = true;
		}

		/*
			Function: resume
		*/
		resume() {
			this.paused = false;
		}

		/*
			Function: isPaused
		*/
		isPaused() {
			return this.paused;
		}

		/*
			Function: run
			Update all entities that are ready and put them back in the sorted queue.

			The update function should increase the entity waitTime.
		*/
		run() {
			if ( this.paused || this.entities.isEmpty() ) {
				return;
			}
			// decrease all entities' wait time
			var elapsed = this.entities.peek().waitTime;
			if ( elapsed > 0 ) {
				for (var i: number = 0, len: number = this.entities.size(); i < len; ++i) {
					this.entities.peek(i).waitTime -= elapsed;
				}
			}
			// update all entities with wait time <= 0
			var updatedEntities: TimedEntity[] = [];
			var entity: TimedEntity = this.entities.peek();
			while ( entity && entity.waitTime <= 0 ) {
				updatedEntities.push(entity);
				this.entities.pop();
				var oldWaitTime = entity.waitTime;
				entity.update();
				if ( entity.waitTime <= oldWaitTime ) {
					// enforce waitTime to avoid deadlock
					entity.waitTime = oldWaitTime + 1;
				}
				entity = this.entities.peek();
			}
			// push updated entities back to the heap
			this.entities.pushAll(updatedEntities);
		}
	}
}
