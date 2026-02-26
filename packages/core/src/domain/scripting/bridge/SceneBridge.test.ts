import { registerSceneBridge } from "./SceneBridge";
import type { BridgeContext } from "./BridgeContext";
import { SceneEventBus } from "../SceneEventBus";
import { Entity } from "../../ecs";

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
            getEventBus: jest.fn().mockReturnValue(eventBus),
            componentFactory: { listCreatableComponents: jest.fn().mockReturnValue([]), create: jest.fn() } as any
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("registers scene api", () => {
        registerSceneBridge(mockEngine, mockCtx);
        expect(mockEngine.global.set).toHaveBeenCalledWith("scene", expect.any(Object));
        expect(sceneApi).toBeDefined();
        expect(sceneApi.fireEvent).toBeDefined();
        expect(sceneApi.findEntityByName).toBeUndefined(); // Verify it was removed
    });

    it("registers editor api and finds entity by name", () => {
        let editorApi: any;
        const mockEngineEditor = {
            global: {
                get: jest.fn((key) => {
                    if (key === '__WrapEntity') return (id: string) => id;
                    return null;
                }),
                set: jest.fn((key, value) => {
                    if (key === "editor") editorApi = value;
                })
            }
        };

        const { registerEditorBridge } = require("./SceneBridge");
        registerEditorBridge(mockEngineEditor, mockCtx);

        expect(mockEngineEditor.global.set).toHaveBeenCalledWith("editor", expect.any(Object));
        expect(editorApi).toBeDefined();

        const e = new Entity("e1");
        e.displayName = "Player";
        mockCtx.getAllEntities.mockReturnValue([e]);

        expect(editorApi.findEntityByName("Player")).toBe("e1");
        expect(editorApi.findEntityByName("Enemy")).toBeNull();
    });

    it("fires events", () => {
        registerSceneBridge(mockEngine, mockCtx);
        sceneApi.fireEvent("TestEvent", { foo: "bar" });
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
});
