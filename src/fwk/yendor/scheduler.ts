/**
	Section: Scheduler
*/
import { BinaryHeap } from "./heap";
/**
    Class: TimedEntity
    Something that must be updated every once in a while
*/
export abstract class TimedEntity {
    /**
        Field: _nextActionTime
        Time when the next update() should be called. This is an arbitrary value.
    */
    private _nextActionTime: number = 0;

    getNextActionTime(): number { return this._nextActionTime; }

    /**
        Function: update
        Update the entity and call <wait()>.
    */
    abstract update(): void;

    wait(time: number) {
        this._nextActionTime += time;
    }
}
/**
    Class: Scheduler
    Handles timed entities and the order in which they are updated. This class stores a sorted list of entities by waitTime.
    Each time <run> is called, the game time advances by the lowest entity wait time amount.
    Every entity with a _nextActionTime in the past is pulled out of the list, updated (which should set its _nextActionTime in the future again),
    then put back in the list.

    <TimedEntity.wait> should not be called outside of the <update()> function, else the scheduler's list is not sorted anymore.
    <Scheduler.remove(entity: TimedEntity)> can be called inside the <update()> function to remove an entity from the scheduler
    (for example when a creature dies and shouldn't be updated anymore).
*/
export class Scheduler {
    private entities: BinaryHeap<TimedEntity>;
    private paused: boolean = false;
    /** entity being currently updated */
    private currentEntity: TimedEntity;
    private currentTime: number = 0;

    constructor() {
        this.entities = new BinaryHeap<TimedEntity>((entity: TimedEntity) => {
            return entity.getNextActionTime();
        });
    }

    /**
        Function: add
    */
    add(entity: TimedEntity) {
        if ( !this.entities.contains(entity)) {
            this.entities.push(entity);
            if ( entity.getNextActionTime() < this.currentTime ) {
                entity.wait(this.currentTime - entity.getNextActionTime());
            }
        }
    }

    /**
        Function: addAll
    */
    addAll(entities: TimedEntity[]) {
        this.entities.pushAll(entities);
    }

    /**
        Functin: contains
    */
    contains(entity: TimedEntity) {
        return this.entities.contains(entity);
    }

    /**
        Function: remove
    */
    remove(entity: TimedEntity) {
        if ( entity === this.currentEntity ) {
            this.currentEntity = undefined;
        } else {
            this.entities.remove(entity);
        }
    }

    /**
        Function: clear
        Remove all timed entities from the scheduler.
    */
    clear() {
        this.entities.clear();
    }

    /**
        Function: pause
        Calling <run> has no effect until <resume> is called. You can use this to wait for a keypress in turn by turn games.
    */
    pause() {
        this.paused = true;
    }

    /**
        Function: resume
    */
    resume() {
        this.paused = false;
    }

    /**
        Function: isPaused
    */
    isPaused() {
        return this.paused;
    }

    /**
        Function: run
        Update all entities that are ready and put them back in the sorted queue.

        The update function should increase the entity waitTime.
    */
    run() {
        if (this.paused || this.entities.isEmpty()) {
            return;
        }
        this.currentTime = this.entities.peek().getNextActionTime();
        // update all entities with wait time <= 0
        let entitiesToPushBack: TimedEntity[] = [];
        /** the entity that called scheduler.pause() during its update */
        let pausingEntity: TimedEntity;
        while (!this.entities.isEmpty() && this.entities.peek().getNextActionTime() <= this.currentTime) {
            this.currentEntity = this.entities.pop();
            let oldTime = this.currentEntity.getNextActionTime();
            this.currentEntity.update();
            if (this.paused && pausingEntity === undefined) {
                pausingEntity = this.currentEntity;
            } else if ( this.currentEntity !== undefined ) {
                // currentEntity is undefined if it was removed from scheduler during its update
                if (!this.paused && this.currentEntity.getNextActionTime() === oldTime) {
                    console.log("WARNING : scheduler : entity didn't wait after update");
                    this.currentEntity.wait(1);
                }
                entitiesToPushBack.push(this.currentEntity);
            }
            this.currentEntity = undefined;
        }
        this.entities.pushAll(entitiesToPushBack);
        if ( pausingEntity ) {
            // push pausing entity last so that it's updated first on next run
            this.entities.push(pausingEntity);
        }
    }
}
