// @ts-ignore
import * as THREE from "three/webgpu";
import type {
    Entity,
    StandardMaterialComponent,
    BasicMaterialComponent,
    PhongMaterialComponent,
    LambertMaterialComponent,
    ComponentType,
} from "@duckengine/ecs";
import {
    MaterialFactory,
    type AnyMaterialComponent,
} from "../factories/MaterialFactory";
import type { RenderFeature } from "./RenderFeature";
import type { RenderContext } from "./RenderContext";
import { deferredDispose } from "../debug/DebugUtils";

export class MaterialFeature implements RenderFeature {
    readonly name = "MaterialFeature";

    isEligible(entity: Entity): boolean {
        // Material requires an Object3D to attach to.
        const materialComp = this.getMaterialComponent(entity);
        return !!materialComp && materialComp.enabled !== false;
    }

    onAttach(entity: Entity, context: RenderContext): void {
        this.syncMaterial(entity, context);
    }

    onUpdate(entity: Entity, componentType: ComponentType, context: RenderContext): void {
        switch (componentType) {
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
        if (this.isMaterialComponent(componentType)) {
            this.syncMaterial(entity, context);
        } else if (componentType === "textureTiling") {
            this.resetTextureTiling(entity, context);
        }
    }

    onDetach(entity: Entity, context: RenderContext): void {
        const rc = context.registry.get(entity.id);
        if (rc?.object3D instanceof THREE.Mesh) {
            this.applyDefaultMaterial(rc.object3D);
        }
    }

    private isMaterialComponent(type: ComponentType): boolean {
        return [
            "standardMaterial", "basicMaterial", "phongMaterial", "lambertMaterial"
        ].includes(type);
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

    private syncMaterial(entity: Entity, context: RenderContext): void {
        const rc = context.registry.get(entity.id);
        if (!rc?.object3D || !(rc.object3D instanceof THREE.Mesh)) return;

        const materialComp = this.getMaterialComponent(entity);

        if (!materialComp || materialComp.enabled === false) {
            this.applyDefaultMaterial(rc.object3D);
            return;
        }

        if (rc.material) {
            if (Array.isArray(rc.material)) rc.material.forEach((m: any) => deferredDispose(m));
            else deferredDispose(rc.material);
        }

        let newMat: THREE.Material = MaterialFactory.build(materialComp as AnyMaterialComponent, context.textureCache, (tex) => {
            this.applyTextureSettings(entity, tex);
        });

        const mesh = rc.object3D as THREE.Mesh;
        mesh.material = newMat;
        rc.material = newMat;

        this.resolveAndApplyTextures(entity, newMat, materialComp, context);
    }

    private applyDefaultMaterial(mesh: THREE.Mesh): void {
        if (mesh.material) {
            deferredDispose(mesh.material as any);
        }
        mesh.material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
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
        const isCustom = !!entity.getComponent<any>("customGeometry") || !!entity.getComponent<any>("fullMesh");
        if (isCustom) {
            (texture as any).flipY = false;
            texture.needsUpdate = true;
        }
    }

    private async resolveAndApplyTextures(entity: Entity, material: THREE.Material, comp: AnyMaterialComponent, context: RenderContext) {
        if (!context.textureCatalog) return;

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
        } catch { }
    }
}
