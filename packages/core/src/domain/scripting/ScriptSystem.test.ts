import { Entity, ScriptComponent } from "@duckengine/ecs";
import { ScriptSystem } from "./ScriptSystem";
import type { CollisionEventsHub } from "../physics/CollisionEventsHub";
import type SceneChangeEvent from "../scene/SceneChangeEvent";

jest.mock("wasmoon");

describe("ScriptSystem", () => {
    let system: ScriptSystem;
    let collisionEvents: jest.Mocked<CollisionEventsHub>;
    let mockScene: any;
    let allEntities: Map<string, Entity>;

    beforeEach(() => {
        collisionEvents = {
            onEntity: jest.fn().mockReturnValue(jest.fn()),
        } as any;

        mockScene = {
            subscribeChanges: jest.fn().mockReturnValue(jest.fn())
        };

        allEntities = new Map<string, Entity>();
        const mockComponentFactory = { listCreatableComponents: jest.fn().mockReturnValue([]), create: jest.fn() } as any;
        system = new ScriptSystem(mockComponentFactory, 'game', undefined, collisionEvents);
    });

    afterEach(() => {
        system.teardown();
    });

    it("registers entities with ScriptComponent", async () => {
        const e1 = new Entity("e1");
        // add ScriptComponent
        const sc1 = new ScriptComponent();
        e1.addComponent(sc1 as any);
        allEntities.set(e1.id, e1);

        const e2 = new Entity("e2");
        allEntities.set(e2.id, e2);

        await system.setupAsync(allEntities, mockScene);

        // we can observe side-effects like eventBus or collisionEvents
        // e1 has no physics body so it shouldn't call onEntity
        expect(collisionEvents.onEntity).not.toHaveBeenCalled();
    });

    it("subscribes to collisions if entity has physics body", async () => {
        const e1 = new Entity("phys-ent");
        const sc = new ScriptComponent();
        sc.addSlot({
            slotId: "test-slot",
            scriptId: "test-script",
            enabled: true,
            properties: {},
            executionOrder: 0
        });
        e1.addComponent(sc as any);
        e1.addComponent({
            type: "rigidBody",
            metadata: { type: "rigidBody", unique: true, requires: [], conflicts: [] },
            getEntityId: () => e1.id,
            setEntityId: () => { }
        } as any);

        allEntities.set(e1.id, e1);

        await system.setupAsync(allEntities, mockScene);

        expect(collisionEvents.onEntity).toHaveBeenCalledWith("phys-ent", expect.any(Function));
    });

    it("teardown unsubscribes from the scene", async () => {
        const unsub = jest.fn();
        mockScene.subscribeChanges.mockReturnValue(unsub);
        await system.setupAsync(allEntities, mockScene);

        system.teardown();
        expect(unsub).toHaveBeenCalled();
    });

    it("executing phases traverses components", async () => {
        // Here we just test it doesn't crash since execution requires LuaSandbox (Phase 3)
        const e = new Entity("e1");
        e.addComponent(new ScriptComponent() as any);
        allEntities.set(e.id, e);

        await system.setupAsync(allEntities, mockScene);

        expect(() => system.earlyUpdate(16)).not.toThrow();
        expect(() => system.update(16)).not.toThrow();
        expect(() => system.lateUpdate(16)).not.toThrow();
    });
});
