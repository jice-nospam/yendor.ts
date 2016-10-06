/*
    Type: ActorId
    The CRC32 hashed value of the actor's readable id.
*/
export type ActorId = number;

export enum ActorFeatureTypeEnum {
    /** can be destroyed/killed */
    DESTRUCTIBLE = 1,
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

export interface IActorFeature {
}
