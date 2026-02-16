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
import type { EngineResourceResolver } from "../../resources/EngineResourceResolver";

/**
 * Handles creation and updating of THREE.Mesh instances for ECS entities:
 * - geometry & material selection
 * - shader materials
 * - async texture resolution from catalog
 * - texture tiling application
 */
export class MeshSyncSystem {
  private gltfLoader: any | null = null;
  private readonly customGeometryRequestByEntityId = new Map<
    string,
    { key: string; requestId: number }
  >();
  private readonly customGeometryCacheByUrl = new Map<
    string,
    Promise<THREE.BufferGeometry>
  >();

  constructor(
    private readonly scene: THREE.Scene,
    private readonly registry: RenderObjectRegistry,
    private readonly textureCache: TextureCache,
    private readonly textureCatalog?: TextureCatalogService,
    private readonly engineResourceResolver?: EngineResourceResolver
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

    const isFullMesh = !!geometryComp && (geometryComp as any).type === "fullMesh";

    if (!geometryComp || geometryComp.enabled === false) return false;

    // Full meshes carry their own materials inside the GLB, so they must not
    // require a separate material/shader component to be present.
    if (
      !isFullMesh &&
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

    const isFullMesh = !!geometry && (geometry as any).type === "fullMesh";

    if (rc?.object3D) {
      const shouldBeVisible =
        !!geometry &&
        geometry.enabled !== false &&
        (isFullMesh ||
          (materialComp && materialComp.enabled !== false) ||
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
      (isFullMesh ||
        (materialComp && materialComp.enabled !== false) ||
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
        this.applyTextureSettings(entity, tex);
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
   * Sync changes to CustomGeometryComponent without recreating the mesh.
   * This avoids flicker when editing fields like castShadow/receiveShadow/boundingRadius.
   * Only triggers an async reload when the mesh key changes.
   */
  syncCustomGeometry(entity: Entity): void {
    const comp = entity.getComponent<CustomGeometryComponent>("customGeometry");
    if (!comp) return;

    const rc = this.registry.get(entity.id);
    if (!rc?.object3D || !(rc.object3D instanceof THREE.Mesh)) {
      // No mesh yet (or not a mesh): fall back to recreate path.
      this.recreateMesh(entity);
      return;
    }

    const mesh = rc.object3D as THREE.Mesh;

    // Respect enabled flag: hide when disabled.
    if (comp.enabled === false) {
      mesh.visible = false;
      return;
    }

    // Update shadow flags live (no geometry reload needed).
    try {
      mesh.castShadow = (comp as any).castShadow ?? false;
      mesh.receiveShadow = (comp as any).receiveShadow ?? true;
    } catch {
      // ignore
    }

    const key = String((comp as any).key ?? "").trim();
    if (!key) {
      mesh.visible = false;
      return;
    }

    const appliedKey = String((mesh.userData as any)?.customGeometryKeyApplied ?? "");
    if (appliedKey === key) {
      // Already showing correct geometry.
      if (mesh.geometry) {
        // If we have geometry, keep it visible.
        mesh.visible = true;
      }
      return;
    }

    // Key changed (or not yet applied): load and swap geometry when ready.
    // Avoid flicker: keep current mesh visible if it already has geometry.
    try {
      const pos = (mesh.geometry as any)?.getAttribute?.("position") as THREE.BufferAttribute | undefined;
      const hasPositions = !!pos && (pos.count ?? 0) > 0;
      if (!hasPositions) mesh.visible = false;
    } catch {
      // If we can't determine, stay conservative.
      mesh.visible = false;
    }

    this.loadAndApplyCustomGeometry(entity.id, key).catch(() => {});
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

  private createMesh(
    entity: Entity,
    geometryComp: AnyGeometryComponent,
    materialComp?: AnyMaterialComponent | null,
    shaderMaterialComp?: ShaderMaterialComponent
  ): void {
    // Special-case: full GLB (scene graph + animations) — create placeholder
    if ((geometryComp as any).type === "fullMesh") {
      const group = new THREE.Group();
      group.visible = false;
      group.userData = group.userData || {};
      (group.userData as any).entityId = entity.id;

      // Persist desired shadow flags so async GLB loading can apply them.
      try {
        (group.userData as any).fullMeshCastShadow = (geometryComp as any).castShadow ?? false;
        (group.userData as any).fullMeshReceiveShadow = (geometryComp as any).receiveShadow ?? true;
      } catch {}

      syncTransformToObject3D(entity, group);
      this.scene.add(group);
      this.registry.add(entity.id, {
        entityId: entity.id,
        object3D: group,
        geometry: undefined,
        material: undefined,
      });

      // Apply shadow flags immediately so the placeholder subtree (once loaded)
      // uses the expected cast/receive settings.
      try {
        this.applyShadowFlagsToObject3D(group, (geometryComp as any).castShadow ?? false, (geometryComp as any).receiveShadow ?? true);
      } catch {}

      const key = String(((geometryComp as any).key ?? "") as string).trim();
      if (key && this.engineResourceResolver) this.loadAndApplyFullGlb(entity.id, key).catch(() => {});
      return;
    }

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
        this.applyTextureSettings(entity, tex);
      });
    }

    const mesh = new THREE.Mesh(geometry, material);
    // Shadows: lights can have castShadow enabled, but meshes must opt-in too.
    // Use per-geometry flags when available.
    try {
      mesh.castShadow = (geometryComp as any).castShadow ?? false;
      mesh.receiveShadow = (geometryComp as any).receiveShadow ?? true;
    } catch {
      // ignore
    }

    // Custom geometry is loaded asynchronously; don't render any placeholder while loading.
    if (geometryComp.type === "customGeometry") {
      mesh.visible = false;
    }
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

    // Async custom mesh loading (best-effort).
    if (geometryComp.type === "customGeometry") {
      const key = (geometryComp as unknown as CustomGeometryComponent).key;
      if (typeof key === "string" && key.trim().length > 0) {
        this.loadAndApplyCustomGeometry(entity.id, key.trim()).catch(() => {});
      }
    }

    if (materialComp) {
      this.resolveAndApplyTextures(entity, material, materialComp).catch(
        () => {}
      );
    }
  }

  private async loadAndApplyCustomGeometry(
    entityId: string,
    resourceKey: string
  ): Promise<void> {
    if (!this.engineResourceResolver) {
      // Silent by default: engine can run without web-core.
      return;
    }

    const prev = this.customGeometryRequestByEntityId.get(entityId);
    const requestId = (prev?.requestId ?? 0) + 1;
    this.customGeometryRequestByEntityId.set(entityId, {
      key: resourceKey,
      requestId,
    });

    const resolved = await this.engineResourceResolver.resolve(resourceKey, "active");
    const meshFile = resolved?.files?.mesh;
    const url = meshFile?.url;
    try {
      console.warn(`[MeshSyncSystem] loadAndApplyFullGlb: entity=${entityId} key=${resourceKey} url=${url}`);
    } catch {}
    if (typeof url !== "string" || !url.length) return;

    const geomPromise = this.customGeometryCacheByUrl.get(url) ??
      this.loadGlbGeometry(url, resolved);
    this.customGeometryCacheByUrl.set(url, geomPromise);

    const loadedGeometry = await geomPromise;

    // Ensure entity still exists and still wants this key.
    const current = this.customGeometryRequestByEntityId.get(entityId);
    if (!current || current.requestId !== requestId || current.key !== resourceKey) return;

    const rc = this.registry.get(entityId);
    if (!rc?.object3D || !(rc.object3D instanceof THREE.Mesh)) return;

    const mesh = rc.object3D as THREE.Mesh;

    try {
      if (rc.geometry) rc.geometry.dispose();
    } catch {}

    const nextGeometry = loadedGeometry.clone();

    // Normalize UV channels for glTF/custom geometry.
    this.normalizeGlbUvs(nextGeometry);

    // If the geometry has no UVs, any texture maps won't render. Emit a warning to make
    // the root cause obvious during preview/runtime debugging.
    try {
      const uv = (nextGeometry as any).getAttribute?.('uv') as THREE.BufferAttribute | undefined;
      if (!uv) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        const usesMaps = materials.some((m) => {
          const mm = m as any;
          return !!(
            mm?.map ||
            mm?.normalMap ||
            mm?.aoMap ||
            mm?.roughnessMap ||
            mm?.metalnessMap ||
            mm?.bumpMap ||
            mm?.specularMap
          );
        });
        if (usesMaps) {
          console.warn(
            '[MeshSyncSystem] Custom mesh geometry has no UVs (TEXCOORD_0). Texture maps will not render.',
            { entityId, resourceKey }
          );
        }
      }
    } catch {}

    mesh.geometry = nextGeometry;
    rc.geometry = nextGeometry;

    try {
      mesh.userData = mesh.userData || {};
      (mesh.userData as any).customGeometryKeyApplied = resourceKey;
    } catch {}

    // Geometry is now ready; show the mesh.
    mesh.visible = true;
  }

  /**
   * Load a full GLB (scene + materials + animations) and apply it to the entity.
   */
  private async loadAndApplyFullGlb(entityId: string, resourceKey: string): Promise<void> {
    if (!this.engineResourceResolver) return;

    const prev = this.customGeometryRequestByEntityId.get(entityId);
    const requestId = (prev?.requestId ?? 0) + 1;
    this.customGeometryRequestByEntityId.set(entityId, {
      key: resourceKey,
      requestId,
    });

    const resolved = await this.engineResourceResolver.resolve(resourceKey, "active");
    const meshFile = resolved?.files?.mesh;
    const url = meshFile?.url;
    if (typeof url !== "string" || !url.length) return;

    // Create a GLTFLoader instance for this resolved resource so we can
    // map any referenced external image URLs to the file bindings returned
    // by the engine resource resolver. This ensures textures referenced by
    // relative paths inside the GLB are fetched from the uploaded file URLs.
    const loader = await this.createLoaderForResolved(resolved);
    const gltf = await loader.loadAsync(url);
    try {
      // Report basic GLTF load info to aid debugging in the browser console.
      let meshCount = 0;
      let animCount = (gltf && (gltf.animations || []).length) || 0;
      try {
        (gltf.scene || new THREE.Group()).traverse((o: any) => {
          if (o && (o as any).isMesh) meshCount++;
        });
      } catch {}
      console.warn(`[MeshSyncSystem] GLTF loaded: url=${url} meshes=${meshCount} animations=${animCount}`);
    } catch {}

    const nextRoot = gltf.scene ? (gltf.scene.clone(true) as THREE.Object3D) : new THREE.Group();

    // Normalize UVs on geometries inside the glTF scene
    nextRoot.traverse((obj: THREE.Object3D) => {
      const anyObj: any = obj;
      const geom = anyObj.geometry as THREE.BufferGeometry | undefined;
      if (geom instanceof THREE.BufferGeometry) {
        try {
          this.normalizeGlbUvs(geom);
        } catch {}
      }
    });

    const current = this.customGeometryRequestByEntityId.get(entityId);
    if (!current || current.requestId !== requestId || current.key !== resourceKey) return;

    const rc = this.registry.get(entityId);
    if (!rc || !rc.object3D) return;

    const placeholder = rc.object3D as THREE.Object3D;

    // Remove existing children
    try {
      while (placeholder.children.length) {
        const ch = placeholder.children.pop()!;
        try {
          if (ch.parent) ch.parent.remove(ch);
        } catch {}
      }
    } catch {}

    // Add only a single entity from the GLB: pick the first node that contains a Mesh
    try {
      let foundMesh: THREE.Mesh | null = null;
      (nextRoot as any).traverse((obj: THREE.Object3D) => {
        if (foundMesh) return;
        if ((obj as any) instanceof THREE.Mesh) foundMesh = obj as THREE.Mesh;
      });

      if (foundMesh) {
        // Choose the top-level ancestor under the scene that contains the mesh.
        let ancestor: THREE.Object3D = foundMesh;
        while (ancestor.parent && ancestor.parent !== nextRoot) {
          ancestor = ancestor.parent as THREE.Object3D;
        }

        const toAdd = ancestor.clone(true) as THREE.Object3D;

        // Remove any cameras or lights from the cloned subtree to avoid adding GLB cameras/lights.
        try {
          toAdd.traverse((n) => {
            try {
              if ((n as any) instanceof THREE.Camera || (n as any) instanceof THREE.Light) {
                if (n.parent) n.parent.remove(n);
              }
            } catch {}
          });
        } catch {}

        placeholder.add(toAdd);

        try {
          // Debug: report how many mesh children and whether materials appear present
          let meshes = 0;
          let mats = 0;
          toAdd.traverse((n: any) => {
            if (n && n.isMesh) {
              meshes++;
              try {
                const m = n.material;
                if (m) mats++;
              } catch {}
            }
          });
          console.warn(`[MeshSyncSystem] applied GLB subtree: addedMeshes=${meshes} addedMaterials=${mats} entity=${entityId}`);
        } catch {}
      } else {
        // Fallback: add entire scene if no mesh found.
        if ((nextRoot as any).children && (nextRoot as any).children.length) {
          for (const child of (nextRoot as any).children.slice()) {
              try {
                placeholder.add(child);
              } catch {}
            }
          try {
            console.warn(`[MeshSyncSystem] applied GLB fallback scene children=${(nextRoot as any).children.length} entity=${entityId}`);
          } catch {}
        } else {
          try {
            placeholder.add(nextRoot as any);
          } catch {}
        }
      }
    } catch {}

    // Ensure all meshes in the loaded subtree respect the FullMeshComponent shadow flags.
    try {
      const desiredCast = (placeholder.userData as any)?.fullMeshCastShadow ?? false;
      const desiredReceive = (placeholder.userData as any)?.fullMeshReceiveShadow ?? true;
      this.applyShadowFlagsToObject3D(placeholder, desiredCast, desiredReceive);
    } catch {}

    try {
      placeholder.userData = placeholder.userData || {};
      (placeholder.userData as any).fullMeshKeyApplied = resourceKey;
    } catch {}

    // Setup animation mixer if present
    try {
      const animations = gltf.animations ?? [];
      if (animations.length > 0) {
        const mixer = new (THREE as any).AnimationMixer(placeholder);
        (rc as any).animationMixer = mixer;
        (rc as any).availableAnimations = animations;
      }
    } catch {}

    try {
      placeholder.userData = placeholder.userData || {};
      (placeholder.userData as any).fullMeshLoaded = true;
    } catch {}
    placeholder.visible = true;
  }

  /**
   * Sync a FullMeshComponent's animation settings into the loaded object
   */
  syncFullMesh(entity: Entity): void {
    const comp = entity.getComponent<any>("fullMesh");
    if (!comp) return;
    const rc = this.registry.get(entity.id);
    if (!rc?.object3D) return;

    // Shadow flags should be live-editable from the inspector.
    try {
      const cast = (comp as any).castShadow ?? false;
      const receive = (comp as any).receiveShadow ?? true;
      (rc.object3D as any).userData = (rc.object3D as any).userData || {};
      (rc.object3D as any).userData.fullMeshCastShadow = cast;
      (rc.object3D as any).userData.fullMeshReceiveShadow = receive;
      this.applyShadowFlagsToObject3D(rc.object3D as THREE.Object3D, cast, receive);
    } catch {}

    // If the key changed, reload the GLB immediately.
    try {
      const nextKey = String(comp.key ?? '').trim();
      const appliedKey = String((rc.object3D as any)?.userData?.fullMeshKeyApplied ?? '').trim();

      if (!nextKey) {
        // No key -> hide placeholder.
        try { (rc.object3D as any).visible = false; } catch {}
        return;
      }

      if (nextKey && nextKey !== appliedKey) {
        try { (rc.object3D as any).visible = false; } catch {}
        try { this.disposeEntityAnimations(entity.id); } catch {}
        if (this.engineResourceResolver) {
          this.loadAndApplyFullGlb(entity.id, nextKey).catch(() => {});
        }
        return;
      }

      // If we have a key but we haven't finished loading yet, keep trying.
      const loaded = !!((rc.object3D as any)?.userData?.fullMeshLoaded);
      if (!loaded && this.engineResourceResolver && nextKey) {
        this.loadAndApplyFullGlb(entity.id, nextKey).catch(() => {});
      }
    } catch {}

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
        try { prevAction.reset(); } catch {}
      }

      const action = mixer.clipAction(clip);
      action.setLoop(comp.animation?.loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
      if (typeof comp.animation?.time === 'number') action.time = comp.animation.time as number;
      if (comp.animation?.playing === false) {
        action.paused = true;
      } else {
        action.play();
      }
      (rc as any).activeAction = action;
    } catch {}
  }

  private applyShadowFlagsToObject3D(root: THREE.Object3D, castShadow: boolean, receiveShadow: boolean): void {
    try {
      root.traverse((o: any) => {
        if (!o) return;
        if (o.isMesh) {
          try {
            o.castShadow = !!castShadow;
            o.receiveShadow = !!receiveShadow;
          } catch {}
        }
      });
    } catch {}
  }

  /** Update animation mixers (call from engine render loop) */
  update(dtMs: number): void {
    const ms = dtMs / 1000;
    for (const rc of this.registry.getAll().values()) {
      const mixer: any = (rc as any).animationMixer;
      if (mixer && typeof mixer.update === "function") {
        try {
          mixer.update(ms);
        } catch {}
      }
    }
  }

  /** Dispose any animation resources associated with an entity (called before removal). */
  disposeEntityAnimations(entityId: string): void {
    const rc = this.registry.get(entityId);
    if (!rc) return;
    const mixer: any = (rc as any).animationMixer;
    try {
      if (mixer) {
        try {
          if (typeof mixer.stopAllAction === 'function') mixer.stopAllAction();
        } catch {}
        try {
          if (typeof mixer.uncacheRoot === 'function' && rc.object3D) mixer.uncacheRoot(rc.object3D);
        } catch {}
      }
    } catch {}
    try {
      delete (rc as any).animationMixer;
      delete (rc as any).availableAnimations;
      delete (rc as any).activeAction;
    } catch {}
  }

  private async loadGlbGeometry(url: string, resolved?: any): Promise<THREE.BufferGeometry> {
    // Use a loader configured with resolved file mappings when available,
    // otherwise fall back to the shared loader.
    const loader = resolved ? await this.createLoaderForResolved(resolved) : await this.getGltfLoader();
    try {
      console.warn(`[MeshSyncSystem] loadGlbGeometry: loading url=${url} usingResolved=${!!resolved}`);
    } catch {}
    const gltf = await loader.loadAsync(url);
    try {
      let meshCount = 0;
      try {
        (gltf.scene || new THREE.Group()).traverse((o: any) => {
          if (o && (o as any).isMesh) meshCount++;
        });
      } catch {}
      console.warn(`[MeshSyncSystem] loadGlbGeometry: loaded url=${url} meshes=${meshCount}`);
    } catch {}
    let found: THREE.Mesh | null = null;

    gltf.scene.traverse((obj: THREE.Object3D) => {
      if (found) return;
      if ((obj as any) instanceof THREE.Mesh) {
        found = obj as THREE.Mesh;
      }
    });

    if (!found) {
      throw new Error("GLB did not contain a mesh");
    }

    const geometry = (found as any).geometry as unknown;
    if (!(geometry instanceof THREE.BufferGeometry)) {
      throw new Error("GLB mesh did not contain a BufferGeometry");
    }

    // Normalize: ensure normals exist so lighting/PBR materials shade correctly.
    // Many exporters can omit normals; Three will then render with invalid lighting
    // making it look like the material isn't applied.
    try {
      const hasNormals = (geometry as any).getAttribute?.('normal');
      if (!hasNormals) {
        geometry.computeVertexNormals();
        try {
          (geometry as any).normalizeNormals?.();
        } catch {}
      }
    } catch {}

    // Normalize: ensure bounds exist for raycasting/culling.
    try {
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
    } catch {}

    // Normalize UV channels early so cached geometry is consistent.
    this.normalizeGlbUvs(geometry);

    return geometry;
  }

  /**
   * Best-effort normalization for UV channels coming from GLB/glTF.
   *
   * Why: Three.js samples baseColor/normal/roughness/metalness/etc. using the `uv` attribute.
   * Some GLBs ship only TEXCOORD_1 (mapped to `uv2`) or provide an unexpected itemSize.
   *
   * This keeps behavior conservative:
   * - If `uv` is missing but `uv2` exists, copy `uv2 -> uv`
   * - If `uv2` is missing but `uv` exists, copy `uv -> uv2` (helps aoMap)
   * - If any uv attribute has itemSize > 2, truncate to vec2
   */
  private normalizeGlbUvs(geometry: THREE.BufferGeometry): void {
    try {
      const g: any = geometry as any;
      if (!g?.getAttribute || !g?.setAttribute) return;

      const getUvAttr = (name: string): any => {
        try {
          return g.getAttribute(name);
        } catch {
          return undefined;
        }
      };

      const truncateToVec2 = (attr: any): THREE.BufferAttribute | undefined => {
        if (!attr) return undefined;
        const itemSize = attr.itemSize ?? 0;
        const count = attr.count ?? 0;
        if (itemSize === 2) return attr as THREE.BufferAttribute;
        if (itemSize < 2 || !count) return undefined;

        const array = attr.array as ArrayLike<number> | undefined;
        if (!array) return undefined;

        const out = new Float32Array(count * 2);
        for (let i = 0; i < count; i++) {
          out[i * 2 + 0] = (array as any)[i * itemSize + 0] ?? 0;
          out[i * 2 + 1] = (array as any)[i * itemSize + 1] ?? 0;
        }
        return new THREE.BufferAttribute(out, 2);
      };

      let uv: any = getUvAttr("uv");
      let uv2: any = getUvAttr("uv2");

      // Some pipelines may expose alternative UV names; pick first match.
      if (!uv) {
        uv =
          getUvAttr("uv0") ??
          getUvAttr("uv1") ??
          getUvAttr("TEXCOORD_0") ??
          undefined;
      }

      // If we found an alternative UV attr, remap it to `uv`.
      if (uv && !getUvAttr("uv")) {
        g.setAttribute("uv", uv);
      }

      // Re-read after potential remap.
      uv = getUvAttr("uv");
      uv2 = getUvAttr("uv2");

      // If base `uv` missing but `uv2` exists, copy uv2 -> uv.
      if (!uv && uv2) {
        try {
          g.setAttribute("uv", uv2.clone ? uv2.clone() : uv2);
        } catch {
          g.setAttribute("uv", uv2);
        }
      }

      // If `uv2` missing but `uv` exists, copy uv -> uv2 (for aoMap/lightMap).
      uv = getUvAttr("uv");
      uv2 = getUvAttr("uv2");
      if (uv && !uv2) {
        try {
          g.setAttribute("uv2", uv.clone ? uv.clone() : uv);
        } catch {
          g.setAttribute("uv2", uv);
        }
      }

      // Ensure uv/uv2 are vec2.
      const uvFixed = truncateToVec2(getUvAttr("uv"));
      if (uvFixed) g.setAttribute("uv", uvFixed);

      const uv2Fixed = truncateToVec2(getUvAttr("uv2"));
      if (uv2Fixed) g.setAttribute("uv2", uv2Fixed);

      // Fallback: some GLBs truly ship without TEXCOORD_0. In that case, generate a
      // simple planar UV projection so texture maps can still render (preview-friendly).
      // This is best-effort and won't match authored UV unwraps.
      if (!getUvAttr("uv")) {
        const pos: any = getUvAttr("position");
        const count = pos?.count ?? 0;
        const itemSize = pos?.itemSize ?? 0;
        const array = pos?.array as ArrayLike<number> | undefined;

        if (count > 0 && itemSize >= 3 && array) {
          let minX = Infinity,
            minY = Infinity,
            minZ = Infinity;
          let maxX = -Infinity,
            maxY = -Infinity,
            maxZ = -Infinity;

          for (let i = 0; i < count; i++) {
            const x = (array as any)[i * itemSize + 0] ?? 0;
            const y = (array as any)[i * itemSize + 1] ?? 0;
            const z = (array as any)[i * itemSize + 2] ?? 0;
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (z < minZ) minZ = z;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
            if (z > maxZ) maxZ = z;
          }

          const dx = maxX - minX;
          const dy = maxY - minY;
          const dz = maxZ - minZ;

          type Axis = {
            name: "x" | "y" | "z";
            range: number;
            min: number;
            read: (i: number) => number;
          };

          const axes: Axis[] = [
            {
              name: "x",
              range: dx,
              min: minX,
              read: (i) => (array as any)[i * itemSize + 0] ?? 0,
            },
            {
              name: "y",
              range: dy,
              min: minY,
              read: (i) => (array as any)[i * itemSize + 1] ?? 0,
            },
            {
              name: "z",
              range: dz,
              min: minZ,
              read: (i) => (array as any)[i * itemSize + 2] ?? 0,
            },
          ];

          axes.sort((a, b) => (b.range ?? 0) - (a.range ?? 0));
          const uAxis = axes[0];
          const vAxis = axes[1] ?? axes[0];

          const uRange = uAxis.range || 1;
          const vRange = vAxis.range || 1;

          const out = new Float32Array(count * 2);
          for (let i = 0; i < count; i++) {
            const u = (uAxis.read(i) - uAxis.min) / uRange;
            const v = (vAxis.read(i) - vAxis.min) / vRange;
            out[i * 2 + 0] = Number.isFinite(u) ? u : 0;
            out[i * 2 + 1] = Number.isFinite(v) ? v : 0;
          }

          const uvGenerated = new THREE.BufferAttribute(out, 2);
          g.setAttribute("uv", uvGenerated);
          if (!getUvAttr("uv2")) {
            try {
              g.setAttribute("uv2", uvGenerated.clone());
            } catch {
              g.setAttribute("uv2", uvGenerated);
            }
          }
        }
      }
    } catch {
      // best-effort only
    }
  }

  private async getGltfLoader(): Promise<any> {
    if (this.gltfLoader) return this.gltfLoader;
    // Lazy-load to avoid Jest failing on ESM imports from three/addons.
    const mod: any = await import("three/addons/loaders/GLTFLoader.js");
    this.gltfLoader = new mod.GLTFLoader();
    return this.gltfLoader;
  }

  /**
   * Create a GLTFLoader instance configured to remap requested relative URLs
   * to the resolved file bindings (if available). This lets GLBs that reference
   * external textures by path load those textures from the server URLs returned
   * by the engine resource resolver.
   */
  private async createLoaderForResolved(resolved: any): Promise<any> {
    const mod: any = await import("three/addons/loaders/GLTFLoader.js");
    const loader = new mod.GLTFLoader();

    try {
      const filesMap = resolved?.files ?? {};

      loader.manager.setURLModifier((requestedUrl: string) => {
        try {
          // If the requested URL is absolute, return as-is.
          try {
            const u = new URL(requestedUrl, 'http://example.invalid');
            if (u.protocol === 'http:' || u.protocol === 'https:') {
              console.warn(`[MeshSyncSystem] URLModifier pass-through absolute requested=${requestedUrl}`);
              return requestedUrl;
            }
          } catch {
            // ignore
          }

          // Extract basename from requested path (strip any query/hash)
          const parts = requestedUrl.split(/[\\/\\?\\#]+/).filter(Boolean);
          const reqBase = parts.length ? parts[parts.length - 1] : requestedUrl;

          // Try to find a matching file by basename in the resolved files list.
          for (const key of Object.keys(filesMap)) {
            try {
              const f = filesMap[key];
              const fname = String(f?.fileName ?? '');
              const base = fname.split('/').pop() || fname;
              if (base === reqBase) {
                const mapped = String(f?.url ?? requestedUrl);
                try {
                  console.warn(`[MeshSyncSystem] URLModifier map request=${requestedUrl} -> ${mapped}`);
                } catch {}
                return mapped;
              }
            } catch {
              // ignore
            }
          }

          // No mapping found: return requested URL unchanged so the loader may resolve it normally.
          try {
            console.warn(`[MeshSyncSystem] URLModifier no-map for requested=${requestedUrl}`);
          } catch {}
          return requestedUrl;
        } catch {
          return requestedUrl;
        }
      });
    } catch {
      // ignore; fall back to plain loader
    }

    return loader;
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
   * Apply per-entity texture settings (tiling + any geometry-specific conventions).
   *
   * Important: glTF UV convention expects textures with flipY=false. If we apply a
   * TextureLoader texture (default flipY=true) onto a GLB geometry, the texture will
   * look wrong / appear not to match. Built-in Three geometries typically expect flipY=true.
   */
  private applyTextureSettings(entity: Entity, texture: THREE.Texture): void {
    // Keep existing tiling behavior.
    try {
      this.applyTextureTiling(entity, texture);
    } catch {}

    // If this entity uses custom GLB geometry or a full GLB resource, align to glTF conventions.
    try {
      const isCustom = !!entity.getComponent<CustomGeometryComponent>("customGeometry") || !!entity.getComponent<any>("fullMesh");
      if (isCustom) {
        (texture as any).flipY = false;
        texture.needsUpdate = true;
      }
    } catch {}
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
        // Clone the texture so per-entity modifications (repeat/offset/flipY) won't affect
        // other users of the cached texture. If clone fails (some runtimes), fall back.
        let t: THREE.Texture;
        try {
          t = (tex as THREE.Texture).clone();
        } catch (cloneErr) {
          console.warn('[MeshSyncSystem] Texture.clone() failed, using original texture', cloneErr);
          t = tex;
        }

        setter(t);
        // Apply per-entity texture settings (tiling + glTF custom-mesh conventions)
        try {
          this.applyTextureSettings(entity, t);
        } catch {}
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
