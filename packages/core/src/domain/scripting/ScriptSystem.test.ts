import { Entity, ScriptComponent } from "@duckengine/ecs";
import { ScriptSystem } from "./ScriptSystem";
import type { CollisionEventsHub } from "../physics/CollisionEventsHub";
import type SceneChangeEvent from "../scene/SceneChangeEvent";

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
        system = new ScriptSystem(collisionEvents);
    });

    afterEach(() => {
        system.teardown();
    });

    it("registers entities with ScriptComponent", () => {
        const e1 = new Entity("e1");
        // add ScriptComponent
        const sc1 = new ScriptComponent();
        e1.addComponent(sc1 as any);
        allEntities.set(e1.id, e1);

        const e2 = new Entity("e2");
        allEntities.set(e2.id, e2);

        system.setup(allEntities, mockScene);

        // we can observe side-effects like eventBus or collisionEvents
        // e1 has no physics body so it shouldn't call onEntity
        expect(collisionEvents.onEntity).not.toHaveBeenCalled();
    });

    it("subscribes to collisions if entity has physics body", () => {
        const e1 = new Entity("phys-ent");
        const sc = new ScriptComponent();
        e1.addComponent(sc as any);
        e1.addComponent({
            type: "rigidBody",
            metadata: { type: "rigidBody", unique: true, requires: [], conflicts: [] },
            getEntityId: () => e1.id,
            setEntityId: () => { }
        } as any);

        allEntities.set(e1.id, e1);

        system.setup(allEntities, mockScene);

        expect(collisionEvents.onEntity).toHaveBeenCalledWith("phys-ent", expect.any(Function));
    });

    it("teardown unsubscribes from the scene", () => {
        const unsub = jest.fn();
        mockScene.subscribeChanges.mockReturnValue(unsub);
        system.setup(allEntities, mockScene);

        system.teardown();
        expect(unsub).toHaveBeenCalled();
    });

    it("executing phases traverses components", () => {
        // Here we just test it doesn't crash since execution requires LuaSandbox (Phase 3)
        const e = new Entity("e1");
        e.addComponent(new ScriptComponent() as any);
        allEntities.set(e.id, e);

        system.setup(allEntities, mockScene);

        expect(() => system.earlyUpdate(16)).not.toThrow();
        expect(() => system.update(16)).not.toThrow();
        expect(() => system.lateUpdate(16)).not.toThrow();
    });
});
