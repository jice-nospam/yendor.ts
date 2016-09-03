import * as tsUnit from "../../tests/tsUnit";
import * as Core from "../../fwk/core/main";

export class PersistenceTests extends tsUnit.TestClass {
    localStorage() {
        this.__persistenceTest(new Core.LocalStoragePersister());
    }

    indexedDb() {
        this.__persistenceTest(new Core.IndexedDbPersister());
    }

    private __persistenceTest(persister: Core.Persister) {
        persister.saveToKey("test1", {data1:"test", data2: 128}).then(() => {
            return persister.loadFromKey("test1");
        }).then((value) => {
            this.isTrue(value.data1 === "test");
            this.isTrue(value.data2 === 128);
            return persister.deleteKey("test1");
        }).then(() => {
            return persister.loadFromKey("test1");
        }).then((value) => {
            this.isTrue(value === undefined);
        });
    }
}
