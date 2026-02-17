import * as THREE from "three";
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
        const dbgListener = (enabled: boolean) => this.onEntityDebugFlagChanged(entity, context);
        this.debugFlagListeners.set(entity.id, dbgListener);
        try {
            entity.addDebugTransformListener(dbgListener);
        } catch { }

        const dbgMeshListener = (enabled: boolean) => this.onEntityMeshDebugFlagChanged(entity, context);
        if (typeof (entity as any).addDebugMeshListener === "function") {
            this.debugMeshFlagListeners.set(entity.id, dbgMeshListener);
            try {
                (entity as any).addDebugMeshListener(dbgMeshListener);
            } catch { }
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
            try { this.meshDebugSystem.refreshWireframeForEntity(entity.id); } catch { }
        }

        if (
            (
                [
                    "sphereCollider", "boxCollider", "capsuleCollider",
                    "cylinderCollider", "coneCollider", "terrainCollider"
                ] as ComponentType[]
            ).includes(componentType)
        ) {
            try { this.colliderDebugSystem.recreateForEntityIfNeeded(entity); } catch { }
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
            try { this.meshDebugSystem.refreshWireframeForEntity(entity.id); } catch { }
        }

        if (
            (
                [
                    "sphereCollider", "boxCollider", "capsuleCollider",
                    "cylinderCollider", "coneCollider", "terrainCollider"
                ] as ComponentType[]
            ).includes(componentType)
        ) {
            try { this.colliderDebugSystem.recreateForEntityIfNeeded(entity); } catch { }
        }
    }

    onTransformChanged(entity: Entity, context: RenderContext): void {
        try { this.debugSystem.updateHelperTransform(entity); } catch { }
        try { this.meshDebugSystem.updateHelperTransform(entity); } catch { }
        this.colliderDebugSystem.updateHelperTransform(entity);
    }

    onDetach(entity: Entity, context: RenderContext): void {
        this.debugSystem.removeHelper(entity.id);
        this.meshDebugSystem.removeHelper(entity.id);
        this.colliderDebugSystem.removeHelper(entity.id);

        const dbg = this.debugFlagListeners.get(entity.id);
        if (dbg) {
            try { entity.removeDebugTransformListener(dbg); } catch { }
            this.debugFlagListeners.delete(entity.id);
        }

        const dbgMesh = this.debugMeshFlagListeners.get(entity.id);
        if (dbgMesh) {
            try { (entity as any).removeDebugMeshListener(dbgMesh); } catch { }
            this.debugMeshFlagListeners.delete(entity.id);
        }

        const dbgCol = this.debugColliderFlagListeners.get(entity.id);
        if (dbgCol) {
            entity.removeDebugColliderListener(dbgCol);
            this.debugColliderFlagListeners.delete(entity.id);
        }

        try { this.debugSystem.removeForbiddenEntity(entity.id); } catch { }
        try { this.meshDebugSystem.removeForbiddenEntity(entity.id); } catch { }
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
        try {
            if (prevId) {
                this.debugSystem.removeForbiddenEntity(prevId);
                this.meshDebugSystem.removeForbiddenEntity(prevId);
                const pEnt = context.entities.get(prevId);
                if (pEnt) {
                    this.debugSystem.recreateForEntityIfNeeded(pEnt);
                    this.meshDebugSystem.recreateForEntityIfNeeded(pEnt);
                }
            }
        } catch { }
        try {
            if (id) {
                this.debugSystem.addForbiddenEntity(id);
                this.meshDebugSystem.addForbiddenEntity(id);
                this.colliderDebugSystem.addForbiddenEntity(id);
            }
        } catch { }
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
        if (context.debugFlags.mesh && typeof (entity as any).isDebugMeshEnabled === "function" && (entity as any).isDebugMeshEnabled()) {
            this.meshDebugSystem.recreateForEntityIfNeeded(entity);
        }
        if (context.debugFlags.collider && entity.isDebugColliderEnabled?.()) {
            this.colliderDebugSystem.recreateForEntityIfNeeded(entity);
        }
    }

    private recreateAll(entities: IterableIterator<any>) {
        for (const ent of entities) {
            this.debugSystem.recreateForEntityIfNeeded(ent);
        }
    }
}
