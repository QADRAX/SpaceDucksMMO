// @ts-ignore
import * as THREE from "three/webgpu";
import type { Entity, ComponentType } from "@duckengine/ecs";
import type { RenderFeature } from "./RenderFeature";
import type { RenderContext } from "./RenderContext";
import DebugTransformSystem from "../debug/DebugTransformSystem";
import DebugMeshSystem from "../debug/DebugMeshSystem";
import DebugColliderSystem from "../debug/DebugColliderSystem";
import { RenderObjectRegistry } from "../sync/RenderObjectRegistry";

export class DebugFeature implements RenderFeature {
    readonly name = "DebugFeature";

    private debugSystem: DebugTransformSystem;
    private meshDebugSystem: DebugMeshSystem;
    private colliderDebugSystem: DebugColliderSystem;

    private readonly debugFlagListeners = new Map<string, (enabled: boolean) => void>();
    private readonly debugMeshFlagListeners = new Map<string, (enabled: boolean) => void>();
    private readonly debugColliderFlagListeners = new Map<string, (enabled: boolean) => void>();

    constructor(scene: THREE.Scene, registry: RenderObjectRegistry) {
        this.debugSystem = new DebugTransformSystem(scene);
        this.meshDebugSystem = new DebugMeshSystem(scene, registry);
        this.colliderDebugSystem = new DebugColliderSystem(scene, registry);
    }

    isEligible(entity: Entity): boolean {
        return true; // All entities are eligible for debug helpers
    }

    onAttach(entity: Entity, context: RenderContext): void {
        // Listen to per-entity debug flag changes
        const dbgListener = () => this.onEntityDebugFlagChanged(entity, context);
        this.debugFlagListeners.set(entity.id, dbgListener);
        entity.addDebugTransformListener(dbgListener);

        const dbgMeshListener = () => this.onEntityMeshDebugFlagChanged(entity, context);
        if (typeof entity.addDebugMeshListener === "function") {
            this.debugMeshFlagListeners.set(entity.id, dbgMeshListener);
            entity.addDebugMeshListener(dbgMeshListener);
        }

        const dbgColListener = (enabled: boolean) => this.onEntityColliderDebugFlagChanged(entity, context);
        this.debugColliderFlagListeners.set(entity.id, dbgColListener);
        entity.addDebugColliderListener(dbgColListener);

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
    }

    onDetach(entity: Entity, context: RenderContext): void {
        this.debugSystem.removeHelper(entity.id);
        this.meshDebugSystem.removeHelper(entity.id);
        this.colliderDebugSystem.removeHelper(entity.id);

        const dbg = this.debugFlagListeners.get(entity.id);
        if (dbg) {
            entity.removeDebugTransformListener(dbg);
            this.debugFlagListeners.delete(entity.id);
        }

        const dbgMesh = this.debugMeshFlagListeners.get(entity.id);
        if (dbgMesh) {
            if (typeof entity.removeDebugMeshListener === "function") {
                entity.removeDebugMeshListener(dbgMesh);
            }
            this.debugMeshFlagListeners.delete(entity.id);
        }

        const dbgCol = this.debugColliderFlagListeners.get(entity.id);
        if (dbgCol) {
            entity.removeDebugColliderListener(dbgCol);
            this.debugColliderFlagListeners.delete(entity.id);
        }

        this.debugSystem.removeForbiddenEntity(entity.id);
        this.meshDebugSystem.removeForbiddenEntity(entity.id);
        this.colliderDebugSystem.removeForbiddenEntity(entity.id);
    }

    // --- Public methods for RenderSyncSystem ---

    setSceneDebugEnabled(enabled: boolean, context: RenderContext): void {
        this.debugSystem.setMasterEnabled(enabled);
        this.recreateAll(context.entities.values());
    }

    setSceneMeshDebugEnabled(enabled: boolean, context: RenderContext): void {
        this.meshDebugSystem.setMasterEnabled(enabled);
        for (const ent of context.entities.values()) {
            this.meshDebugSystem.recreateForEntityIfNeeded(ent);
        }
    }

    setSceneColliderDebugEnabled(enabled: boolean, context: RenderContext): void {
        this.colliderDebugSystem.setMasterEnabled(enabled);
        for (const ent of context.entities.values()) {
            this.colliderDebugSystem.recreateForEntityIfNeeded(ent);
        }
    }

    setActiveCameraEntityId(id: string | null, prevId: string | null, context: RenderContext): void {
        if (prevId) {
            this.debugSystem.removeForbiddenEntity(prevId);
            this.meshDebugSystem.removeForbiddenEntity(prevId);
            const pEnt = context.entities.get(prevId);
            if (pEnt) {
                this.debugSystem.recreateForEntityIfNeeded(pEnt);
                this.meshDebugSystem.recreateForEntityIfNeeded(pEnt);
            }
        }
        if (id) {
            this.debugSystem.addForbiddenEntity(id);
            this.meshDebugSystem.addForbiddenEntity(id);
            this.colliderDebugSystem.addForbiddenEntity(id);
        }
    }

    // --- Helpers ---

    private onEntityDebugFlagChanged(entity: Entity, context: RenderContext): void {
        if (context.debugFlags.transform) {
            this.debugSystem.recreateForEntityIfNeeded(entity);
        }
    }

    private onEntityMeshDebugFlagChanged(entity: Entity, context: RenderContext): void {
        if (context.debugFlags.mesh) {
            this.meshDebugSystem.recreateForEntityIfNeeded(entity);
        }
    }

    private onEntityColliderDebugFlagChanged(entity: Entity, context: RenderContext): void {
        if (context.debugFlags.collider) {
            this.colliderDebugSystem.recreateForEntityIfNeeded(entity);
        }
    }

    private updateHelpers(entity: Entity, context: RenderContext) {
        if (context.debugFlags.transform && entity.isDebugTransformEnabled()) {
            this.debugSystem.recreateForEntityIfNeeded(entity);
        }
        if (context.debugFlags.mesh && typeof entity.isDebugMeshEnabled === "function" && entity.isDebugMeshEnabled()) {
            this.meshDebugSystem.recreateForEntityIfNeeded(entity);
        }
        if (context.debugFlags.collider && typeof entity.isDebugColliderEnabled === "function" && entity.isDebugColliderEnabled()) {
            this.colliderDebugSystem.recreateForEntityIfNeeded(entity);
        }
    }

    private recreateAll(entities: IterableIterator<any>) {
        for (const ent of entities) {
            this.debugSystem.recreateForEntityIfNeeded(ent);
        }
    }
}
