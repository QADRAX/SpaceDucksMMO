import * as THREE from "three";
import type {
  Entity,
  ComponentEvent,
  ComponentListener,
  IComponentObserver,
  LensFlareComponent,
  CameraViewComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  PointLightComponent,
  SpotLightComponent,
  SkyboxComponent,
} from "@duckengine/ecs";
import type { IRenderSyncSystem, ITextureResolver, TextureCatalogService } from "@duckengine/core";
import { RenderObjectRegistry } from "./RenderObjectRegistry";
import { ShaderUniformUpdater } from "./ShaderUniformUpdater";
import { MeshSyncSystem } from "./MeshSyncSystem";
import { CameraSyncSystem } from "./CameraSyncSystem";
import { LightSyncSystem } from "./LightSyncSystem";
import { LensFlareSystem } from "./LensFlareSystem";
import DebugTransformSystem from "../debug/DebugTransformSystem";
import DebugMeshSystem from "../debug/DebugMeshSystem";
import DebugColliderSystem from "../debug/DebugColliderSystem";
import { TextureCache } from "../factories/TextureCache";
import type { AnyLightComponent } from "../factories/LightFactory";
import type { EngineResourceResolver } from "../../resources/EngineResourceResolver";

export class RenderSyncSystem implements IRenderSyncSystem, IComponentObserver {
  private readonly scene: THREE.Scene;
  private readonly registry = new RenderObjectRegistry();
  private readonly entities = new Map<string, Entity>();
  private readonly componentListeners = new Map<string, ComponentListener>();
  private readonly textureCache = new TextureCache();
  private readonly uniformUpdater = new ShaderUniformUpdater();
  private readonly meshSystem: MeshSyncSystem;
  private readonly cameraSystem: CameraSyncSystem;
  private readonly lightSystem: LightSyncSystem;
  private readonly lensFlareSystem: LensFlareSystem;
  private readonly debugSystem: DebugTransformSystem;
  private readonly meshDebugSystem: DebugMeshSystem;
  private readonly colliderDebugSystem: DebugColliderSystem;
  private readonly textureCatalog?: TextureCatalogService;
  private readonly textureResolver?: ITextureResolver;
  private readonly engineResourceResolver?: EngineResourceResolver;
  private sceneDebugMaster = false;
  private sceneMeshDebugMaster = false;
  private sceneColliderDebugMaster = false;
  private readonly debugFlagListeners = new Map<string, (enabled: boolean) => void>();
  private readonly debugMeshFlagListeners = new Map<string, (enabled: boolean) => void>();
  private readonly debugColliderFlagListeners = new Map<string, (enabled: boolean) => void>();
  private activeCameraEntityId: string | null = null;

  private currentSkyboxResourceKey: string | null = null;
  private currentSkyboxTexture: THREE.Texture | THREE.CubeTexture | null = null;
  private skyboxLoadToken = 0;

  constructor(
    scene: THREE.Scene,
    textureCatalog?: TextureCatalogService,
    textureResolver?: ITextureResolver,
    engineResourceResolver?: EngineResourceResolver
  ) {
    this.scene = scene;
    this.textureCatalog = textureCatalog;
    this.textureResolver = textureResolver;
    this.engineResourceResolver = engineResourceResolver;

    this.meshSystem = new MeshSyncSystem(
      this.scene,
      this.registry,
      this.textureCache,
      this.textureCatalog,
      this.engineResourceResolver
    );
    this.cameraSystem = new CameraSyncSystem(this.scene, this.registry);
    this.lightSystem = new LightSyncSystem(this.scene, this.registry);
    this.lensFlareSystem = new LensFlareSystem(this.scene, this.registry);
    this.debugSystem = new DebugTransformSystem(this.scene);
    this.meshDebugSystem = new DebugMeshSystem(this.scene, this.registry);
    this.colliderDebugSystem = new DebugColliderSystem(this.scene, this.registry);
  }

  addEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);

    for (const comp of entity.getAllComponents()) comp.addObserver(this);

    const listener: ComponentListener = (event: ComponentEvent) => {
      const { entity: e, component, action } = event;
      if (!this.entities.has(e.id)) return;
      if (action === "added") {
        component.addObserver(this);
        // If the entity has no render object yet, process it normally.
        if (!this.registry.has(e.id)) {
          this.processEntity(e);
          return;
        }

        // If the entity already has a render object, we still need to react to
        // component additions that change what should be rendered.
        //
        // Example: adding a FullMeshComponent to an entity that currently has a
        // primitive mesh should recreate the render object immediately (otherwise
        // the editor preview only updates after a full scene rebuild).
        const type = component.type;

        const fullMesh = e.getComponent<any>("fullMesh");
        const shaderMaterial = e.getComponent<any>("shaderMaterial");
        const material =
          e.getComponent<any>("standardMaterial") ??
          e.getComponent<any>("basicMaterial") ??
          e.getComponent<any>("phongMaterial") ??
          e.getComponent<any>("lambertMaterial") ??
          null;
        const geometry =
          e.getComponent<any>("boxGeometry") ??
          e.getComponent<any>("sphereGeometry") ??
          e.getComponent<any>("planeGeometry") ??
          e.getComponent<any>("cylinderGeometry") ??
          e.getComponent<any>("coneGeometry") ??
          e.getComponent<any>("torusGeometry") ??
          e.getComponent<any>("customGeometry") ??
          fullMesh ??
          null;

        const hasEnabledGeometry = !!geometry && geometry.enabled !== false;
        const isFullMesh = !!fullMesh && fullMesh.enabled !== false;
        const hasEnabledMaterial = !!material && material.enabled !== false;
        const hasEnabledShader = !!shaderMaterial && shaderMaterial.enabled !== false;
        const qualifiesAsMesh = hasEnabledGeometry && (isFullMesh || hasEnabledMaterial || hasEnabledShader);

        // Recreate mesh when a geometry-like component is added and the entity now qualifies.
        if (
          qualifiesAsMesh &&
          [
            "boxGeometry",
            "sphereGeometry",
            "planeGeometry",
            "cylinderGeometry",
            "coneGeometry",
            "torusGeometry",
            "customGeometry",
            "shaderMaterial",
            "fullMesh",
          ].includes(type)
        ) {
          this.meshSystem.recreateMesh(e);
          try {
            this.meshDebugSystem.refreshWireframeForEntity(e.id);
          } catch {}
          return;
        }

        // Material additions should update the existing mesh (no full recreate).
        if (["standardMaterial", "basicMaterial", "phongMaterial", "lambertMaterial"].includes(type)) {
          this.meshSystem.syncMaterial(e);
          return;
        }

        if (type === "textureTiling") {
          this.meshSystem.syncTextureTiling(e);
          return;
        }

        // Fallback: let the regular change handler apply any other incremental sync.
        // (Note: fullMesh is intentionally handled above via recreateMesh.)
        try {
          this.onComponentChanged(e.id, type);
        } catch {}
      }

      if (action === "removed") {
        // Removal notifications happen before the component is deleted from the entity.
        // Defer a processing pass so the entity's current component set is stable.
        const defer = (fn: () => void) => {
          try {
            const qm = (globalThis as any).queueMicrotask as undefined | ((cb: () => void) => void);
            if (typeof qm === 'function') return qm(fn);
          } catch {}
          Promise.resolve().then(fn).catch(() => {});
        };

        defer(() => {
          if (!this.entities.has(e.id)) return;
          // If this removal caused the render object to be removed, try to
          // process the entity again to create the appropriate object.
          if (!this.registry.has(e.id)) {
            try {
              this.processEntity(e);
            } catch {}
          } else {
            // Render object still exists; for mesh-related removals, ensure it reflects the new state.
            try {
              this.meshSystem.recreateMesh(e);
              this.meshDebugSystem.refreshWireframeForEntity(e.id);
            } catch {}
          }
        });
      }
    };

    this.componentListeners.set(entity.id, listener);
    entity.addComponentListener(listener);
    entity.transform.onChange(() => this.onTransformChanged(entity.id));

    // Listen to per-entity debug flag changes
    const dbgListener = (enabled: boolean) => this.onEntityDebugFlagChanged(entity, enabled);
    this.debugFlagListeners.set(entity.id, dbgListener);
    try {
      entity.addDebugTransformListener(dbgListener);
    } catch {}

    // Listen to per-entity mesh debug flag changes (optional for backwards compat)
    if (typeof (entity as any).addDebugMeshListener === "function") {
      const dbgMeshListener = (enabled: boolean) => this.onEntityMeshDebugFlagChanged(entity, enabled);
      this.debugMeshFlagListeners.set(entity.id, dbgMeshListener);
      try {
        (entity as any).addDebugMeshListener(dbgMeshListener);
      } catch {}
    }

    // Listen to per-entity collider debug flag changes
    const dbgColListener = (enabled: boolean) => this.onEntityColliderDebugFlagChanged(entity, enabled);
    this.debugColliderFlagListeners.set(entity.id, dbgColListener);
    entity.addDebugColliderListener(dbgColListener);

    this.processEntity(entity);

    // Background (skybox) is scene-level; sync it whenever entities enter.
    this.syncSkybox();
    // If scene master and entity flags are enabled, let each system decide whether
    // to create a helper (they also check forbidden sets internally).
    if (this.sceneDebugMaster && entity.isDebugTransformEnabled()) {
      this.debugSystem.recreateForEntityIfNeeded(entity);
    }
    if (
      this.sceneMeshDebugMaster &&
      typeof (entity as any).isDebugMeshEnabled === "function" &&
      (entity as any).isDebugMeshEnabled()
    ) {
      this.meshDebugSystem.recreateForEntityIfNeeded(entity);
    }

    if (this.sceneColliderDebugMaster && entity.isDebugColliderEnabled?.()) {
      this.colliderDebugSystem.recreateForEntityIfNeeded(entity);
    }
    for (const child of entity.getChildren()) this.addEntity(child);
  }

  removeEntity(entityId: string): void {
    const entity = this.entities.get(entityId);
    if (!entity) return;
    for (const child of entity.getChildren()) this.removeEntity(child.id);

    const l = this.componentListeners.get(entityId);
    if (l) {
      entity.removeComponentListener(l);
      this.componentListeners.delete(entityId);
    }

    // Dispose any mixers/actions before removing the render object
    try {
      this.meshSystem.disposeEntityAnimations(entityId);
    } catch {}
    this.registry.remove(entityId, this.scene);
    // Remove debug helper if present
    this.debugSystem.removeHelper(entityId);
    this.meshDebugSystem.removeHelper(entityId);
    this.colliderDebugSystem.removeHelper(entityId);
    this.entities.delete(entityId);

    const dbg = this.debugFlagListeners.get(entityId);
    if (dbg && entity) {
      try {
        entity.removeDebugTransformListener(dbg);
      } catch {}
    }
    this.debugFlagListeners.delete(entityId);

    const dbgMesh = this.debugMeshFlagListeners.get(entityId);
    if (dbgMesh && entity && typeof (entity as any).removeDebugMeshListener === "function") {
      try {
        (entity as any).removeDebugMeshListener(dbgMesh);
      } catch {}
    }
    this.debugMeshFlagListeners.delete(entityId);

    const dbgCol = this.debugColliderFlagListeners.get(entityId);
    if (dbgCol && entity) {
      entity.removeDebugColliderListener(dbgCol);
    }
    this.debugColliderFlagListeners.delete(entityId);
    // ensure forbidden list cleanup
    try {
      this.debugSystem.removeForbiddenEntity(entityId);
    } catch {}
    try {
      this.meshDebugSystem.removeForbiddenEntity(entityId);
    } catch {}
    this.colliderDebugSystem.removeForbiddenEntity(entityId);

    // If we removed the skybox owner entity, clear/update background.
    this.syncSkybox();
  }

  getCamera(entityId: string): THREE.Camera | undefined {
    return this.cameraSystem.getCamera(entityId);
  }

  getEntities(): Map<string, Entity> {
    return this.entities;
  }

  onComponentChanged(entityId: string, componentType: string): void {
    const entity = this.entities.get(entityId);
    if (!entity) return;

    if (componentType.endsWith(":removed")) {
      const base = componentType.split(":")[0];
      switch (base) {
        case "boxGeometry":
        case "sphereGeometry":
        case "planeGeometry":
        case "cylinderGeometry":
        case "coneGeometry":
        case "torusGeometry":
        case "customGeometry":
        case "shaderMaterial":
        case "standardMaterial":
        case "basicMaterial":
        case "phongMaterial":
        case "lambertMaterial":
        case "ambientLight":
        case "directionalLight":
        case "pointLight":
        case "spotLight":
        case "cameraView":
          this.registry.remove(entityId, this.scene);
          try {
            // ensure mesh debug wireframe is refreshed (removed) when render object is removed
            this.meshDebugSystem.refreshWireframeForEntity(entityId);
          } catch {}
          break;
        case "fullMesh":
          // dispose mixers/actions before removing render object
          try {
            this.meshSystem.disposeEntityAnimations(entityId);
          } catch {}
          this.registry.remove(entityId, this.scene);
          try {
            this.meshDebugSystem.refreshWireframeForEntity(entityId);
          } catch {}
          break;
        case "sphereCollider":
        case "boxCollider":
        case "capsuleCollider":
        case "cylinderCollider":
        case "coneCollider":
        case "terrainCollider":
          try {
            this.colliderDebugSystem.recreateForEntityIfNeeded(entity);
          } catch {}
          break;
        case "lensFlare":
          this.lensFlareSystem.recreateLensFlare(entity);
          break;
        case "skybox":
          this.syncSkybox();
          break;
      }
      return;
    }

    switch (componentType) {
      case "boxGeometry":
      case "sphereGeometry":
      case "planeGeometry":
      case "cylinderGeometry":
      case "coneGeometry":
      case "torusGeometry":
      case "shaderMaterial":
        this.meshSystem.recreateMesh(entity);
        try {
          // mesh/geometry changed: refresh wireframe if a helper exists
          this.meshDebugSystem.refreshWireframeForEntity(entity.id);
        } catch {}
        break;
      case "customGeometry":
        // Avoid recreating the mesh for custom geometry settings changes.
        // Sync shadow flags and reload geometry only when the key changes.
        this.meshSystem.syncCustomGeometry(entity);
        try {
          this.meshDebugSystem.refreshWireframeForEntity(entity.id);
        } catch {}
        break;
      case "fullMesh":
        // Full mesh key/animation may be edited after the component is added.
        // If we somehow don't have a render object yet (or it was removed due to
        // earlier component removals), recreate the placeholder so syncFullMesh
        // can kick off (re)loading.
        try {
          if (!this.registry.has(entity.id)) this.meshSystem.recreateMesh(entity);
        } catch {}

        // Sync full-mesh animation/flags without recreating placeholder.
        this.meshSystem.syncFullMesh(entity);
        try {
          this.meshDebugSystem.refreshWireframeForEntity(entity.id);
        } catch {}
        break;
      case "standardMaterial":
      case "basicMaterial":
      case "phongMaterial":
      case "lambertMaterial":
        this.meshSystem.syncMaterial(entity);
        break;
      case "textureTiling":
        this.meshSystem.syncTextureTiling(entity);
        break;
      case "cameraView":
        this.cameraSystem.syncCamera(entity);
        break;
      case "ambientLight":
      case "directionalLight":
      case "pointLight":
      case "spotLight":
        this.lightSystem.recreateLight(entity);
        break;
      case "lensFlare":
        this.lensFlareSystem.recreateLensFlare(entity);
        break;
      case "sphereCollider":
      case "boxCollider":
      case "capsuleCollider":
      case "cylinderCollider":
      case "coneCollider":
      case "terrainCollider":
        this.colliderDebugSystem.recreateForEntityIfNeeded(entity);
        break;
      case "skybox":
        this.syncSkybox();
        break;
      default:
        break;
    }
  }

  private processEntity(entity: Entity): void {
    const skybox = entity.getComponent<SkyboxComponent>("skybox");
    if (skybox) this.syncSkybox();

    const cameraView = entity.getComponent<CameraViewComponent>("cameraView");
    const lensComp = entity.getComponent<LensFlareComponent>("lensFlare");

    const ambient = entity.getComponent<AmbientLightComponent>("ambientLight");
    const directional =
      entity.getComponent<DirectionalLightComponent>("directionalLight");
    const point = entity.getComponent<PointLightComponent>("pointLight");
    const spot = entity.getComponent<SpotLightComponent>("spotLight");

    const lightComp: AnyLightComponent | undefined =
      (ambient as AnyLightComponent | undefined) ??
      (directional as AnyLightComponent | undefined) ??
      (point as AnyLightComponent | undefined) ??
      (spot as AnyLightComponent | undefined);

    // 1) Mesh
    const hasMesh = this.meshSystem.processMesh(entity);
    if (hasMesh) {
      if (lensComp && lensComp.enabled !== false) {
        this.lensFlareSystem.attachLensFlare(entity, lensComp);
      }
      return;
    }

    // 2) Camera
    if (cameraView && cameraView.enabled !== false) {
      const created = this.cameraSystem.processCamera(entity, cameraView);
      if (created && lensComp && lensComp.enabled !== false) {
        this.lensFlareSystem.attachLensFlare(entity, lensComp);
      }
      return;
    }

    // 3) Light
    if (lightComp && lightComp.enabled !== false) {
      const created = this.lightSystem.processLight(entity, lightComp);
      if (created && lensComp && lensComp.enabled !== false) {
        this.lensFlareSystem.attachLensFlare(entity, lensComp);
      }
      return;
    }

    // 4) Standalone lens flare
    if (lensComp && lensComp.enabled !== false) {
      this.lensFlareSystem.attachLensFlare(entity, lensComp);
    }
  }

  private onTransformChanged(entityId: string): void {
    const entity = this.entities.get(entityId);
    if (!entity) return;

    this.meshSystem.syncTransform(entity);
    this.cameraSystem.syncTransform(entity);
    this.lightSystem.syncTransform(entity);
    // Lens flares attached as children move with their parent.
    // Update debug helper transform if present. DebugTransformSystem will
    // have no helper for forbidden entities (e.g., active camera), so no
    // special-casing is required here.
    try {
      this.debugSystem.updateHelperTransform(entity);
    } catch {}
    try {
      this.meshDebugSystem.updateHelperTransform(entity);
    } catch {}
    this.colliderDebugSystem.updateHelperTransform(entity);
  }

  /**
   * Set scene-level master switch for rendering debug transform helpers.
   * When disabled, no helpers will be visible regardless of entity flags.
   */
  setSceneDebugEnabled(enabled: boolean): void {
    this.sceneDebugMaster = !!enabled;
    this.debugSystem.setMasterEnabled(this.sceneDebugMaster);
    if (this.sceneDebugMaster) {
      // ensure helpers exist (or are removed) according to each entity's
      // debug flag and the forbidden set maintained by DebugTransformSystem.
      for (const ent of this.entities.values()) {
        this.debugSystem.recreateForEntityIfNeeded(ent);
      }
    } else {
      // master disabled: let DebugTransformSystem hide/remove helpers via
      // setMasterEnabled(false). Optionally calling recreateForEntityIfNeeded
      // will also ensure helpers are removed.
      for (const ent of this.entities.values()) this.debugSystem.recreateForEntityIfNeeded(ent);
    }
  }

  /** Independent master switch for mesh (wireframe) debug rendering. */
  setSceneMeshDebugEnabled(enabled: boolean): void {
    this.sceneMeshDebugMaster = !!enabled;
    this.meshDebugSystem.setMasterEnabled(this.sceneMeshDebugMaster);
    for (const ent of this.entities.values()) {
      // Update wireframes according to per-entity mesh debug flags
      this.meshDebugSystem.recreateForEntityIfNeeded(ent);
    }
  }

  /** Independent master switch for collider debug rendering. */
  setSceneColliderDebugEnabled(enabled: boolean): void {
    this.sceneColliderDebugMaster = !!enabled;
    this.colliderDebugSystem.setMasterEnabled(this.sceneColliderDebugMaster);
    for (const ent of this.entities.values()) {
      this.colliderDebugSystem.recreateForEntityIfNeeded(ent);
    }
  }

  private onEntityDebugFlagChanged(entity: Entity, enabled: boolean): void {
    if (!this.sceneDebugMaster) return;
    this.debugSystem.recreateForEntityIfNeeded(entity);
  }

  private onEntityMeshDebugFlagChanged(entity: Entity, enabled: boolean): void {
    if (!this.sceneMeshDebugMaster) return;
    this.meshDebugSystem.recreateForEntityIfNeeded(entity);
  }

  private onEntityColliderDebugFlagChanged(entity: Entity, enabled: boolean): void {
    if (!this.sceneColliderDebugMaster) return;
    this.colliderDebugSystem.recreateForEntityIfNeeded(entity);
  }

  /**
   * Inform the sync system which entity id is the active camera. Active camera
   * must never display a debug helper. Passing `null` clears the active camera.
   */
  public setActiveCameraEntityId(id: string | null): void {
    const prev = this.activeCameraEntityId;
    if (prev === id) return;
    this.activeCameraEntityId = id;
    try {
      if (prev) {
        // previous camera is no longer forbidden
        this.debugSystem.removeForbiddenEntity(prev);
        this.meshDebugSystem.removeForbiddenEntity(prev);
        const pEnt = this.entities.get(prev);
        if (pEnt) {
          this.debugSystem.recreateForEntityIfNeeded(pEnt);
          this.meshDebugSystem.recreateForEntityIfNeeded(pEnt);
        }
      }
    } catch {}
    try {
      if (id) {
        // new active camera: forbid helpers. removal of any existing helper
        // will be handled by addForbiddenEntity.
        this.debugSystem.addForbiddenEntity(id);
        this.meshDebugSystem.addForbiddenEntity(id);
        this.colliderDebugSystem.addForbiddenEntity(id);
      }
    } catch {}
  }

  update(dt: number): void {
    for (const [id, rc] of this.registry.getAll()) {
      const entity = this.entities.get(id);
      if (!entity) continue;
      this.uniformUpdater.update(dt, entity, rc);
    }

    this.lensFlareSystem.update(dt, this.entities);
    // Update mesh animation mixers and synchronize newly-loaded full meshes.
    try {
      this.meshSystem.update(dt);
    } catch {}

    // Mirror mixer state back into the FullMeshComponent so UI/inspector can show progress.
    try {
      for (const [id, rc] of this.registry.getAll()) {
        const entity = this.entities.get(id);
        if (!entity) continue;
        try {
          const action: any = (rc as any).activeAction;
          if (!action) continue;
          const comp: any = entity.getComponent("fullMesh");
          if (!comp) continue;

          // Update component time (seconds) and playing flag, but avoid noisy echo updates.
          comp.animation = comp.animation || {};
          try {
            const prevTime = typeof comp.animation.time === 'number' ? comp.animation.time : NaN;
            const prevPlaying = typeof comp.animation.playing === 'boolean' ? comp.animation.playing : undefined;
            const newTime = typeof action.time === 'number' ? action.time : prevTime;
            const newPlaying = action.paused ? false : true;

            let changed = false;
            // Only update time when it differs by more than a small epsilon to avoid feedback loops
            const timeDelta = Number.isFinite(prevTime) && Number.isFinite(newTime) ? Math.abs(prevTime - newTime) : (Number.isFinite(newTime) ? Infinity : 0);
            if (!Number.isFinite(prevTime) || timeDelta > 0.02) {
              comp.animation.time = newTime;
              changed = true;
            }

            if (prevPlaying === undefined || prevPlaying !== newPlaying) {
              comp.animation.playing = newPlaying;
              changed = true;
            }

            if (changed) {
              try { comp.notifyChanged(); } catch {}
            }
          } catch {}
        } catch {}
      }
    } catch {}

    try {
      for (const [id, rc] of this.registry.getAll()) {
        const entity = this.entities.get(id);
        if (!entity) continue;
        try {
          const loaded = (rc.object3D as any)?.userData?.fullMeshLoaded;
          if (loaded) {
            // Sync animation settings from the component once and clear flag.
            try {
              this.meshSystem.syncFullMesh(entity);
            } catch {}
            try {
              (rc.object3D as any).userData.fullMeshLoaded = false;
            } catch {}
          }
        } catch {}
      }
    } catch {}
  }

  private getDesiredSkyboxResourceKey(): string | null {
    for (const ent of this.entities.values()) {
      const skybox = ent.getComponent<SkyboxComponent>("skybox");
      if (!skybox) continue;
      if (skybox.enabled === false) continue;
      const key = (skybox as any).key as string | undefined;
      if (key && key.trim()) return key.trim();
    }
    return null;
  }

  private syncSkybox(): void {
    const desiredKey = this.getDesiredSkyboxResourceKey();
    if (!desiredKey) {
      if (this.currentSkyboxResourceKey !== null) {
        this.currentSkyboxResourceKey = null;
        this.skyboxLoadToken += 1;
      }
      if (this.scene.background) this.scene.background = null;
      if (this.currentSkyboxTexture) {
        try {
          this.currentSkyboxTexture.dispose();
        } catch {}
        this.currentSkyboxTexture = null;
      }
      return;
    }

    if (this.currentSkyboxResourceKey === desiredKey && this.scene.background === this.currentSkyboxTexture) {
      return;
    }

    this.currentSkyboxResourceKey = desiredKey;
    const token = (this.skyboxLoadToken += 1);
    void this.loadAndApplySkybox(desiredKey, token);
  }

  private async loadAndApplySkybox(resourceKey: string, token: number): Promise<void> {
    if (!this.engineResourceResolver) return;

    let resolved: any;
    try {
      resolved = await this.engineResourceResolver.resolve(resourceKey, "active");
    } catch {
      return;
    }

    if (token !== this.skyboxLoadToken) return;
    if (this.currentSkyboxResourceKey !== resourceKey) return;

    const files = (resolved && resolved.files) || {};

    const faces = ["px", "nx", "py", "ny", "pz", "nz"] as const;
    const hasCubeFaces = faces.every((k) => !!files[k]?.url);

    const nextTexture = await new Promise<THREE.Texture | THREE.CubeTexture | null>((resolve) => {
      try {
        if (hasCubeFaces) {
          const loader = new THREE.CubeTextureLoader();
          try {
            (loader as any).setCrossOrigin?.("anonymous");
          } catch {}
          const urls = faces.map((k) => files[k].url);
          loader.load(
            urls,
            (tex) => resolve(tex),
            undefined,
            () => resolve(null)
          );
          return;
        }

        const file = files.equirect ?? files.equirectangular ?? files.map ?? files.texture;
        const url = (file && file.url) || (Object.values(files)[0] as any)?.url;
        if (!url) return resolve(null);

        const loader = new THREE.TextureLoader();
        try {
          (loader as any).setCrossOrigin?.("anonymous");
        } catch {}
        loader.load(
          url,
          (tex) => {
            try {
              (tex as any).mapping = (THREE as any).EquirectangularReflectionMapping;
              tex.needsUpdate = true;
            } catch {}
            resolve(tex);
          },
          undefined,
          () => resolve(null)
        );
      } catch {
        resolve(null);
      }
    });

    if (!nextTexture) return;
    if (token !== this.skyboxLoadToken) {
      try {
        nextTexture.dispose();
      } catch {}
      return;
    }
    if (this.currentSkyboxResourceKey !== resourceKey) {
      try {
        nextTexture.dispose();
      } catch {}
      return;
    }

    if (this.currentSkyboxTexture && this.currentSkyboxTexture !== nextTexture) {
      try {
        this.currentSkyboxTexture.dispose();
      } catch {}
    }

    this.currentSkyboxTexture = nextTexture;
    this.scene.background = nextTexture;
  }
}

export default RenderSyncSystem;
