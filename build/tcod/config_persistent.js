define(["require", "exports", "../fwk/yendor/main", "../fwk/actors/main", "../fwk/map/main"], function (require, exports, Yendor, Actors, Map) {
    "use strict";
    function registerPersistentClasses() {
        Yendor.Persistence.registerClass(Actors.Condition);
        Yendor.Persistence.registerClass(Actors.HealthVariationCondition);
        Yendor.Persistence.registerClass(Actors.DetectLifeCondition);
        Yendor.Persistence.registerClass(Actors.FrozenCondition);
        Yendor.Persistence.registerClass(Actors.StunnedCondition);
        Yendor.Persistence.registerClass(Actors.TargetSelector);
        Yendor.Persistence.registerClass(Actors.Effector);
        Yendor.Persistence.registerClass(Actors.Actor);
        Yendor.Persistence.registerClass(Map.TopologyMap);
        Yendor.Persistence.registerClass(Map.Sector);
        Yendor.Persistence.registerClass(Map.Connector);
        Yendor.Persistence.registerClass(Actors.EventEffect);
        Yendor.Persistence.registerClass(Map.Connector);
        Yendor.Persistence.registerClass(Actors.ConditionEffect);
        Yendor.Persistence.registerClass(Actors.InstantHealthEffect);
        Yendor.Persistence.registerClass(Actors.MapRevealEffect);
        Yendor.Persistence.registerClass(Actors.TeleportEffect);
        Yendor.Persistence.registerClass(Actors.Destructible);
        Yendor.Persistence.registerClass(Actors.Attacker);
        Yendor.Persistence.registerClass(Actors.Activable);
        Yendor.Persistence.registerClass(Actors.Container);
        Yendor.Persistence.registerClass(Actors.Pickable);
        Yendor.Persistence.registerClass(Actors.Equipment);
        Yendor.Persistence.registerClass(Actors.Ranged);
        Yendor.Persistence.registerClass(Actors.Magic);
        Yendor.Persistence.registerClass(Actors.Lockable);
        Yendor.Persistence.registerClass(Actors.Door);
        Yendor.Persistence.registerClass(Actors.Lever);
        Yendor.Persistence.registerClass(Actors.BaseAi);
        Yendor.Persistence.registerClass(Actors.XpHolder);
        Yendor.Persistence.registerClass(Actors.ItemAi);
        Yendor.Persistence.registerClass(Actors.MonsterAi);
        Yendor.Persistence.registerClass(Actors.PlayerAi);
        Yendor.Persistence.registerClass(Actors.Light);
    }
    exports.registerPersistentClasses = registerPersistentClasses;
});
//# sourceMappingURL=config_persistent.js.map