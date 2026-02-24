import type { Entity, ScriptComponent, ScriptSlot } from "@duckengine/ecs";
import type { CollisionEventsHub } from "../physics/CollisionEventsHub";
import type SceneChangeEvent from "../scene/SceneChangeEvent";
import { SceneEventBus } from "./SceneEventBus";

export class ScriptSystem {
    public readonly eventBus = new SceneEventBus();

    // The collection of entities that currently have a ScriptComponent
    private entities = new Map<string, Entity>();
    // To cleanup collision subscriptions when entities are removed
    private collisionUnsubs = new Map<string, () => void>();

    constructor(private collisionEvents?: CollisionEventsHub) { }

    public registerEntity(entity: Entity): void {
        const sc = entity.getComponent<ScriptComponent>("script");
        if (!sc) return;
        this.entities.set(entity.id, entity);
        this.subscribeCollisionsIfNeeded(entity, sc);
    }

    public unregisterEntity(entityId: string): void {
        const entity = this.entities.get(entityId);
        if (!entity) return;

        const sc = entity.getComponent<ScriptComponent>("script");
        if (sc) {
            for (const slot of sc.getSlots()) {
                this.eventBus.unsubscribeAll(slot.slotId);
                // TODO: call onDestroy hook via LuaSandbox in Phase 3
            }
        }

        this.entities.delete(entityId);

        // Cleanup physics subscription
        const unsub = this.collisionUnsubs.get(entityId);
        if (unsub) {
            unsub();
            this.collisionUnsubs.delete(entityId);
        }
    }

    private subscribeCollisionsIfNeeded(entity: Entity, scriptComponent: ScriptComponent) {
        if (!this.collisionEvents) return;

        // TODO: In Phase 3 we will check if the Lua hooks actually exist before subscribing.
        // For now in Phase 2, we just check if it has a rigidbody or collider. 
        // This will be expanded in Phase 3 once LuaSandbox gives us the hooks.
        const hasPhysicsBody = entity.hasComponent("rigidBody") ||
            entity.hasComponent("sphereCollider") ||
            entity.hasComponent("boxCollider") ||
            entity.hasComponent("capsuleCollider") ||
            entity.hasComponent("cylinderCollider") ||
            entity.hasComponent("coneCollider") ||
            entity.hasComponent("terrainCollider");
        if (!hasPhysicsBody) return;

        // Simplified subscription for Phase 2 before Lua comes in
        const unsub = this.collisionEvents.onEntity(entity.id, (ev) => {
            // In Phase 3 we will call `onCollisionEnter`/`onCollisionExit` hooks here
        });

        this.collisionUnsubs.set(entity.id, unsub);
    }

    public earlyUpdate(dt: number): void {
        for (const entity of this.entities.values()) {
            const sc = entity.getComponent<ScriptComponent>("script");
            if (!sc || !sc.enabled) continue;
            for (const slot of sc.getSlots()) {
                if (!slot.enabled) continue;
                // TODO: Call Lua earlyUpdate
            }
        }
    }

    public update(dt: number): void {
        for (const entity of this.entities.values()) {
            const sc = entity.getComponent<ScriptComponent>("script");
            if (!sc || !sc.enabled) continue;
            for (const slot of sc.getSlots()) {
                if (!slot.enabled) continue;
                // TODO: Call Lua update
            }
        }
    }

    public lateUpdate(dt: number): void {
        for (const entity of this.entities.values()) {
            const sc = entity.getComponent<ScriptComponent>("script");
            if (!sc || !sc.enabled) continue;
            for (const slot of sc.getSlots()) {
                if (!slot.enabled) continue;
                // TODO: Call Lua lateUpdate
            }
        }
    }

    private sceneUnsub?: () => void;

    public setup(allEntities: Map<string, Entity>, scene: { subscribeChanges: (listener: (ev: SceneChangeEvent) => void) => () => void }): void {
        for (const entity of allEntities.values()) {
            if (entity.hasComponent("script")) {
                this.registerEntity(entity);
            }
        }

        this.sceneUnsub = scene.subscribeChanges(ev => {
            if (ev.kind === "entity-added") {
                this.registerEntity(ev.entity);
            } else if (ev.kind === "entity-removed") {
                this.unregisterEntity(ev.entityId);
            } else if (ev.kind === "component-changed" && ev.componentType === "script") {
                const ent = allEntities.get(ev.entityId);
                if (ent) {
                    const hasScript = ent.hasComponent("script");
                    const registered = this.entities.has(ent.id);
                    if (hasScript && !registered) this.registerEntity(ent);
                    else if (!hasScript && registered) this.unregisterEntity(ent.id);
                }
            }
        });

        // TODO: In Phase 3, this is where we compile scripts and run `init()`
        this.eventBus.fire("SceneReady");
    }

    public teardown(): void {
        this.sceneUnsub?.();
        this.sceneUnsub = undefined;

        for (const entityId of Array.from(this.entities.keys())) {
            this.unregisterEntity(entityId);
        }
        this.eventBus.dispose();
    }
}
