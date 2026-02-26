// @ts-ignore
import * as THREE from "three/webgpu";
import type {
    Entity,
    FullMeshComponent,
    ComponentType,
} from "@duckengine/ecs";
import { CoreLogger } from "@duckengine/core";
import type { RenderFeature } from "./RenderFeature";
import type { RenderContext } from "./RenderContext";
import { syncTransformToObject3D } from "../sync/TransformSync";
import { FullGltfLoader } from "../loaders/FullGltfLoader";
import { deferredDisposeObject } from "../debug/DebugUtils";

export class FullMeshFeature implements RenderFeature {
    readonly name = "FullMeshFeature";
    private readonly fullLoader = new FullGltfLoader();
    private readonly loadingRequestByEntityId = new Map<string, { key: string; requestId: number }>();

    isEligible(entity: Entity): boolean {
        const comp = entity.getComponent<FullMeshComponent>("fullMesh");
        return !!comp && comp.enabled !== false;
    }

    onAttach(entity: Entity, context: RenderContext): void {
        this.createPlaceholder(entity, context);
    }

    onUpdate(entity: Entity, componentType: ComponentType, context: RenderContext): void {
        if (componentType === "fullMesh") {
            const rc = context.registry.get(entity.id);
            if (!rc?.object3D) {
                this.onAttach(entity, context);
            } else {
                this.syncFullMesh(entity, context);
            }
        }
    }

    onComponentRemoved(entity: Entity, componentType: ComponentType, context: RenderContext): void {
        if (componentType === "fullMesh") {
            this.onDetach(entity, context);
        }
    }

    onTransformChanged(entity: Entity, context: RenderContext): void {
        const rc = context.registry.get(entity.id);
        if (rc?.object3D) {
            syncTransformToObject3D(entity, rc.object3D);
        }
    }

    onDetach(entity: Entity, context: RenderContext): void {
        const rc = context.registry.get(entity.id);
        if (rc && rc.object3D instanceof THREE.Group) {
            const group = rc.object3D as THREE.Group;
            context.scene.remove(group);
            deferredDisposeObject(group);
            this.disposeAnimations(rc);
            context.registry.remove(entity.id, context.scene);
        }
    }

    private createPlaceholder(entity: Entity, context: RenderContext): void {
        const comp = entity.getComponent<FullMeshComponent>("fullMesh");
        if (!comp) return;

        const group = new THREE.Group();
        group.visible = false;
        group.userData = group.userData || {};
        group.userData.entityId = entity.id;

        group.userData.fullMeshCastShadow = comp.castShadow ?? false;
        group.userData.fullMeshReceiveShadow = comp.receiveShadow ?? true;

        syncTransformToObject3D(entity, group);
        context.scene.add(group);
        context.registry.add(entity.id, {
            entityId: entity.id,
            object3D: group,
        });

        const key = String(comp.key ?? "").trim();
        if (key && context.engineResourceResolver) {
            this.loadAndApplyFullGlb(entity, key, context);
        }
    }

    private async loadAndApplyFullGlb(entity: Entity, key: string, context: RenderContext) {
        if (!context.engineResourceResolver) return;
        const entityId = entity.id;

        const prev = this.loadingRequestByEntityId.get(entityId);
        const requestId = (prev?.requestId ?? 0) + 1;
        this.loadingRequestByEntityId.set(entityId, { key, requestId });

        try {
            const result = await this.fullLoader.load(key, context.engineResourceResolver);

            const current = this.loadingRequestByEntityId.get(entityId);
            if (!current || current.requestId !== requestId || current.key !== key) return;

            const rc = context.registry.get(entityId);
            if (!rc || !rc.object3D) return;

            const placeholder = rc.object3D as THREE.Group;

            // Clear children
            while (placeholder.children.length) {
                const c = placeholder.children[0];
                placeholder.remove(c);
                deferredDisposeObject(c);
            }

            if (result) {
                const { root, animations } = result;
                const instance = root.clone(true);
                placeholder.add(instance);

                if (animations && animations.length) {
                    rc.animationMixer = new THREE.AnimationMixer(placeholder);
                    rc.availableAnimations = animations;
                }

                const desiredCast = placeholder.userData?.fullMeshCastShadow ?? false;
                const desiredReceive = placeholder.userData?.fullMeshReceiveShadow ?? true;
                this.applyShadowFlagsRecursive(placeholder, desiredCast, desiredReceive);

                placeholder.userData.fullMeshKeyApplied = key;
                placeholder.userData.fullMeshLoaded = true;
                placeholder.visible = true;
            }
        } catch (e) {
            CoreLogger.warn("FullMeshFeature", "GLB load failed", e);
        }
    }

    private syncFullMesh(entity: Entity, context: RenderContext): void {
        const comp = entity.getComponent<FullMeshComponent>("fullMesh");
        if (!comp) return;
        const rc = context.registry.get(entity.id);
        if (!rc?.object3D) return;

        const cast = comp.castShadow ?? false;
        const receive = comp.receiveShadow ?? true;
        rc.object3D.userData.fullMeshCastShadow = cast;
        rc.object3D.userData.fullMeshReceiveShadow = receive;
        this.applyShadowFlagsRecursive(rc.object3D, cast, receive);

        const nextKey = String(comp.key ?? '').trim();
        const appliedKey = String(rc.object3D.userData?.fullMeshKeyApplied ?? '').trim();

        if (nextKey !== appliedKey) {
            if (nextKey) {
                rc.object3D.visible = false;
                this.disposeAnimations(rc);
                if (context.engineResourceResolver) {
                    this.loadAndApplyFullGlb(entity, nextKey, context);
                }
            } else {
                // Key cleared (none)
                this.disposeAnimations(rc);
                const placeholder = rc.object3D;
                while (placeholder.children.length) {
                    const c = placeholder.children[0];
                    placeholder.remove(c);
                    deferredDisposeObject(c);
                }
                placeholder.userData.fullMeshKeyApplied = "";
                placeholder.userData.fullMeshLoaded = false;
                placeholder.visible = false;
            }
        }
    }

    private applyShadowFlagsRecursive(root: THREE.Object3D, cast: boolean, receive: boolean) {
        root.traverse((o: any) => {
            if (o.isMesh) {
                o.castShadow = cast;
                o.receiveShadow = receive;
            }
        });
    }

    private disposeAnimations(rc: any): void {
        if (rc.animationMixer) {
            rc.animationMixer.stopAllAction();
            if (rc.object3D) rc.animationMixer.uncacheRoot(rc.object3D);
        }
        rc.animationMixer = undefined;
        rc.availableAnimations = undefined;
        rc.activeAction = undefined;
    }
}
