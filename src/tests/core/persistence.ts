import * as tsUnit from "../../tests/tsUnit";
import * as Yendor from "../../fwk/yendor/main";

export class PersistenceTests extends tsUnit.TestClass {
    public localStorage() {
        this.__persistenceTest(new Yendor.LocalStoragePersister());
    }

    public indexedDb() {
        this.__persistenceTest(new Yendor.IndexedDbPersister());
    }

    private __persistenceTest(persister: Yendor.IPersister) {
        persister.saveToKey("test1", {data1: "test", data2: 128}).then(() => {
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
