// @ts-ignore
import * as THREE from "three/webgpu";
import type { Entity } from "@duckengine/ecs";
import { DEBUG_LAYERS } from "./DebugLayers";
import { deferredDisposeObject } from "./DebugUtils";
import type { RenderObjectRegistry } from "../sync/RenderObjectRegistry";

/**
 * Manages camera frustum debug helpers for entities.
 *
 * Design: uses THREE.CameraHelper to visualize the prism of vision.
 */
export class DebugCameraSystem {
    private readonly scene: THREE.Scene;
    private readonly registry: RenderObjectRegistry;
    private readonly helpers = new Map<string, THREE.CameraHelper>();
    private masterEnabled = false;
    /** Set of entity ids that must never show a helper (e.g., active camera) */
    private forbidden = new Set<string>();

    constructor(scene: THREE.Scene, registry: RenderObjectRegistry) {
        this.scene = scene;
        this.registry = registry;
    }

    setMasterEnabled(enabled: boolean): void {
        this.masterEnabled = !!enabled;
        for (const [id, h] of this.helpers.entries()) {
            if (this.forbidden.has(id)) {
                this.removeHelper(id);
                continue;
            }
            h.visible = this.masterEnabled;
        }
    }

    ensureHelper(entity: Entity): void {
        if (!this.masterEnabled) return;
        if (this.forbidden.has(entity.id)) return;
        if (this.helpers.has(entity.id)) return;

        const rc = this.registry.get(entity.id);
        if (!rc?.object3D || !(rc.object3D instanceof THREE.Camera)) return;

        const helper = new THREE.CameraHelper(rc.object3D);
        helper.name = `debugCamera:${entity.id}`;
        helper.visible = this.masterEnabled;
        helper.layers.set(DEBUG_LAYERS.cameras);

        this.scene.add(helper);
        this.helpers.set(entity.id, helper);
    }

    removeHelper(entityId: string): void {
        const h = this.helpers.get(entityId);
        if (!h) return;

        try {
            this.scene.remove(h);
        } catch { }

        deferredDisposeObject(h);
        this.helpers.delete(entityId);
    }

    updateHelper(entity: Entity): void {
        const h = this.helpers.get(entity.id);
        if (!h) {
            this.ensureHelper(entity);
            return;
        }

        // CameraHelper updates its own matrix based on the camera it's attached to,
        // but we need to call update() to refresh the projection lines.
        try {
            h.update();
        } catch { }
    }

    /** Mark an entity id as forbidden (never show helper). */
    addForbiddenEntity(entityId: string): void {
        if (this.forbidden.has(entityId)) return;
        this.forbidden.add(entityId);
        if (this.helpers.has(entityId)) this.removeHelper(entityId);
    }

    /** Remove an entity id from the forbidden list. */
    removeForbiddenEntity(entityId: string): void {
        if (!this.forbidden.has(entityId)) return;
        this.forbidden.delete(entityId);
    }

    recreateForEntityIfNeeded(entity: Entity): void {
        const exists = this.helpers.has(entity.id);
        if (this.forbidden.has(entity.id)) {
            if (exists) this.removeHelper(entity.id);
            return;
        }

        const wants = this.masterEnabled && entity.isDebugEnabled('camera');

        if (wants) {
            if (!exists) this.ensureHelper(entity);
            else this.updateHelper(entity);
        } else {
            if (exists) this.removeHelper(entity.id);
        }
    }

    clear(): void {
        for (const id of Array.from(this.helpers.keys())) this.removeHelper(id);
    }
}

export default DebugCameraSystem;
