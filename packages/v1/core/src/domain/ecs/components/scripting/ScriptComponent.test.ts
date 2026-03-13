import { ScriptComponent } from "./ScriptComponent";

describe("ScriptComponent", () => {
    it("initializes with empty slots array if no params provided", () => {
        const comp = new ScriptComponent();
        expect(comp.getSlots()).toEqual([]);
    });

    it("adds slots and orders them by executionOrder", () => {
        const comp = new ScriptComponent();
        const slotId1 = comp.addSlot("scriptC");
        const slotId2 = comp.addSlot("scriptA");
        const slotId3 = comp.addSlot("scriptB");

        const slots = comp.getSlots();
        expect(slots.length).toBe(3);
        expect(slots[0].scriptId).toBe("scriptA");
        expect(slots[1].scriptId).toBe("scriptB");
        expect(slots[2].scriptId).toBe("scriptC");
    });

    it("removes a slot by slotId", () => {
        const comp = new ScriptComponent();
        const slotId1 = comp.addSlot("s1");
        const slotId2 = comp.addSlot("s2");

        expect(comp.getSlots().length).toBe(2);
        comp.removeSlot(slotId1);

        expect(comp.getSlots().length).toBe(1);
        expect(comp.getSlots()[0].slotId).toBe(slotId2);
    });

    it("update is a no-op", () => {
        const comp = new ScriptComponent();
        expect(() => comp.update(16)).not.toThrow();
    });
});
