import type { Entity, ScriptComponent, ScriptSlot } from "../ecs";
import type { ScriptInstanceManager } from "./ScriptInstanceManager";
import type { ScriptRuntime } from "./ScriptRuntime";
import { CoreLogger } from "../logging/CoreLogger";

/**
 * Manages the registration and compilation of script-enabled entities.
 * 
 * @remarks
 * This class is responsible for:
 * - Tracking entities with ScriptComponent
 * - Compiling scripts when entities are registered
 * - Calling init and onEnable hooks on compilation
 * - Managing the lifecycle of script instances
 * 
 * Extracted from ScriptSystem to follow Single Responsibility Principle.
 */
export class ScriptEntityRegistry {
    private entities = new Map<string, Entity>();

    constructor(
        private instanceManager: ScriptInstanceManager,
        private runtime: ScriptRuntime
    ) { }

    /**
     * Registers an entity that has a ScriptComponent.
     * Does not compile scripts immediately - call compileEntity() separately.
     * 
     * @param entity - The entity to register
     * @returns true if registered (has script component), false otherwise
     */
    public registerEntity(entity: Entity): boolean {
        const sc = entity.getComponent<ScriptComponent>("script");
        if (!sc) return false;
        
        this.entities.set(entity.id, entity);
        return true;
    }

    /**
     * Unregisters an entity and cleans up all its script slots.
     * Calls onDestroy hooks for all enabled slots.
     * 
     * @param entityId - The entity ID to unregister
     * @returns Array of slotIds that were removed (for collision cleanup)
     */
    public unregisterEntity(entityId: string): string[] {
        const entity = this.entities.get(entityId);
        if (!entity) return [];

        const sc = entity.getComponent<ScriptComponent>("script");
        const removedSlotIds: string[] = [];

        if (sc) {
            for (const slot of sc.getSlots()) {
                const instance = this.instanceManager.getInstance(slot.slotId);

                if (instance?.onDestroy) {
                    this.runtime.callHook(slot.slotId, "onDestroy");
                }

                this.instanceManager.removeSlot(slot.slotId);
                removedSlotIds.push(slot.slotId);
            }
        }

        this.entities.delete(entityId);
        return removedSlotIds;
    }

    /**
     * Compiles all script slots for an entity.
     * Calls init and onEnable hooks for each slot.
     * 
     * @param entity - The entity whose scripts should be compiled
     * @param scriptComponent - The script component of the entity
     * @returns Array of slotIds that were successfully compiled
     */
    public compileEntity(entity: Entity, scriptComponent: ScriptComponent): string[] {
        const compiledSlotIds: string[] = [];

        for (const slot of scriptComponent.getSlots()) {
            if (this.instanceManager.getInstance(slot.slotId)) {
                // Already compiled
                continue;
            }

            const instance = this.instanceManager.compileSlot(entity, slot);
            if (!instance) continue;

            // Call init hook
            if (instance.init) {
                if (!this.runtime.callHook(slot.slotId, "init")) {
                    slot.enabled = false;
                    continue;
                }
            }

            // Call onEnable hook if slot is enabled
            if (slot.enabled && instance.onEnable) {
                if (!this.runtime.callHook(slot.slotId, "onEnable")) {
                    slot.enabled = false;
                    continue;
                }
            }

            compiledSlotIds.push(slot.slotId);
        }

        return compiledSlotIds;
    }

    /**
     * Gets the entity by ID if it's registered.
     */
    public getEntity(entityId: string): Entity | undefined {
        return this.entities.get(entityId);
    }

    /**
     * Returns all registered entities.
     */
    public getAllEntities(): ReadonlyArray<Entity> {
        return Array.from(this.entities.values());
    }

    /**
     * Checks if an entity is registered.
     */
    public hasEntity(entityId: string): boolean {
        return this.entities.has(entityId);
    }

    /**
     * Returns the number of registered entities.
     */
    public get size(): number {
        return this.entities.size;
    }
}
