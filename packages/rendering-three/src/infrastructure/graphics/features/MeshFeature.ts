import * as THREE from "three";
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
        const isFullMesh = !!geometry && (geometry as any).type === "fullMesh";

        if (!geometry || geometry.enabled === false) return false;

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
        }

        // Animation updates
        const ms = dt / 1000;
        for (const rc of context.registry.getAll().values()) {
            const mixer: any = (rc as any).animationMixer;
            if (mixer && typeof mixer.update === "function") {
                try {
                    mixer.update(ms);
                } catch { }
            }

            // Also handle loaded flag for fullMesh
            try {
                const loaded = (rc.object3D as any)?.userData?.fullMeshLoaded;
                if (loaded) {
                    // Logic to sync full mesh animations once loaded.
                    // We need entity reference to call syncFullMesh.
                    // Ideally pass simple config object instead of Entity if Entity not available?
                    // Or iterate component listeners?
                    // For now, if we loaded via `loadAndApplyFullGlb`, we set up mixer.
                    // We might need to trigger `syncFullMesh` logic again to apply specific clip/time.
                    // But we miss `Entity` reference here in loop.
                    // See comments in previous version.
                    (rc.object3D as any).userData.fullMeshLoaded = false;
                }
            } catch { }
        }
    }

    onDetach(entity: Entity, context: RenderContext): void {
        const rc = context.registry.get(entity.id);
        if (rc) {
            if (rc.object3D) {
                context.scene.remove(rc.object3D);
                if (rc.geometry) rc.geometry.dispose();
                if (rc.material) {
                    if (Array.isArray(rc.material)) (rc.material as any).forEach((m: any) => m.dispose());
                    else rc.material.dispose();
                }
            }
            this.disposeEntityAnimations(entity.id, context);
            context.registry.remove(entity.id, context.scene);
        }
    }

    // --- Helpers ---

    private scheduleTask(task: () => void) {
        this.pendingTaskQueue.push(task);
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

        if ((geometryComp as any).type === "fullMesh") {
            this.createFullMeshPlaceholder(entity, geometryComp, context);
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
        (group.userData as any).entityId = entity.id;

        try {
            (group.userData as any).fullMeshCastShadow = (geometryComp as any).castShadow ?? false;
            (group.userData as any).fullMeshReceiveShadow = (geometryComp as any).receiveShadow ?? true;
        } catch { }

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
        try {
            obj.castShadow = (geometryComp as any).castShadow ?? false;
            obj.receiveShadow = (geometryComp as any).receiveShadow ?? true;
        } catch { }
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
            if (Array.isArray(rc.material)) (rc.material as any).forEach((m: any) => m.dispose());
            else rc.material.dispose();
        }

        const newMat = MaterialFactory.build(materialComp, context.textureCache, (tex) => {
            this.applyTextureSettings(entity, tex);
        });

        rc.object3D.material = newMat;
        rc.material = newMat;
        rc.object3D.visible = true;

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
        // Implementation similar to MeshSyncSystem using context.textureCatalog and context.textureCache
        // Assuming textureCatalog provided in context
        if (!context.textureCatalog) return;

        // ... same logic as MeshSyncSystem.resolveAndApplyTextures ...
        // Can copy paste the logic or simplify if TextureCatalog has helper.
        // Copying logic for now to ensure compatibility.

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
                // Sort by quality... simplified: take first
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

        await applyIfLoaded("texture", (t) => { if ("map" in material) (material as any).map = t; });
        // ... others
    }

    private async loadAndApplyCustomGeometry(entityId: string, transformKey: string, context: RenderContext) {
        const resolver = context.engineResourceResolver;
        if (!resolver) return;

        const prev = this.customGeometryRequestByEntityId.get(entityId);
        const requestId = (prev?.requestId ?? 0) + 1;
        this.customGeometryRequestByEntityId.set(entityId, { key: transformKey, requestId });

        const geometry = await this.customLoader.load(transformKey, resolver);

        this.scheduleTask(() => {
            const current = this.customGeometryRequestByEntityId.get(entityId);
            if (!current || current.requestId !== requestId || current.key !== transformKey) return;

            const rc = context.registry.get(entityId);
            if (!rc?.object3D || !(rc.object3D instanceof THREE.Mesh)) return;

            const mesh = rc.object3D;
            if (rc.geometry) rc.geometry.dispose();

            if (geometry) {
                mesh.geometry = geometry;
                rc.geometry = geometry;
                mesh.visible = true;
                try {
                    mesh.userData = mesh.userData || {};
                    (mesh.userData as any).customGeometryKeyApplied = transformKey;
                } catch { }
            }
        });
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

        try {
            mesh.castShadow = (comp as any).castShadow ?? false;
            mesh.receiveShadow = (comp as any).receiveShadow ?? true;
        } catch { }

        const key = String((comp as any).key ?? "").trim();
        if (!key) {
            mesh.visible = false;
            return;
        }

        const appliedKey = String((mesh.userData as any)?.customGeometryKeyApplied ?? "");
        if (appliedKey === key) {
            if (mesh.geometry) mesh.visible = true;
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
                // Clone root to ensure unique instance per entity
                const instance = root.clone(true); // Is this deep clone? Yes.
                // Note: cloning geometry? GLTFLoader reuses geometry.

                placeholder.add(instance);

                if (animations && animations.length) {
                    const mixer = new THREE.AnimationMixer(placeholder);
                    (rc as any).animationMixer = mixer;
                    (rc as any).availableAnimations = animations;

                    // Trigger animation sync immediately
                    this.syncFullMesh(entity, context);
                }

                try {
                    const desiredCast = (placeholder.userData as any)?.fullMeshCastShadow ?? false;
                    const desiredReceive = (placeholder.userData as any)?.fullMeshReceiveShadow ?? true;
                    this.applyShadowFlagsRecursive(placeholder, desiredCast, desiredReceive);
                } catch { }

                try {
                    (placeholder.userData as any).fullMeshKeyApplied = key;
                    (placeholder.userData as any).fullMeshLoaded = true; // Signal for onFrame to re-sync if needed
                } catch { }

                placeholder.visible = true;
            }
        });
    }

    private syncFullMesh(entity: Entity, context: RenderContext): void {
        const comp = entity.getComponent<any>("fullMesh");
        if (!comp) return;
        const rc = context.registry.get(entity.id);
        if (!rc?.object3D) return;

        // Shadow flags
        try {
            const cast = (comp as any).castShadow ?? false;
            const receive = (comp as any).receiveShadow ?? true;
            (rc.object3D as any).userData.fullMeshCastShadow = cast;
            (rc.object3D as any).userData.fullMeshReceiveShadow = receive;
            this.applyShadowFlagsRecursive(rc.object3D, cast, receive);
        } catch { }

        // Check key change
        const nextKey = String(comp.key ?? '').trim();
        const appliedKey = String((rc.object3D as any)?.userData?.fullMeshKeyApplied ?? '').trim();

        if (nextKey && nextKey !== appliedKey) {
            (rc.object3D as any).visible = false;
            this.disposeEntityAnimations(entity.id, context);
            if (context.engineResourceResolver) {
                this.loadAndApplyFullGlb(entity, nextKey, context);
            }
            return;
        }

        // Animation sync
        const mixer: any = (rc as any).animationMixer;
        const animations: any[] = (rc as any).availableAnimations ?? [];
        if (!mixer || !animations.length) return;

        const clipName = String(comp.animation?.clipName ?? "");
        const clip = clipName ? THREE.AnimationClip.findByName(animations, clipName) : animations[0];
        if (!clip) return;

        try {
            const prevAction: any = (rc as any).activeAction;
            if (prevAction) {
                prevAction.stop();
                try { prevAction.reset(); } catch { }
            }

            const action = mixer.clipAction(clip);
            action.setLoop(comp.animation?.loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
            if (typeof comp.animation?.time === 'number') action.time = comp.animation.time;
            if (comp.animation?.playing === false) action.paused = true;
            else action.play();

            (rc as any).activeAction = action;
        } catch { }
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
        const mixer: any = (rc as any).animationMixer;
        if (mixer) {
            mixer.stopAllAction();
            if (rc.object3D) mixer.uncacheRoot(rc.object3D);
        }
        delete (rc as any).animationMixer;
        delete (rc as any).availableAnimations;
        delete (rc as any).activeAction;
    }
}
