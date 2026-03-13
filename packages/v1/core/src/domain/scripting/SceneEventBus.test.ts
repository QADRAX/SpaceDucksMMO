import { SceneEventBus } from "./SceneEventBus";

describe("SceneEventBus", () => {
    let eventBus: SceneEventBus;

    beforeEach(() => {
        eventBus = new SceneEventBus();
    });

    afterEach(() => {
        eventBus.dispose();
    });

    it("subscribes and receives events on flush", () => {
        const callback = jest.fn();
        eventBus.subscribe("TestEvent", "slot1", callback);

        eventBus.fire("TestEvent", { score: 10 });
        expect(callback).not.toHaveBeenCalled(); // async delivery

        eventBus.flush();
        expect(callback).toHaveBeenCalledWith({ score: 10 });
        expect(callback).toHaveBeenCalledTimes(1);
    });

    it("can unsubscribe via returned function", () => {
        const callback = jest.fn();
        const unsub = eventBus.subscribe("TestEvent", "slot1", callback);

        unsub();
        eventBus.fire("TestEvent");
        eventBus.flush();
        expect(callback).not.toHaveBeenCalled();
    });

    it("unsubscribeAll removes all subscriptions for a given slot", () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        eventBus.subscribe("EventA", "slot1", callback1);
        eventBus.subscribe("EventB", "slot1", callback2);

        const callback3 = jest.fn();
        eventBus.subscribe("EventA", "slot2", callback3); // different slot

        eventBus.unsubscribeAll("slot1");

        eventBus.fire("EventA");
        eventBus.fire("EventB");
        eventBus.flush();

        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).not.toHaveBeenCalled();
        expect(callback3).toHaveBeenCalled();
    });

    it("defers events fired during flush to the next flush cycle", () => {
        const firstCall = jest.fn((data) => {
            // simulate firing another event from within a handler
            eventBus.fire("SecondEvent");
        });
        const secondCall = jest.fn();

        eventBus.subscribe("FirstEvent", "slot1", firstCall);
        eventBus.subscribe("SecondEvent", "slot2", secondCall);

        eventBus.fire("FirstEvent");
        eventBus.flush();

        expect(firstCall).toHaveBeenCalledTimes(1);
        // Should not have been called yet because it was enqueued during flush
        expect(secondCall).not.toHaveBeenCalled();

        // Now call flush again to process the SecondEvent
        eventBus.flush();
        expect(secondCall).toHaveBeenCalledTimes(1);
    });
});
