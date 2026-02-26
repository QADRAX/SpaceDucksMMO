import { ScriptComponent } from "./ScriptComponent";
import { createScriptSlot } from "./ScriptSlot";

describe("ScriptComponent", () => {
    it("initializes with empty slots array if no params provided", () => {
        const comp = new ScriptComponent();
        expect(comp.getSlots()).toEqual([]);
    });

    it("adds slots and orders them by executionOrder", () => {
        const comp = new ScriptComponent();
        comp.addSlot(createScriptSlot("scriptC", {}, 10));
        comp.addSlot(createScriptSlot("scriptA", {}, 0));
        comp.addSlot(createScriptSlot("scriptB", {}, 5));

        const slots = comp.getSlots();
        expect(slots.length).toBe(3);
        expect(slots[0].scriptId).toBe("scriptA");
        expect(slots[1].scriptId).toBe("scriptB");
        expect(slots[2].scriptId).toBe("scriptC");
    });

    it("removes a slot by slotId", () => {
        const comp = new ScriptComponent();
        const slot1 = createScriptSlot("s1", {}, 0);
        const slot2 = createScriptSlot("s2", {}, 0);
        comp.addSlot(slot1);
        comp.addSlot(slot2);

        expect(comp.getSlots().length).toBe(2);
        comp.removeSlot(slot1.slotId);

        expect(comp.getSlots().length).toBe(1);
        expect(comp.getSlots()[0].slotId).toBe(slot2.slotId);
    });

    it("update is a no-op", () => {
        const comp = new ScriptComponent();
        expect(() => comp.update(16)).not.toThrow();
    });
});
