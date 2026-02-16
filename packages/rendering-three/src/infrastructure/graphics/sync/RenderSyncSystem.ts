import * as THREE from "three";
import type {
  Entity,
  ComponentEvent,
  ComponentListener,
  IComponentObserver,
} from "@duckengine/ecs";
import type { IRenderSyncSystem, ITextureResolver, TextureCatalogService } from "@duckengine/core";
import { RenderObjectRegistry } from "./RenderObjectRegistry";
import { ShaderUniformUpdater } from "./ShaderUniformUpdater";
import { TextureCache } from "../factories/TextureCache";
import type { EngineResourceResolver } from "../../resources/EngineResourceResolver";

import { FeatureRouter } from "../features/FeatureRouter";
import { RenderContext } from "../features/RenderContext";
import { CameraFeature } from "../features/CameraFeature";
import { LightFeature } from "../features/LightFeature";
import { MeshFeature } from "../features/MeshFeature";
import { SkyboxFeature } from "../features/SkyboxFeature";
import { DebugFeature } from "../features/DebugFeature";
import { LensFlareFeature } from "../features/LensFlareFeature";

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

  private debugFlags = { transform: false, mesh: false, collider: false };
  private activeCameraEntityId: string | null = null;

  // Note: textureResolver is in interface but maybe not used in new design?
  // We pass it to context.

  constructor(
    scene: THREE.Scene,
    textureCatalog?: TextureCatalogService,
    textureResolver?: ITextureResolver,
    engineResourceResolver?: EngineResourceResolver
  ) {
    this.scene = scene;

    this.context = {
      scene,
      registry: this.registry,
      textureCache: this.textureCache,
      textureCatalog,
      textureResolver,
      engineResourceResolver,
      entities: this.entities,
      debugFlags: this.debugFlags
    };

    this.router = new FeatureRouter(this.context);

    this.debugFeature = new DebugFeature(scene, this.registry);

    // Register features
    this.router.addFeature(new CameraFeature());
    this.router.addFeature(new LightFeature());
    this.router.addFeature(new MeshFeature());
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
        const defer = (fn: () => void) => {
          try {
            const qm = (globalThis as any).queueMicrotask as undefined | ((cb: () => void) => void);
            if (typeof qm === 'function') return qm(fn);
          } catch { }
          Promise.resolve().then(fn).catch(() => { });
        };

        defer(() => {
          if (!this.entities.has(e.id)) return;
          this.router.onComponentChanged(e, component.type + ":removed");
          // Also re-eval eligibility
          this.router.onComponentChanged(e, component.type);
        });
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
    this.entities.delete(entityId);
  }

  getCamera(entityId: string): THREE.Camera | undefined {
    const rc = this.registry.get(entityId);
    return rc?.object3D instanceof THREE.Camera ? (rc.object3D as THREE.Camera) : undefined;
  }

  getEntities(): Map<string, Entity> {
    return this.entities;
  }

  onComponentChanged(entityId: string, componentType: string): void {
    const entity = this.entities.get(entityId);
    if (entity) {
      this.router.onComponentChanged(entity, componentType);
    }
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

  setSceneDebugEnabled(enabled: boolean): void {
    this.debugFlags.transform = !!enabled;
    this.debugFeature.setSceneDebugEnabled(!!enabled, this.context);
  }

  setSceneMeshDebugEnabled(enabled: boolean): void {
    this.debugFlags.mesh = !!enabled;
    this.debugFeature.setSceneMeshDebugEnabled(!!enabled, this.context);
  }

  setSceneColliderDebugEnabled(enabled: boolean): void {
    this.debugFlags.collider = !!enabled;
    this.debugFeature.setSceneColliderDebugEnabled(!!enabled, this.context);
  }

  setActiveCameraEntityId(id: string | null): void {
    const prev = this.activeCameraEntityId;
    this.activeCameraEntityId = id;
    this.debugFeature.setActiveCameraEntityId(id, prev, this.context);
  }
}
