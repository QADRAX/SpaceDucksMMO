// @ts-ignore
import * as THREE from "three/webgpu";
import type {
    Entity,
    ShaderMaterialComponent,
    BoxGeometryComponent,
    SphereGeometryComponent,
    PlaneGeometryComponent,
    CylinderGeometryComponent,
    ConeGeometryComponent,
    TorusGeometryComponent,
    CustomGeometryComponent,
    FullMeshComponent,
    StandardMaterialComponent,
    BasicMaterialComponent,
    PhongMaterialComponent,
    LambertMaterialComponent,
    ComponentType,
} from "@duckengine/ecs";
import {
    GeometryFactory,
    AnyGeometryComponent,
} from "../factories/GeometryFactory";
import {
    MaterialFactory,
    type AnyMaterialComponent,
} from "../factories/MaterialFactory";
import { ShaderMaterialFactory } from "../factories/ShaderMaterialFactory";
import type { RenderFeature } from "./RenderFeature";
import type { RenderContext } from "./RenderContext";
import { syncTransformToObject3D } from "../sync/TransformSync";
import { CustomGeometryLoader } from "../loaders/CustomGeometryLoader";
import { FullGltfLoader, FullGltfResult } from "../loaders/FullGltfLoader";
import { deferredDispose, deferredDisposeObject } from "../debug/DebugUtils";

export class MeshFeature implements RenderFeature {
    readonly name = "MeshFeature";

    private readonly customLoader = new CustomGeometryLoader();
    private readonly fullLoader = new FullGltfLoader();

    private readonly customGeometryRequestByEntityId = new Map<string, { key: string; requestId: number }>();

    private readonly pendingTaskQueue: Array<() => void> = [];
    private readonly MAX_FRAME_BUDGET_MS = 4; // 4ms budget for mesh instantiation per frame

    isEligible(entity: Entity): boolean {
        const geometry = this.getGeometryComponent(entity);
        const materialComp = this.getMaterialComponent(entity);
        const shaderMaterial = entity.getComponent<ShaderMaterialComponent>("shaderMaterial");
        if (!geometry || geometry.enabled === false) return false;
        const isFullMesh = geometry.type === "fullMesh";

        // Full meshes don't need separate material
        if (
            !isFullMesh &&
            ((!materialComp || materialComp.enabled === false) &&
                (!shaderMaterial || shaderMaterial.enabled === false))
        ) {
            return false;
        }

        return true;
    }

    onAttach(entity: Entity, context: RenderContext): void {
        this.createMesh(entity, context);
    }

    onUpdate(entity: Entity, componentType: ComponentType, context: RenderContext): void {
        /* 
           Handle component updates. 
           If geometry type changed or material type changed, recreated mesh.
           If simple property changed, update sync. 
        */
        switch (componentType) {
            case "boxGeometry":
            case "sphereGeometry":
            case "planeGeometry":
            case "cylinderGeometry":
            case "coneGeometry":
            case "torusGeometry":
            case "shaderMaterial":
                this.recreateMesh(entity, context);
                break;
            case "customGeometry":
                this.syncCustomGeometry(entity, context);
                break;
            case "fullMesh":
                if (!context.registry.has(entity.id)) {
                    this.recreateMesh(entity, context);
                }
                this.syncFullMesh(entity, context);
                break;
            case "standardMaterial":
            case "basicMaterial":
            case "phongMaterial":
            case "lambertMaterial":
                this.syncMaterial(entity, context);
                break;
            case "textureTiling":
                this.syncTextureTiling(entity, context);
                break;
        }
    }

    onComponentRemoved(entity: Entity, componentType: ComponentType, context: RenderContext): void {
        switch (componentType) {
            case "customGeometry":
            case "boxGeometry":
            case "sphereGeometry":
            case "planeGeometry":
            case "cylinderGeometry":
            case "coneGeometry":
            case "torusGeometry":
            case "fullMesh":
            case "shaderMaterial":
            case "standardMaterial":
            case "basicMaterial":
            case "phongMaterial":
            case "lambertMaterial":
                // For core geometry/material removal, often isEligible returns false -> onDetach.
                // But if we swapped one for another, we might just need to recreate.
                this.recreateMesh(entity, context);
                break;
            case "textureTiling":
                this.resetTextureTiling(entity, context);
                break;
        }
    }

    onTransformChanged(entity: Entity, context: RenderContext): void {
        const rc = context.registry.get(entity.id);
        if (!rc?.object3D) return;
        syncTransformToObject3D(entity, rc.object3D);
    }

    onFrame(dt: number, context: RenderContext): void {
        // Process pending tasks (staggered loading)
        if (this.pendingTaskQueue.length > 0) {
            const start = performance.now();
            while (this.pendingTaskQueue.length > 0 && (performance.now() - start) < this.MAX_FRAME_BUDGET_MS) {
                const task = this.pendingTaskQueue.shift();
                if (task) {
                    try {
                        task();
                    } catch (e) {
                        console.warn("[MeshFeature] Task error", e);
                    }
                }
            }

            if (context.isInitialLoading && context.loadingTracker && this.pendingTaskQueue.length === 0) {
                context.loadingTracker.endTask("MeshFeature:sync");
            }
        }

        // Animation updates
        const ms = dt / 1000;
        for (const rc of context.registry.getAll().values()) {
            const mixer = rc.animationMixer;
            if (mixer) {
                mixer.update(ms);
            }

            // Also handle loaded flag for fullMesh
            const obj = rc.object3D;
            if (obj && obj.userData.fullMeshLoaded) {
                // ... setup logic if needed ...
                obj.userData.fullMeshLoaded = false;
            }
        }
    }

    onDetach(entity: Entity, context: RenderContext): void {
        const rc = context.registry.get(entity.id);
        if (rc) {
            if (rc.object3D) {
                context.scene.remove(rc.object3D);
                deferredDisposeObject(rc.object3D);
            }
            this.disposeEntityAnimations(entity.id, context);
            context.registry.remove(entity.id, context.scene);
        }
    }

    // --- Helpers ---

    private scheduleTask(task: () => void, context: RenderContext) {
        this.pendingTaskQueue.push(task);
        if (context.isInitialLoading && context.loadingTracker) {
            context.loadingTracker.startTask("MeshFeature:sync");
        }
    }

    private getGeometryComponent(entity: Entity): AnyGeometryComponent | null {
        return (
            entity.getComponent<BoxGeometryComponent>("boxGeometry") ??
            entity.getComponent<SphereGeometryComponent>("sphereGeometry") ??
            entity.getComponent<PlaneGeometryComponent>("planeGeometry") ??
            entity.getComponent<CylinderGeometryComponent>("cylinderGeometry") ??
            entity.getComponent<ConeGeometryComponent>("coneGeometry") ??
            entity.getComponent<TorusGeometryComponent>("torusGeometry") ??
            entity.getComponent<CustomGeometryComponent>("customGeometry") ??
            entity.getComponent<FullMeshComponent>("fullMesh") ??
            null
        );
    }

    private getMaterialComponent(entity: Entity): AnyMaterialComponent | null {
        return (
            entity.getComponent<StandardMaterialComponent>("standardMaterial") ??
            entity.getComponent<BasicMaterialComponent>("basicMaterial") ??
            entity.getComponent<PhongMaterialComponent>("phongMaterial") ??
            entity.getComponent<LambertMaterialComponent>("lambertMaterial") ??
            null
        );
    }

    private createMesh(entity: Entity, context: RenderContext): void {
        const geometryComp = this.getGeometryComponent(entity);
        const materialComp = this.getMaterialComponent(entity);
        const shaderMaterialComp = entity.getComponent<ShaderMaterialComponent>("shaderMaterial");

        if (!geometryComp) return;

        if (geometryComp.type === "fullMesh") {
            this.createFullMeshPlaceholder(entity, geometryComp as FullMeshComponent, context);
            return;
        }

        const geometry = GeometryFactory.build(geometryComp);
        let material: THREE.Material;

        if (shaderMaterialComp) {
            material = ShaderMaterialFactory.build(shaderMaterialComp, context.textureCache);
        } else {
            material = MaterialFactory.build(materialComp as AnyMaterialComponent, context.textureCache, (tex) => {
                this.applyTextureSettings(entity, tex);
            });
        }

        const mesh = new THREE.Mesh(geometry, material);
        this.applyShadowFlags(mesh, geometryComp);

        if (geometryComp.type === "customGeometry") {
            mesh.visible = false;
            const key = (geometryComp as unknown as CustomGeometryComponent).key;
            if (typeof key === "string" && key.trim().length > 0) {
                this.loadAndApplyCustomGeometry(entity.id, key.trim(), context);
            }
        }

        mesh.userData = mesh.userData || {};
        (mesh.userData as any).entityId = entity.id;

        syncTransformToObject3D(entity, mesh);
        context.scene.add(mesh);
        context.registry.add(entity.id, {
            entityId: entity.id,
            object3D: mesh,
            geometry,
            material
        });

        if (materialComp) {
            this.resolveAndApplyTextures(entity, material, materialComp, context);
        }
    }

    private recreateMesh(entity: Entity, context: RenderContext): void {
        this.onDetach(entity, context);
        this.onAttach(entity, context);
    }

    private createFullMeshPlaceholder(entity: Entity, geometryComp: AnyGeometryComponent, context: RenderContext): void {
        const group = new THREE.Group();
        group.visible = false;
        group.userData = group.userData || {};
        group.userData.entityId = entity.id;

        group.userData.fullMeshCastShadow = geometryComp.castShadow ?? false;
        group.userData.fullMeshReceiveShadow = geometryComp.receiveShadow ?? true;

        syncTransformToObject3D(entity, group);
        context.scene.add(group);
        context.registry.add(entity.id, {
            entityId: entity.id,
            object3D: group,
        });

        const key = String(((geometryComp as any).key ?? "") as string).trim();
        if (key && context.engineResourceResolver) {
            this.loadAndApplyFullGlb(entity, key, context);
        }
    }

    private applyShadowFlags(obj: THREE.Object3D, geometryComp: AnyGeometryComponent): void {
        const cast = (geometryComp as any).castShadow;
        const receive = (geometryComp as any).receiveShadow;
        if (typeof cast === "boolean") obj.castShadow = cast;
        else obj.castShadow = false;
        if (typeof receive === "boolean") obj.receiveShadow = receive;
        else obj.receiveShadow = true;
    }

    private syncMaterial(entity: Entity, context: RenderContext): void {
        const rc = context.registry.get(entity.id);
        if (!rc?.object3D || !(rc.object3D instanceof THREE.Mesh)) return;

        const materialComp = this.getMaterialComponent(entity);
        if (!materialComp || materialComp.enabled === false) {
            rc.object3D.visible = false;
            return;
        }

        if (rc.material) {
            if (Array.isArray(rc.material)) rc.material.forEach((m: any) => deferredDispose(m));
            else deferredDispose(rc.material);
        }

        const newMat = MaterialFactory.build(materialComp, context.textureCache, (tex) => {
            this.applyTextureSettings(entity, tex);
        });

        const mesh = rc.object3D as THREE.Mesh;
        mesh.material = newMat;
        rc.material = newMat;
        mesh.visible = true;

        this.resolveAndApplyTextures(entity, newMat, materialComp, context);
    }

    private syncTextureTiling(entity: Entity, context: RenderContext): void {
        const rc = context.registry.get(entity.id);
        if (!rc || !(rc.object3D instanceof THREE.Mesh)) return;
        const mesh = rc.object3D as THREE.Mesh;

        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of materials) {
            if (!m) continue;
            const mm = m as any;
            if (mm.map) this.applyTextureTiling(entity, mm.map);
            if (mm.normalMap) this.applyTextureTiling(entity, mm.normalMap);
            // ... other maps
            (m as any).needsUpdate = true;
        }
    }

    private resetTextureTiling(entity: Entity, context: RenderContext): void {
        const rc = context.registry.get(entity.id);
        if (!rc || !(rc.object3D instanceof THREE.Mesh)) return;
        const mesh = rc.object3D as THREE.Mesh;

        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const m of materials) {
            if (!m) continue;
            const mm = m as any;
            if (mm.map) this.resetTexture(mm.map);
            if (mm.normalMap) this.resetTexture(mm.normalMap);
            // ... other maps
            (m as any).needsUpdate = true;
        }
    }

    private resetTexture(texture: THREE.Texture): void {
        texture.repeat.set(1, 1);
        texture.offset.set(0, 0);
        texture.needsUpdate = true;
    }

    private applyTextureTiling(entity: Entity, texture: THREE.Texture): void {
        const tiling = entity.getComponent<any>("textureTiling");
        if (!tiling) return;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(tiling.repeatU ?? 1, tiling.repeatV ?? 1);
        texture.offset.set(tiling.offsetU ?? 0, tiling.offsetV ?? 0);
        texture.needsUpdate = true;
    }

    private applyTextureSettings(entity: Entity, texture: THREE.Texture): void {
        this.applyTextureTiling(entity, texture);
        const isCustom = !!entity.getComponent<CustomGeometryComponent>("customGeometry") || !!entity.getComponent<any>("fullMesh");
        if (isCustom) {
            (texture as any).flipY = false;
            texture.needsUpdate = true;
        }
    }

    private async resolveAndApplyTextures(entity: Entity, material: THREE.Material, comp: AnyMaterialComponent, context: RenderContext) {
        if (!context.textureCatalog) return;

        const useTracker = context.isInitialLoading && context.loadingTracker;
        const taskName = `materialTextures:${entity.id}`;
        if (useTracker) context.loadingTracker!.startTask(taskName);

        try {
            const isCatalogId = (val: unknown): val is string => {
                if (typeof val !== "string") return false;
                return !(val.startsWith("/") || val.startsWith("http") || val.includes("."));
            };

            const applyIfLoaded = async (field: string, setter: (t: THREE.Texture) => void) => {
                const val = (comp as any)[field];
                if (!isCatalogId(val)) return;
                try {
                    const variants = await context.textureCatalog!.getVariantsById(val);
                    if (!variants?.length) return;
                    const chosen = variants[0];
                    if (!chosen?.path) return;

                    const tex = await context.textureCache.load(chosen.path);
                    let t: THREE.Texture;
                    try { t = (tex as THREE.Texture).clone(); } catch { t = tex as THREE.Texture; }
                    setter(t);
                    this.applyTextureSettings(entity, t);
                    material.needsUpdate = true;
                } catch { }
            };

            await Promise.all([
                applyIfLoaded("texture", (t) => { if ("map" in material) (material as any).map = t; }),
                applyIfLoaded("normalMap", (t) => { if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhongMaterial) (material as any).normalMap = t; }),
                applyIfLoaded("roughnessMap", (t) => { if (material instanceof THREE.MeshStandardMaterial) material.roughnessMap = t; }),
                applyIfLoaded("metalnessMap", (t) => { if (material instanceof THREE.MeshStandardMaterial) material.metalnessMap = t; }),
                applyIfLoaded("aoMap", (t) => { if (material instanceof THREE.MeshStandardMaterial) material.aoMap = t; }),
                applyIfLoaded("emissiveMap", (t) => { if ("emissiveMap" in material) (material as any).emissiveMap = t; }),
                applyIfLoaded("envMap", (t) => { if ("envMap" in material) (material as any).envMap = t; }),
            ]);
        } finally {
            if (useTracker) context.loadingTracker!.endTask(taskName);
        }
    }

    private async loadAndApplyCustomGeometry(entityId: string, transformKey: string, context: RenderContext) {
        const resolver = context.engineResourceResolver;
        if (!resolver) return;

        const prev = this.customGeometryRequestByEntityId.get(entityId);
        const requestId = (prev?.requestId ?? 0) + 1;
        this.customGeometryRequestByEntityId.set(entityId, { key: transformKey, requestId });

        const taskName = `customGeometry:${entityId}:${transformKey}`;
        if (context.isInitialLoading && context.loadingTracker) {
            context.loadingTracker.startTask(taskName);
        }

        try {
            const geometry = await this.customLoader.load(transformKey, resolver);

            this.scheduleTask(() => {
                const current = this.customGeometryRequestByEntityId.get(entityId);
                if (!current || current.requestId !== requestId || current.key !== transformKey) return;

                const rc = context.registry.get(entityId);
                if (!rc?.object3D || !(rc.object3D instanceof THREE.Mesh)) return;

                if (rc.geometry) deferredDispose(rc.geometry);

                if (geometry) {
                    const mesh = rc.object3D as THREE.Mesh;
                    mesh.geometry = geometry;
                    rc.geometry = geometry;
                    mesh.visible = true;
                    mesh.userData = mesh.userData || {};
                    mesh.userData.customGeometryKeyApplied = transformKey;
                }
            }, context);
        } catch (e) {
            console.warn("[MeshFeature] Custom geometry load failed", e);
        } finally {
            if (context.isInitialLoading && context.loadingTracker) {
                context.loadingTracker.endTask(taskName);
            }
        }
    }

    private syncCustomGeometry(entity: Entity, context: RenderContext): void {
        const comp = entity.getComponent<CustomGeometryComponent>("customGeometry");
        if (!comp) return;

        const rc = context.registry.get(entity.id);
        if (!rc?.object3D || !(rc.object3D instanceof THREE.Mesh)) {
            this.recreateMesh(entity, context);
            return;
        }
        const mesh = rc.object3D;
        if (comp.enabled === false) {
            mesh.visible = false;
            return;
        }

        const compCast = (comp as any).castShadow;
        const compReceive = (comp as any).receiveShadow;
        if (typeof compCast === "boolean") mesh.castShadow = compCast;
        if (typeof compReceive === "boolean") mesh.receiveShadow = compReceive;

        const key = String((comp as any).key ?? "").trim();
        if (!key) {
            mesh.visible = false;
            return;
        }

        const appliedKey = String(mesh.userData?.customGeometryKeyApplied ?? "");
        if (appliedKey === key) {
            const m = mesh as THREE.Mesh;
            if (m.geometry) m.visible = true;
            return;
        }

        this.loadAndApplyCustomGeometry(entity.id, key, context);
    }

    private async loadAndApplyFullGlb(entity: Entity, key: string, context: RenderContext) {
        if (!context.engineResourceResolver) return;
        const entityId = entity.id;

        const prev = this.customGeometryRequestByEntityId.get(entityId);
        const requestId = (prev?.requestId ?? 0) + 1;
        this.customGeometryRequestByEntityId.set(entityId, { key, requestId });

        const taskName = `fullMesh:${entityId}:${key}`;
        if (context.isInitialLoading && context.loadingTracker) {
            context.loadingTracker.startTask(taskName);
        }

        try {
            const result = await this.fullLoader.load(key, context.engineResourceResolver);

            this.scheduleTask(() => {
                const current = this.customGeometryRequestByEntityId.get(entityId);
                if (!current || current.requestId !== requestId || current.key !== key) return;

                const rc = context.registry.get(entityId);
                if (!rc || !rc.object3D) return;

                const placeholder = rc.object3D as THREE.Object3D;

                // Clear children
                while (placeholder.children.length) {
                    placeholder.remove(placeholder.children[0]);
                }

                if (result) {
                    const { root, animations } = result;
                    const instance = root.clone(true);
                    placeholder.add(instance);

                    if (animations && animations.length) {
                        rc.animationMixer = new THREE.AnimationMixer(placeholder);
                        rc.availableAnimations = animations;
                        this.syncFullMesh(entity, context);
                    }

                    const desiredCast = placeholder.userData?.fullMeshCastShadow ?? false;
                    const desiredReceive = placeholder.userData?.fullMeshReceiveShadow ?? true;
                    this.applyShadowFlagsRecursive(placeholder, desiredCast, desiredReceive);

                    placeholder.userData.fullMeshKeyApplied = key;
                    placeholder.userData.fullMeshLoaded = true;

                    placeholder.visible = true;
                }
            }, context);
        } catch (e) {
            console.warn("[MeshFeature] Full mesh load failed", e);
        } finally {
            if (context.isInitialLoading && context.loadingTracker) {
                context.loadingTracker.endTask(taskName);
            }
        }
    }

    private syncFullMesh(entity: Entity, context: RenderContext): void {
        const comp = entity.getComponent<any>("fullMesh");
        if (!comp) return;
        const rc = context.registry.get(entity.id);
        if (!rc?.object3D) return;

        // Shadow flags
        const cast = (comp as any).castShadow ?? false;
        const receive = (comp as any).receiveShadow ?? true;
        rc.object3D.userData.fullMeshCastShadow = cast;
        rc.object3D.userData.fullMeshReceiveShadow = receive;
        this.applyShadowFlagsRecursive(rc.object3D, cast, receive);

        // Check key change
        const nextKey = String(comp.key ?? '').trim();
        const appliedKey = String(rc.object3D.userData?.fullMeshKeyApplied ?? '').trim();

        if (nextKey !== appliedKey) {
            if (nextKey) {
                (rc.object3D as any).visible = false;
                this.disposeEntityAnimations(entity.id, context);
                if (context.engineResourceResolver) {
                    this.loadAndApplyFullGlb(entity, nextKey, context);
                }
            } else {
                // Key cleared (none)
                this.disposeEntityAnimations(entity.id, context);
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
            return;
        }

        // Animation sync
        const mixer = rc.animationMixer;
        const animations = rc.availableAnimations ?? [];
        if (!mixer || !animations.length) return;

        const clipName = String(comp.animation?.clipName ?? "");
        const clip = clipName ? THREE.AnimationClip.findByName(animations, clipName) : animations[0];
        if (!clip) return;

        const prevAction = rc.activeAction;
        if (prevAction) {
            prevAction.stop();
            prevAction.reset();
        }

        const action = mixer.clipAction(clip);
        action.setLoop(comp.animation?.loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
        if (typeof comp.animation?.time === 'number') action.time = comp.animation.time;
        if (comp.animation?.playing === false) action.paused = true;
        else action.play();

        rc.activeAction = action;
    }

    private applyShadowFlagsRecursive(root: THREE.Object3D, cast: boolean, receive: boolean) {
        root.traverse((o: any) => {
            if (o.isMesh) {
                o.castShadow = cast;
                o.receiveShadow = receive;
            }
        });
    }

    private disposeEntityAnimations(entityId: string, context: RenderContext): void {
        const rc = context.registry.get(entityId);
        if (!rc) return;
        const mixer = rc.animationMixer;
        if (mixer) {
            mixer.stopAllAction();
            if (rc.object3D) mixer.uncacheRoot(rc.object3D);
        }
        rc.animationMixer = undefined;
        rc.availableAnimations = undefined;
        rc.activeAction = undefined;
    }
}
