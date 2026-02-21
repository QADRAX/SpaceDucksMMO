// @ts-ignore
import * as THREE from "three/webgpu";
import type { Entity, ComponentType } from "@duckengine/ecs";
import type { RenderFeature } from "./RenderFeature";
import type { RenderContext } from "./RenderContext";
import DebugTransformSystem from "../debug/DebugTransformSystem";
import DebugMeshSystem from "../debug/DebugMeshSystem";
import DebugColliderSystem from "../debug/DebugColliderSystem";
import DebugCameraSystem from "../debug/DebugCameraSystem";
import { RenderObjectRegistry } from "../sync/RenderObjectRegistry";

export class DebugFeature implements RenderFeature {
    readonly name = "DebugFeature";

    private debugSystem: DebugTransformSystem;
    private meshDebugSystem: DebugMeshSystem;
    private colliderDebugSystem: DebugColliderSystem;
    private cameraDebugSystem: DebugCameraSystem;

    private readonly debugListeners = new Map<string, (kind: string, enabled: boolean) => void>();

    constructor(scene: THREE.Scene, registry: RenderObjectRegistry) {
        this.debugSystem = new DebugTransformSystem(scene);
        this.meshDebugSystem = new DebugMeshSystem(scene, registry);
        this.colliderDebugSystem = new DebugColliderSystem(scene, registry);
        this.cameraDebugSystem = new DebugCameraSystem(scene, registry);
    }

    isEligible(entity: Entity): boolean {
        return true; // All entities are eligible for debug helpers
    }

    onAttach(entity: Entity, context: RenderContext): void {
        // Listen to per-entity debug flag changes via generic listener
        const listener = (kind: string, enabled: boolean) => this.onEntityDebugFlagChanged(entity, kind, enabled, context);
        this.debugListeners.set(entity.id, listener);
        entity.addDebugListener(listener);

        this.updateHelpers(entity, context);
    }

    onUpdate(entity: Entity, componentType: ComponentType, context: RenderContext): void {
        if (
            (
                [
                    "boxGeometry", "sphereGeometry", "planeGeometry", "cylinderGeometry",
                    "coneGeometry", "torusGeometry", "customGeometry", "fullMesh", "shaderMaterial"
                ] as ComponentType[]
            ).includes(componentType)
        ) {
            this.meshDebugSystem.refreshWireframeForEntity(entity.id);
        }

        if (
            (
                [
                    "sphereCollider", "boxCollider", "capsuleCollider",
                    "cylinderCollider", "coneCollider", "terrainCollider"
                ] as ComponentType[]
            ).includes(componentType)
        ) {
            this.colliderDebugSystem.recreateForEntityIfNeeded(entity);
        }

        if (componentType === "cameraView") {
            this.cameraDebugSystem.updateHelper(entity);
        }

        // Transform changes routed via onTransformChanged
    }

    onComponentRemoved(entity: Entity, componentType: ComponentType, context: RenderContext): void {
        if (
            (
                [
                    "boxGeometry", "sphereGeometry", "planeGeometry", "cylinderGeometry",
                    "coneGeometry", "torusGeometry", "customGeometry", "fullMesh", "shaderMaterial"
                ] as ComponentType[]
            ).includes(componentType)
        ) {
            this.meshDebugSystem.refreshWireframeForEntity(entity.id);
        }

        if (
            (
                [
                    "sphereCollider", "boxCollider", "capsuleCollider",
                    "cylinderCollider", "coneCollider", "terrainCollider"
                ] as ComponentType[]
            ).includes(componentType)
        ) {
            this.colliderDebugSystem.recreateForEntityIfNeeded(entity);
        }
    }

    onTransformChanged(entity: Entity, context: RenderContext): void {
        this.debugSystem.updateHelperTransform(entity);
        this.meshDebugSystem.updateHelperTransform(entity);
        this.colliderDebugSystem.updateHelperTransform(entity);
        this.cameraDebugSystem.updateHelper(entity);
    }

    onDetach(entity: Entity, context: RenderContext): void {
        this.debugSystem.removeHelper(entity.id);
        this.meshDebugSystem.removeHelper(entity.id);
        this.colliderDebugSystem.removeHelper(entity.id);
        this.cameraDebugSystem.removeHelper(entity.id);

        const listener = this.debugListeners.get(entity.id);
        if (listener) {
            entity.removeDebugListener(listener);
            this.debugListeners.delete(entity.id);
        }

        this.debugSystem.removeForbiddenEntity(entity.id);
        this.meshDebugSystem.removeForbiddenEntity(entity.id);
        this.colliderDebugSystem.removeForbiddenEntity(entity.id);
        this.cameraDebugSystem.removeForbiddenEntity(entity.id);
    }

    // --- Public methods for RenderSyncSystem ---

    setSceneDebugEnabled(kind: string, enabled: boolean, context: RenderContext): void {
        if (kind === 'transform') {
            this.debugSystem.setMasterEnabled(enabled);
            this.recreateAll(context.entities.values());
        } else if (kind === 'mesh') {
            this.meshDebugSystem.setMasterEnabled(enabled);
            for (const ent of context.entities.values()) {
                this.meshDebugSystem.recreateForEntityIfNeeded(ent);
            }
        } else if (kind === 'collider') {
            this.colliderDebugSystem.setMasterEnabled(enabled);
            for (const ent of context.entities.values()) {
                this.colliderDebugSystem.recreateForEntityIfNeeded(ent);
            }
        } else if (kind === 'camera') {
            this.cameraDebugSystem.setMasterEnabled(enabled);
            for (const ent of context.entities.values()) {
                this.cameraDebugSystem.recreateForEntityIfNeeded(ent);
            }
        }
    }

    setActiveCameraEntityId(id: string | null, prevId: string | null, context: RenderContext): void {
        if (prevId) {
            this.debugSystem.removeForbiddenEntity(prevId);
            this.meshDebugSystem.removeForbiddenEntity(prevId);
            this.cameraDebugSystem.removeForbiddenEntity(prevId);
            const pEnt = context.entities.get(prevId);
            if (pEnt) {
                this.debugSystem.recreateForEntityIfNeeded(pEnt);
                this.meshDebugSystem.recreateForEntityIfNeeded(pEnt);
                this.cameraDebugSystem.recreateForEntityIfNeeded(pEnt);
            }
        }
        if (id) {
            this.debugSystem.addForbiddenEntity(id);
            this.meshDebugSystem.addForbiddenEntity(id);
            this.colliderDebugSystem.addForbiddenEntity(id);
            this.cameraDebugSystem.addForbiddenEntity(id);
        }
    }

    // --- Helpers ---

    private onEntityDebugFlagChanged(entity: Entity, kind: string, enabled: boolean, context: RenderContext): void {
        if (kind === 'transform' && context.debugFlags.transform) {
            this.debugSystem.recreateForEntityIfNeeded(entity);
        } else if (kind === 'mesh' && context.debugFlags.mesh) {
            this.meshDebugSystem.recreateForEntityIfNeeded(entity);
        } else if (kind === 'collider' && context.debugFlags.collider) {
            this.colliderDebugSystem.recreateForEntityIfNeeded(entity);
        } else if (kind === 'camera' && context.debugFlags.camera) {
            this.cameraDebugSystem.recreateForEntityIfNeeded(entity);
        }
    }

    private updateHelpers(entity: Entity, context: RenderContext) {
        if (context.debugFlags.transform && entity.isDebugEnabled('transform')) {
            this.debugSystem.recreateForEntityIfNeeded(entity);
        }
        if (context.debugFlags.mesh && entity.isDebugEnabled('mesh')) {
            this.meshDebugSystem.recreateForEntityIfNeeded(entity);
        }
        if (context.debugFlags.collider && entity.isDebugEnabled('collider')) {
            this.colliderDebugSystem.recreateForEntityIfNeeded(entity);
        }
        if (context.debugFlags.camera && entity.isDebugEnabled('camera')) {
            this.cameraDebugSystem.recreateForEntityIfNeeded(entity);
        }
    }

    private recreateAll(entities: IterableIterator<any>) {
        for (const ent of entities) {
            this.debugSystem.recreateForEntityIfNeeded(ent);
            this.meshDebugSystem.recreateForEntityIfNeeded(ent);
            this.colliderDebugSystem.recreateForEntityIfNeeded(ent);
            this.cameraDebugSystem.recreateForEntityIfNeeded(ent);
        }
    }
}
