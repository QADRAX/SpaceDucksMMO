import * as THREE from "three";
import type {
  Entity,
  ComponentEvent,
  ComponentListener,
} from "../../../domain/ecs/core/Entity";
import type IComponentObserver from "../../../domain/ecs/core/IComponentObserver";
import { LensFlareComponent } from "../../../domain/ecs/components/LensFlareComponent";
import { CameraViewComponent } from "../../../domain/ecs/components/CameraViewComponent";
import AmbientLightComponent from "../../../domain/ecs/components/light/AmbientLightComponent";
import DirectionalLightComponent from "../../../domain/ecs/components/light/DirectionalLightComponent";
import PointLightComponent from "../../../domain/ecs/components/light/PointLightComponent";
import SpotLightComponent from "../../../domain/ecs/components/light/SpotLightComponent";
import { RenderObjectRegistry } from "./RenderObjectRegistry";
import { ShaderUniformUpdater } from "./ShaderUniformUpdater";
import { MeshSyncSystem } from "./MeshSyncSystem";
import { CameraSyncSystem } from "./CameraSyncSystem";
import { LightSyncSystem } from "./LightSyncSystem";
import { LensFlareSystem } from "./LensFlareSystem";
import { TextureCache } from "../factories/TextureCache";
import type { TextureCatalogService } from "@client/application/TextureCatalog";
import type TextureResolverService from "@client/application/TextureResolverService";
import type { AnyLightComponent } from "../factories/LightFactory";

export class RenderSyncSystem implements IComponentObserver {
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
  private readonly textureCatalog?: TextureCatalogService;
  private readonly textureResolver?: TextureResolverService;

  constructor(
    scene: THREE.Scene,
    textureCatalog?: TextureCatalogService,
    textureResolver?: TextureResolverService
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

    this.processEntity(entity);
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
    this.entities.delete(entityId);
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
  }

  update(dt: number): void {
    for (const [id, rc] of this.registry.getAll()) {
      const entity = this.entities.get(id);
      if (!entity) continue;
      this.uniformUpdater.update(dt, entity, rc);
    }

    this.lensFlareSystem.update(dt, this.entities);
  }
}

export default RenderSyncSystem;
