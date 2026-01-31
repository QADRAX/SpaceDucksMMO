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
  StandardMaterialComponent,
  BasicMaterialComponent,
  PhongMaterialComponent,
  LambertMaterialComponent,
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
import { TextureCache } from "../factories/TextureCache";
import { RenderObjectRegistry } from "./RenderObjectRegistry";
import { syncTransformToObject3D } from "./TransformSync";
import type { TextureCatalogService } from "@duckengine/core";

/**
 * Handles creation and updating of THREE.Mesh instances for ECS entities:
 * - geometry & material selection
 * - shader materials
 * - async texture resolution from catalog
 * - texture tiling application
 */
export class MeshSyncSystem {
  constructor(
    private readonly scene: THREE.Scene,
    private readonly registry: RenderObjectRegistry,
    private readonly textureCache: TextureCache,
    private readonly textureCatalog?: TextureCatalogService
  ) {}

  /**
   * Try to create a mesh for the given entity.
   * Returns true if a mesh has been created and registered.
   */
  processMesh(entity: Entity): boolean {
    const geometryComp = this.getGeometryComponent(entity);
    const materialComp = this.getMaterialComponent(entity);
    const shaderMaterial =
      entity.getComponent<ShaderMaterialComponent>("shaderMaterial");

    if (
      !geometryComp ||
      geometryComp.enabled === false ||
      ((!materialComp || materialComp.enabled === false) &&
        (!shaderMaterial || shaderMaterial.enabled === false))
    ) {
      return false;
    }

    this.createMesh(entity, geometryComp, materialComp, shaderMaterial);
    return true;
  }

  /**
   * Recreate mesh when geometry or shader material changes.
   */
  recreateMesh(entity: Entity): void {
    const rc = this.registry.get(entity.id);
    const geometry = this.getGeometryComponent(entity);
    const materialComp = this.getMaterialComponent(entity);
    const shaderMaterial =
      entity.getComponent<ShaderMaterialComponent>("shaderMaterial");

    if (rc?.object3D) {
      const shouldBeVisible =
        !!geometry &&
        geometry.enabled !== false &&
        ((materialComp && materialComp.enabled !== false) ||
          (shaderMaterial && shaderMaterial.enabled !== false));

      if (!shouldBeVisible) {
        rc.object3D.visible = false;
        return;
      }

      this.scene.remove(rc.object3D);
      if (rc.geometry) rc.geometry.dispose();
      if (rc.material) rc.material.dispose();
      this.registry.remove(entity.id, this.scene);
    }

    if (
      geometry &&
      geometry.enabled !== false &&
      ((materialComp && materialComp.enabled !== false) ||
        (shaderMaterial && shaderMaterial.enabled !== false))
    ) {
      this.createMesh(entity, geometry, materialComp, shaderMaterial);
    }
  }

  /**
   * Sync material changes from ECS components into the existing mesh.
   */
  syncMaterial(entity: Entity): void {
    const rc = this.registry.get(entity.id);
    if (!rc?.object3D || !(rc.object3D instanceof THREE.Mesh)) return;

    const materialComp = this.getMaterialComponent(entity);
    if (!materialComp || materialComp.enabled === false) {
      rc.object3D.visible = false;
      return;
    }

    if (rc.material) rc.material.dispose();

    const newMat = MaterialFactory.build(
      materialComp,
      this.textureCache,
      (tex) => {
        this.applyTextureTiling(entity, tex);
      }
    );

    rc.object3D.material = newMat;
    rc.material = newMat;
    rc.object3D.visible = true;

    if (materialComp) {
      this.resolveAndApplyTextures(entity, newMat, materialComp).catch(
        () => {}
      );
    }
  }

  /**
   * Called when the entity transform changes.
   * Updates the underlying THREE.Mesh transform if present.
   */
  syncTransform(entity: Entity): void {
    const rc = this.registry.get(entity.id);
    if (!rc?.object3D) return;
    syncTransformToObject3D(entity, rc.object3D);
  }

  /**
   * Re-apply texture tiling to all textures currently on the mesh material.
   */
  syncTextureTiling(entity: Entity): void {
    const rc = this.registry.get(entity.id);
    if (!rc || !(rc.object3D instanceof THREE.Mesh)) return;
    const mesh = rc.object3D as THREE.Mesh;

    const materials = Array.isArray(mesh.material)
      ? (mesh.material as THREE.Material[])
      : [mesh.material as THREE.Material];

    for (const m of materials) {
      if (!m) continue;
      const mm = m as any;
      if (mm.map) this.applyTextureTiling(entity, mm.map as THREE.Texture);
      if (mm.normalMap)
        this.applyTextureTiling(entity, mm.normalMap as THREE.Texture);
      if (mm.aoMap) this.applyTextureTiling(entity, mm.aoMap as THREE.Texture);
      if (mm.roughnessMap)
        this.applyTextureTiling(entity, mm.roughnessMap as THREE.Texture);
      if (mm.metalnessMap)
        this.applyTextureTiling(entity, mm.metalnessMap as THREE.Texture);
      if (mm.bumpMap)
        this.applyTextureTiling(entity, mm.bumpMap as THREE.Texture);
      if (mm.specularMap)
        this.applyTextureTiling(entity, mm.specularMap as THREE.Texture);
      if (mm.envMap)
        this.applyTextureTiling(entity, mm.envMap as THREE.Texture);
      (m as any).needsUpdate = true;
    }
  }

  // --- Private helpers ----------------------------------------------------

  private getGeometryComponent(entity: Entity): AnyGeometryComponent | null {
    return (
      entity.getComponent<BoxGeometryComponent>("boxGeometry") ??
      entity.getComponent<SphereGeometryComponent>("sphereGeometry") ??
      entity.getComponent<PlaneGeometryComponent>("planeGeometry") ??
      entity.getComponent<CylinderGeometryComponent>("cylinderGeometry") ??
      entity.getComponent<ConeGeometryComponent>("coneGeometry") ??
      entity.getComponent<TorusGeometryComponent>("torusGeometry") ??
      entity.getComponent<CustomGeometryComponent>("customGeometry") ??
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

  private createMesh(
    entity: Entity,
    geometryComp: AnyGeometryComponent,
    materialComp?: AnyMaterialComponent | null,
    shaderMaterialComp?: ShaderMaterialComponent
  ): void {
    const geometry = GeometryFactory.build(geometryComp);
    let material: THREE.Material;

    if (shaderMaterialComp) {
      material = ShaderMaterialFactory.build(
        shaderMaterialComp,
        this.textureCache
      );
    } else {
      const compToUse = materialComp as AnyMaterialComponent;
      material = MaterialFactory.build(compToUse, this.textureCache, (tex) => {
        this.applyTextureTiling(entity, tex);
      });
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData = mesh.userData || {};
    (mesh.userData as any).entityId = entity.id;

    syncTransformToObject3D(entity, mesh);
    this.scene.add(mesh);
    this.registry.add(entity.id, {
      entityId: entity.id,
      object3D: mesh,
      geometry,
      material,
    });

    if (materialComp) {
      this.resolveAndApplyTextures(entity, material, materialComp).catch(
        () => {}
      );
    }
  }

  private applyTextureTiling(entity: Entity, texture: THREE.Texture): void {
    const tiling = entity.getComponent<any>("textureTiling");
    if (!tiling) return;

    const repeatU = tiling.repeatU ?? 1;
    const repeatV = tiling.repeatV ?? 1;
    const offsetU = tiling.offsetU ?? 0;
    const offsetV = tiling.offsetV ?? 0;

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatU, repeatV);
    texture.offset.set(offsetU, offsetV);
    texture.needsUpdate = true;
  }

  /**
   * Resolve catalog ids in the material component and apply textures.
   * This is basically tu resolveAndApplyTextures actual, copiado aquí.
   */
  private async resolveAndApplyTextures(
    entity: Entity,
    material: THREE.Material,
    comp: AnyMaterialComponent
  ): Promise<void> {
    if (!this.textureCatalog) return;

    const isCatalogId = (val: unknown): val is string => {
      if (typeof val !== "string") return false;
      if (
        val.startsWith("/") ||
        val.startsWith("http://") ||
        val.startsWith("https://") ||
        val.startsWith("assets/") ||
        val.includes(".")
      ) {
        return false;
      }
      return true;
    };

    const applyIfLoaded = async (
      field:
        | "texture"
        | "normalMap"
        | "envMap"
        | "aoMap"
        | "roughnessMap"
        | "metalnessMap"
        | "bumpMap"
        | "specularMap",
      setter: (tex: THREE.Texture) => void
    ) => {
      const val = (comp as any)[field];
      if (!isCatalogId(val)) return;

      try {
        const variants = await this.textureCatalog!.getVariantsById(val);
        if (!variants || variants.length === 0) return;

        const rank: Record<string, number> = {
          ultra: 4,
          high: 3,
          medium: 2,
          low: 1,
        };

        variants.sort(
          (a, b) =>
            (rank[(b.quality ?? "low") as string] || 0) -
            (rank[(a.quality ?? "low") as string] || 0)
        );

        const chosen = variants[0];
        if (!chosen || !chosen.path) return;

        const tex = await this.textureCache.load(chosen.path);
        // Clone the texture so modifications (repeat/offset) won't affect other users
        const clone = tex.clone();
        setter(clone);
        // Apply tiling for this specific entity (if it has a TextureTilingComponent)
        try {
          this.applyTextureTiling(entity, clone);
        } catch {
          // ignore errors applying tiling
        }
        material.needsUpdate = true;
      } catch {
        // ignore
      }
    };

    await applyIfLoaded("texture", (t) => {
      if ("map" in material) (material as any).map = t;
    });
    await applyIfLoaded("normalMap", (t) => {
      if ("normalMap" in material) (material as any).normalMap = t;
    });
    await applyIfLoaded("envMap", (t) => {
      if ("envMap" in material) (material as any).envMap = t;
    });
    await applyIfLoaded("aoMap", (t) => {
      if ("aoMap" in material) (material as any).aoMap = t;
    });
    await applyIfLoaded("roughnessMap", (t) => {
      if ("roughnessMap" in material) (material as any).roughnessMap = t;
    });
    await applyIfLoaded("metalnessMap", (t) => {
      if ("metalnessMap" in material) (material as any).metalnessMap = t;
    });
    await applyIfLoaded("bumpMap", (t) => {
      if ("bumpMap" in material) (material as any).bumpMap = t;
    });
    await applyIfLoaded("specularMap", (t) => {
      if ("specularMap" in material) (material as any).specularMap = t;
    });
  }
}
