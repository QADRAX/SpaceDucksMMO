import { registerTransformBridge } from "./TransformBridge";
import type { BridgeContext } from "./BridgeContext";
import { Entity, Transform } from "@duckengine/ecs";

describe("TransformBridge", () => {
    let mockEngine: any;
    let mockCtx: jest.Mocked<BridgeContext>;
    let transformApi: any;

    beforeEach(() => {
        mockEngine = {
            global: {
                set: jest.fn((key, value) => {
                    if (key === "transform") transformApi = value;
                })
            }
        };

        mockCtx = {
            getEntity: jest.fn(),
            getAllEntities: jest.fn(),
            getEventBus: jest.fn(),
            componentFactory: { listCreatableComponents: jest.fn().mockReturnValue([]), create: jest.fn() } as any
        };
    });

    it("registers transform api to global engine", () => {
        registerTransformBridge(mockEngine, mockCtx);
        expect(mockEngine.global.set).toHaveBeenCalledWith("transform", expect.any(Object));
        expect(transformApi).toBeDefined();
    });

    it("gets and sets entity position", () => {
        registerTransformBridge(mockEngine, mockCtx);

        const ent = new Entity("ent-1");
        mockCtx.getEntity.mockReturnValue(ent);

        const selfCtx = { id: "ent-1", slotId: "s1", state: {}, properties: {}, getComponent: jest.fn() };

        transformApi.setPosition(selfCtx, 10, 20, 30);
        expect(ent.transform.localPosition).toEqual({ x: 10, y: 20, z: 30 });

        const p = transformApi.getPosition(selfCtx);
        expect(p).toEqual({ x: 10, y: 20, z: 30 });
    });

    it("handles missing entity gracefully", () => {
        registerTransformBridge(mockEngine, mockCtx);
        mockCtx.getEntity.mockReturnValue(undefined);
        const selfCtx = { id: "missing", slotId: "s1", state: {}, properties: {}, getComponent: jest.fn() };

        expect(() => transformApi.setPosition(selfCtx, 1, 1, 1)).not.toThrow();
        expect(transformApi.getPosition(selfCtx)).toEqual({ x: 0, y: 0, z: 0 });
    });
});
