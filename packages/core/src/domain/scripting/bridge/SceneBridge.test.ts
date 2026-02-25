import { registerSceneBridge } from "./SceneBridge";
import type { BridgeContext } from "./BridgeContext";
import { SceneEventBus } from "../SceneEventBus";
import { Entity } from "@duckengine/ecs";

describe("SceneBridge", () => {
    let mockEngine: any;
    let mockCtx: jest.Mocked<BridgeContext>;
    let sceneApi: any;
    let eventBus: SceneEventBus;

    beforeEach(() => {
        mockEngine = {
            global: {
                set: jest.fn((key, value) => {
                    if (key === "scene") sceneApi = value;
                })
            }
        };

        eventBus = new SceneEventBus();

        mockCtx = {
            getEntity: jest.fn(),
            getAllEntities: jest.fn(),
            getEventBus: jest.fn().mockReturnValue(eventBus)
        };
    });

    it("registers scene api", () => {
        registerSceneBridge(mockEngine, mockCtx);
        expect(mockEngine.global.set).toHaveBeenCalledWith("scene", expect.any(Object));
    });

    it("fires events", () => {
        registerSceneBridge(mockEngine, mockCtx);
        sceneApi.fireEvent("TestEvent", { foo: "bar" });
        // Event bus queue should have 1 item
        // But since SceneEventBus doesn't expose queue, we can just spy on fire
        const spy = jest.spyOn(eventBus, "fire");
        sceneApi.fireEvent("TestEvent2", { a: 1 });
        expect(spy).toHaveBeenCalledWith("TestEvent2", { a: 1 });
    });

    it("subscribes to events", () => {
        registerSceneBridge(mockEngine, mockCtx);
        const selfCtx = { id: "ent", slotId: "slot-1", state: {}, properties: {}, getComponent: jest.fn() };

        const listener = jest.fn();
        sceneApi.onEvent(selfCtx, "CustomEvent", listener);

        eventBus.fire("CustomEvent", { data: 123 });
        eventBus.flush();

        expect(listener).toHaveBeenCalledWith({ data: 123 });
    });

    it("finds entity by name", () => {
        registerSceneBridge(mockEngine, mockCtx);
        const e = new Entity("e1");
        e.displayName = "Player";
        mockCtx.getAllEntities.mockReturnValue([e]);

        expect(sceneApi.findEntityByName("Player")).toBe("e1");
        expect(sceneApi.findEntityByName("Enemy")).toBeNull();
    });
});
