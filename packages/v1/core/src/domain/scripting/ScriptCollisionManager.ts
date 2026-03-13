import type { Entity, ScriptComponent, ScriptSlot } from "../ecs";
import type { CollisionEventsHub } from "../physics/CollisionEventsHub";
import type { ScriptInstanceManager } from "./ScriptInstanceManager";
import type { ScriptRuntime } from "./ScriptRuntime";

/**
 * Manages collision event subscriptions for script slots.
 * 
 * @remarks
 * This class is responsible for:
 * - Subscribing to collision events for entities with physics components
 * - Checking if scripts implement collision hooks before subscribing
 * - Calling onCollisionEnter and onCollisionExit hooks
 * - Cleaning up subscriptions when slots are removed
 * 
 * Extracted from ScriptSystem to follow Single Responsibility Principle.
 */
export class ScriptCollisionManager {
    // slotId → unsub function
    private collisionUnsubs = new Map<string, () => void>();

    constructor(
        private collisionEvents: CollisionEventsHub | undefined,
        private instanceManager: ScriptInstanceManager,
        private runtime: ScriptRuntime
    ) { }

    /**
     * Subscribes to collision events for a script slot if needed.
     * Only subscribes if:
     * 1. CollisionEventsHub is available
     * 2. Entity has a physics component
     * 3. Script implements onCollisionEnter or onCollisionExit hooks
     * 
     * @param entity - The entity to check
     * @param scriptComponent - The script component (for checking enabled state)
     * @param slot - The script slot to subscribe for
     */
    public subscribeIfNeeded(entity: Entity, scriptComponent: ScriptComponent, slot: ScriptSlot): void {
        if (!this.collisionEvents) return;

        // Check if entity has any physics component
        const hasPhysicsBody = entity.hasComponent("rigidBody") ||
            entity.hasComponent("sphereCollider") ||
            entity.hasComponent("boxCollider") ||
            entity.hasComponent("capsuleCollider") ||
            entity.hasComponent("cylinderCollider") ||
            entity.hasComponent("coneCollider") ||
            entity.hasComponent("terrainCollider");

        if (!hasPhysicsBody) return;

        // Check if the script actually implements either collision hook
        const instance = this.instanceManager.getInstance(slot.slotId);
        if (!instance) return;

        if (!instance.onCollisionEnter && !instance.onCollisionExit) return;

        // Subscribe to collision events for this entity
        const unsub = this.collisionEvents.onEntity(entity.id, (ev) => {
            // Only fire if the slot is still enabled
            if (!slot.enabled) return;

            if (ev.kind === 'enter' && instance.onCollisionEnter) {
                if (!this.runtime.callHook(slot.slotId, "onCollisionEnter", ev.other)) {
                    slot.enabled = false;
                }
            } else if (ev.kind === 'exit' && instance.onCollisionExit) {
                if (!this.runtime.callHook(slot.slotId, "onCollisionExit", ev.other)) {
                    slot.enabled = false;
                }
            }
        });

        this.collisionUnsubs.set(slot.slotId, unsub);
    }

    /**
     * Unsubscribes from collision events for a slot.
     * 
     * @param slotId - The slot ID to unsubscribe
     */
    public unsubscribe(slotId: string): void {
        const unsub = this.collisionUnsubs.get(slotId);
        if (unsub) {
            unsub();
            this.collisionUnsubs.delete(slotId);
        }
    }

    /**
     * Unsubscribes from collision events for multiple slots.
     * 
     * @param slotIds - Array of slot IDs to unsubscribe
     */
    public unsubscribeMany(slotIds: string[]): void {
        for (const slotId of slotIds) {
            this.unsubscribe(slotId);
        }
    }

    /**
     * Checks if a slot is subscribed to collision events.
     */
    public isSubscribed(slotId: string): boolean {
        return this.collisionUnsubs.has(slotId);
    }

    /**
     * Gets the number of active collision subscriptions.
     */
    public get subscriptionCount(): number {
        return this.collisionUnsubs.size;
    }
}
