// @ts-ignore
import * as THREE from "three/webgpu";
import type {
  Entity,
  ComponentEvent,
  ComponentListener,
  IComponentObserver,
  ComponentType,
  IResourceLoader,
} from "@duckengine/core";
import type { IRenderSyncSystem, LoadingTracker } from "@duckengine/core";
import { RenderObjectRegistry } from "./RenderObjectRegistry";
import { ShaderUniformUpdater } from "./ShaderUniformUpdater";
import { TextureCache } from "../factories/TextureCache";

import { FeatureRouter } from "../features/FeatureRouter";
import { RenderContext } from "../features/RenderContext";
import { CameraFeature } from "../features/CameraFeature";
import { LightFeature } from "../features/LightFeature";
import { SkyboxFeature } from "../features/SkyboxFeature";
import { DebugFeature } from "../features/DebugFeature";
import { LensFlareFeature } from "../features/LensFlareFeature";
import { GeometryFeature } from "../features/GeometryFeature";
import { FullMeshFeature } from "../features/FullMeshFeature";
import { MaterialFeature } from "../features/MaterialFeature";
import { ShaderFeature } from "../features/ShaderFeature";
import { AnimationFeature } from "../features/AnimationFeature";

export class RenderSyncSystem implements IRenderSyncSystem, IComponentObserver {
  private readonly scene: THREE.Scene;
  private readonly registry = new RenderObjectRegistry();
  private readonly entities = new Map<string, Entity>();
  private readonly componentListeners = new Map<string, ComponentListener>();
  private readonly textureCache = new TextureCache();
  private readonly uniformUpdater = new ShaderUniformUpdater();

  private readonly router: FeatureRouter;
  private readonly context: RenderContext;

  private readonly debugFeature: DebugFeature;

  private debugFlags: Record<string, boolean> = { transform: false, mesh: false, collider: false, camera: false };
  private activeCameraEntityId: string | null = null;

  constructor(
    scene: THREE.Scene,
    engineResourceResolver?: IResourceLoader,
    loadingTracker?: LoadingTracker
  ) {
    this.scene = scene;

    this.context = {
      scene,
      registry: this.registry,
      textureCache: this.textureCache,
      engineResourceResolver,
      entities: this.entities,
      debugFlags: this.debugFlags,
      activeCameraEntityId: this.activeCameraEntityId,
      loadingTracker: loadingTracker,
      isInitialLoading: false
    };

    this.router = new FeatureRouter(this.context);
    this.textureCache.setLoadingTracker(this.context.loadingTracker);

    this.debugFeature = new DebugFeature(scene, this.registry);

    // Register features
    this.router.addFeature(new CameraFeature());
    this.router.addFeature(new LightFeature());
    this.router.addFeature(new GeometryFeature());
    this.router.addFeature(new FullMeshFeature());
    this.router.addFeature(new MaterialFeature());
    this.router.addFeature(new ShaderFeature());
    this.router.addFeature(new AnimationFeature());
    this.router.addFeature(new SkyboxFeature());
    this.router.addFeature(this.debugFeature);
    this.router.addFeature(new LensFlareFeature());
  }

  addEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);
    this.router.onEntityAdded(entity);

    for (const comp of entity.getAllComponents()) comp.addObserver(this);

    const listener: ComponentListener = (event: ComponentEvent) => {
      const { entity: e, component, action } = event;
      if (!this.entities.has(e.id)) return;

      if (action === "added") {
        component.addObserver(this);
        this.router.onComponentChanged(e, component.type);
      } else if (action === "removed") {
        // DO NOT call component.removeObserver(this) here!
        // Entity.safeRemoveComponent calls listener FIRST, then comp.notifyRemoved().
        // If we remove observer here, comp.notifyRemoved() will have nothing to notify, 
        // and this.onComponentRemoved won't be triggered, breaking feature sync.
      }
    };

    this.componentListeners.set(entity.id, listener);
    entity.addComponentListener(listener);

    entity.transform.onChange(() => {
      this.router.onTransformChanged(entity);
    });

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

    // Ensure that any legacy component (like LensFlare) or non-feature component 
    // is properly removed from the registry/scene.
    this.router.onEntityRemoved(entity);
    this.registry.remove(entityId, this.scene);

    // Stop observing all components of this entity
    for (const comp of entity.getAllComponents()) {
      comp.removeObserver(this);
    }

    this.entities.delete(entityId);
  }

  getCamera(entityId: string): THREE.Camera | undefined {
    const rc = this.registry.get(entityId);
    return rc?.object3D instanceof THREE.Camera ? (rc.object3D as THREE.Camera) : undefined;
  }

  getEntities(): Map<string, Entity> {
    return this.entities;
  }

  onComponentChanged(entityId: string, componentType: ComponentType): void {
    const entity = this.entities.get(entityId);
    if (entity) {
      this.router.onComponentChanged(entity, componentType);
    }
  }

  onComponentRemoved(entityId: string, componentType: ComponentType): void {
    const entity = this.entities.get(entityId);
    if (!entity) return;

    // Defer the removal notification to the next microtask/tick.
    // This allows Entity.components to be updated (deleted) before FeatureRouter checks eligibility.
    // Without this defer, FeatureRouter.checkEligibility would still see the component as present
    // because Entity.notifyComponentEvent/notifyRemoved happens before the Map delete.
    const defer = (fn: () => void) => {
      Promise.resolve().then(fn).catch(() => { });
    };

    defer(() => {
      // Re-check existence in case entity was destroyed in the meantime
      if (!this.entities.has(entityId)) return;
      this.router.onComponentRemoved(entity, componentType);
    });
  }

  update(dt: number): void {
    // Uniforms
    for (const [id, rc] of this.registry.getAll()) {
      const entity = this.entities.get(id);
      if (!entity) continue;
      this.uniformUpdater.update(dt, entity, rc);
    }

    // Features
    this.router.onFrame(dt);
  }

  setSceneDebugEnabled(kind: string, enabled: boolean): void {
    this.debugFlags[kind] = !!enabled;
    this.debugFeature.setSceneDebugEnabled(kind, !!enabled, this.context);
  }

  setActiveCameraEntityId(id: string | null): void {
    const prev = this.activeCameraEntityId;
    this.activeCameraEntityId = id;
    this.context.activeCameraEntityId = id; // Update context
    this.debugFeature.setActiveCameraEntityId(id, prev, this.context);
  }

  setIsInitialLoading(loading: boolean): void {
    this.context.isInitialLoading = loading;
    this.textureCache.setIsInitialLoading(loading);
  }
}
