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
} from "@duckengine/ecs";
import type { IRenderSyncSystem, ITextureResolver, TextureCatalogService } from "@duckengine/core";
import { RenderObjectRegistry } from "./RenderObjectRegistry";
import { ShaderUniformUpdater } from "./ShaderUniformUpdater";
import { MeshSyncSystem } from "./MeshSyncSystem";
import { CameraSyncSystem } from "./CameraSyncSystem";
import { LightSyncSystem } from "./LightSyncSystem";
import { LensFlareSystem } from "./LensFlareSystem";
import DebugTransformSystem from "../debug/DebugTransformSystem";
import { TextureCache } from "../factories/TextureCache";
import type { AnyLightComponent } from "../factories/LightFactory";

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
  private readonly textureCatalog?: TextureCatalogService;
  private readonly textureResolver?: ITextureResolver;
  private sceneDebugMaster = false;
  private readonly debugFlagListeners = new Map<string, (enabled: boolean) => void>();
  private activeCameraEntityId: string | null = null;

  constructor(
    scene: THREE.Scene,
    textureCatalog?: TextureCatalogService,
    textureResolver?: ITextureResolver
  ) {
    this.scene = scene;
    this.textureCatalog = textureCatalog;
    this.textureResolver = textureResolver;

    this.meshSystem = new MeshSyncSystem(
      this.scene,
      this.registry,
      this.textureCache,
      this.textureCatalog
    );
    this.cameraSystem = new CameraSyncSystem(this.scene, this.registry);
    this.lightSystem = new LightSyncSystem(this.scene, this.registry);
    this.lensFlareSystem = new LensFlareSystem(this.scene, this.registry);
    this.debugSystem = new DebugTransformSystem(this.scene, this.registry);
  }

  addEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);

    for (const comp of entity.getAllComponents()) comp.addObserver(this);

    const listener: ComponentListener = (event: ComponentEvent) => {
      const { entity: e, component, action } = event;
      if (!this.entities.has(e.id)) return;
      if (action === "added") {
        component.addObserver(this);
        if (!this.registry.has(e.id)) this.processEntity(e);
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

    this.processEntity(entity);
    // If scene master and entity flag are enabled, let DebugTransformSystem
    // decide whether to create a helper (it checks forbidden set internally).
    if (this.sceneDebugMaster && entity.isDebugTransformEnabled()) {
      this.debugSystem.recreateForEntityIfNeeded(entity);
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

    this.registry.remove(entityId, this.scene);
    // Remove debug helper if present
    try {
      this.debugSystem.removeHelper(entityId);
    } catch {}
    this.entities.delete(entityId);

    const dbg = this.debugFlagListeners.get(entityId);
    if (dbg && entity) {
      try {
        entity.removeDebugTransformListener(dbg);
      } catch {}
    }
    this.debugFlagListeners.delete(entityId);
    // ensure forbidden list cleanup
    try {
      this.debugSystem.removeForbiddenEntity(entityId);
    } catch {}
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
            // ensure debug wireframe is refreshed (removed) when geometry/material/light/camera is removed
            this.debugSystem.refreshWireframeForEntity(entityId);
          } catch {}
          break;
        case "lensFlare":
          this.lensFlareSystem.recreateLensFlare(entity);
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
      case "customGeometry":
      case "shaderMaterial":
        this.meshSystem.recreateMesh(entity);
        try {
          // mesh/geometry changed: refresh wireframe if a helper exists
          this.debugSystem.refreshWireframeForEntity(entity.id);
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
      default:
        break;
    }
  }

  private processEntity(entity: Entity): void {
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

  private onEntityDebugFlagChanged(entity: Entity, enabled: boolean): void {
    // If master disabled, helpers must remain hidden; do nothing
    if (!this.sceneDebugMaster) return;
    // Let DebugTransformSystem recreate/remove helper according to entity
    // flag and forbidden set.
    this.debugSystem.recreateForEntityIfNeeded(entity);
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
        const pEnt = this.entities.get(prev);
        if (pEnt) this.debugSystem.recreateForEntityIfNeeded(pEnt);
      }
    } catch {}
    try {
      if (id) {
        // new active camera: forbid helpers. removal of any existing helper
        // will be handled by addForbiddenEntity.
        this.debugSystem.addForbiddenEntity(id);
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
    // New: update debug labels orientation (billboard towards active camera)
    try {
      if (this.activeCameraEntityId) {
        const rc = this.registry.get(this.activeCameraEntityId);
        if (rc && rc.object3D instanceof THREE.Camera) {
          this.debugSystem.updateLabels(rc.object3D as THREE.Camera);
        }
      }
    } catch {}
  }
}

export default RenderSyncSystem;
