import type { Entity, ScriptComponent } from "../ecs";
import type { ScriptInstanceManager } from "./ScriptInstanceManager";
import type { ScriptRuntime } from "./ScriptRuntime";
import type { SceneEventBus } from "./SceneEventBus";
import type { IGizmoRenderer } from "../ports/IGizmoRenderer";

/**
 * Orchestrates the execution of script lifecycle hooks.
 * 
 * @remarks
 * This class is responsible for:
 * - Calling earlyUpdate, update, lateUpdate hooks on all active slots
 * - Syncing properties before hook execution
 * - Flushing the event bus after each phase
 * - Calling drawGizmos hooks for debug visualization
 * - Disabling slots when hooks fail
 * 
 * Extracted from ScriptSystem to follow Single Responsibility Principle.
 */
export class ScriptLifecycleOrchestrator {
    constructor(
        private instanceManager: ScriptInstanceManager,
        private runtime: ScriptRuntime,
        private eventBus: SceneEventBus,
        private gizmoRenderer?: IGizmoRenderer,
        private timeBridgeSync?: { setDelta: (dt: number) => void; getScale: () => number }
    ) { }

    /**
     * Executes the earlyUpdate phase.
     * 
     * @remarks
     * This phase:
     * 1. Syncs properties (detects changes and triggers onPropertyChanged)
     * 2. Calls earlyUpdate hook with delta time
     * 3. Flushes the event bus
     * 
     * @param entities - All entities to process
     * @param dt - Delta time in milliseconds
     */
    public earlyUpdate(entities: Iterable<Entity>, dt: number): void {
        this.timeBridgeSync?.setDelta(dt);

        for (const entity of entities) {
            const sc = entity.getComponent<ScriptComponent>("script");
            if (!sc || !sc.enabled) continue;

            for (const slot of sc.getSlots()) {
                if (!slot.enabled) continue;

                // Sync properties BEFORE executing the hook
                this.instanceManager.syncProperties(slot);

                const instance = this.instanceManager.getInstance(slot.slotId);
                if (instance?.earlyUpdate) {
                    if (!this.runtime.callHook(slot.slotId, "earlyUpdate", dt)) {
                        slot.enabled = false;
                    }
                }
            }
        }

        this.eventBus.flush();
    }

    /**
     * Executes the update phase.
     * 
     * @remarks
     * This phase calls update hook with delta time.
     * Property sync happens once per frame in earlyUpdate.
     * 
     * @param entities - All entities to process
     * @param dt - Delta time in milliseconds
     */
    public update(entities: Iterable<Entity>, dt: number): void {
        this.timeBridgeSync?.setDelta(dt);

        for (const entity of entities) {
            const sc = entity.getComponent<ScriptComponent>("script");
            if (!sc || !sc.enabled) continue;

            for (const slot of sc.getSlots()) {
                if (!slot.enabled) continue;

                const instance = this.instanceManager.getInstance(slot.slotId);
                if (instance?.update) {
                    if (!this.runtime.callHook(slot.slotId, "update", dt)) {
                        slot.enabled = false;
                    }
                }
            }
        }
    }

    /**
     * Executes the lateUpdate phase.
     * 
     * @remarks
     * This phase calls lateUpdate hook with delta time.
     * Property sync happens once per frame in earlyUpdate.
     * 
     * @param entities - All entities to process
     * @param dt - Delta time in milliseconds
     */
    public lateUpdate(entities: Iterable<Entity>, dt: number): void {
        this.timeBridgeSync?.setDelta(dt);

        for (const entity of entities) {
            const sc = entity.getComponent<ScriptComponent>("script");
            if (!sc || !sc.enabled) continue;

            for (const slot of sc.getSlots()) {
                if (!slot.enabled) continue;

                const instance = this.instanceManager.getInstance(slot.slotId);
                if (instance?.lateUpdate) {
                    if (!this.runtime.callHook(slot.slotId, "lateUpdate", dt)) {
                        slot.enabled = false;
                    }
                }
            }
        }
    }

    /**
     * Executes the drawGizmos phase for debug visualization.
     * 
     * @remarks
     * This phase:
     * 1. Clears the gizmo renderer
     * 2. Calls onDrawGizmos hook with delta time
     * 
     * Only called when gizmo renderer is available (typically in editor context).
     * 
     * @param entities - All entities to process
     * @param dt - Delta time in milliseconds
     */
    public drawGizmos(entities: Iterable<Entity>, dt: number): void {
        this.gizmoRenderer?.clear();
        this.timeBridgeSync?.setDelta(dt);

        for (const entity of entities) {
            const sc = entity.getComponent<ScriptComponent>("script");
            if (!sc || !sc.enabled) continue;

            for (const slot of sc.getSlots()) {
                if (!slot.enabled) continue;

                const instance = this.instanceManager.getInstance(slot.slotId);
                if (instance?.onDrawGizmos) {
                    if (!this.runtime.callHook(slot.slotId, "onDrawGizmos", dt)) {
                        slot.enabled = false;
                    }
                }
            }
        }
    }

    /**
     * Sets the time bridge sync object.
     * Used to provide delta time to the Time bridge.
     */
    public setTimeBridgeSync(sync: { setDelta: (dt: number) => void; getScale: () => number }): void {
        this.timeBridgeSync = sync;
    }
}
