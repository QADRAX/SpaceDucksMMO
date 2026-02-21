import type IScene from '../../domain/ports/IScene';
import type IRenderingEngine from '../../domain/ports/IRenderingEngine';
import type { TextureCatalogService } from '../../domain/assets/TextureCatalog';
import TextureResolverService from '../../application/TextureResolverService';
import { setCurrentEcsWorld, setPhysicsServices, Result, ok, err } from '@duckengine/ecs';
import type { Entity, ComponentType } from '@duckengine/ecs';
import type SceneChangeEvent from '../../domain/scene/SceneChangeEvent';
import IRenderSyncSystem from '../../domain/ports/IRenderSyncSystem';
import ISettingsService from '../../domain/ports/ISettingsService';
import type { IPhysicsSystem } from '../../domain/physics/IPhysicsSystem';
import CollisionEventsHub from '../../domain/physics/CollisionEventsHub';
import { SceneValidator } from './SceneValidator';
import { SceneObserverManager } from './SceneObserverManager';

type VoidResult = Result<void>;

/**
 * Base implementation of IScene. 
 * Manages ECS entities, physics initialization, and render synchronization.
 */
export abstract class BaseScene implements IScene {
  abstract readonly id: string;

  protected entities = new Map<string, Entity>();
  protected activeCameraId: string | null = null;
  protected engine?: IRenderingEngine;
  /** Injected by engine during setup. Concrete types (e.g. THREE.Scene) are handled in infrastructure. */
  protected renderScene?: any;

  // ECS Systems
  protected renderSyncSystem?: IRenderSyncSystem;
  protected physicsSystem?: IPhysicsSystem;

  public readonly collisionEvents = new CollisionEventsHub();
  public debugFlags: Record<string, boolean> = {
    transform: false,
    mesh: false,
    collider: false,
    camera: false,
  };

  private settingsUnsubscribe?: () => void;
  private textureResolver?: TextureResolverService;

  private validator: SceneValidator;
  private observerManager: SceneObserverManager;
  private changeListeners = new Set<(ev: SceneChangeEvent) => void>();

  constructor(protected settingsService: ISettingsService) {
    this.validator = new SceneValidator(this.entities);
    this.observerManager = new SceneObserverManager(this.validator, (ev) => this.emitChange(ev));
  }

  // ─── EcsWorldContext Implementation ────────────────────────────────────────

  getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  getAllEntities(): Iterable<Entity> {
    return this.entities.values();
  }

  // ─── Entity Management ─────────────────────────────────────────────────────

  /**
   * Adds an entity to the scene, performing hierarchy and uniqueness validations.
   */
  addEntity(entity: Entity): void {
    if (this.entities.has(entity.id)) {
      console.warn(`[${this.id}] addEntity: entity '${entity.id}' already added`);
      return;
    }

    const hierarchyErrors = this.validator.validateHierarchyRequirementsInSubtree(entity);
    const uniqueErrors = this.validator.validateUniqueInSceneInSubtree(entity, this.entities);
    const errors = [...hierarchyErrors, ...uniqueErrors];

    if (errors.length) {
      throw new Error(`Cannot add entity '${entity.id}' to scene '${this.id}':\n${errors.map(e => `  - ${e}`).join("\n")}`);
    }

    this.entities.set(entity.id, entity);
    this.renderSyncSystem?.addEntity(entity);
    this.physicsSystem?.addEntity(entity);

    this.observerManager.attachEntityObservers(entity, this.entities);
    this.emitChange({ kind: "entity-added", entity });
  }

  /**
   * Removes an entity from the scene and cleans up its observers.
   */
  removeEntity(id: string): void {
    const ent = this.entities.get(id);
    if (!ent) {
      console.warn(`[${this.id}] removeEntity: entity '${id}' not found`);
      return;
    }

    this.renderSyncSystem?.removeEntity(id);
    this.physicsSystem?.removeEntity(id);

    if (this.activeCameraId === id) {
      this.clearActiveCamera();
    }

    this.observerManager.detachEntityObservers(id);
    this.entities.delete(id);
    this.emitChange({ kind: "entity-removed", entityId: id });
  }

  /**
   * Reparents an entity, validating that no cycles or hierarchy violations are created.
   */
  reparentEntity(childId: string, newParentId: string | null): void {
    const res = this.reparentEntityResult(childId, newParentId);
    if (!res.ok) {
      this.emitChange({ kind: "error", message: res.error.message });
    }
  }

  reparentEntityResult(childId: string, newParentId: string | null): VoidResult {
    const child = this.entities.get(childId);
    if (!child) return err("invalid-reparent", `Child '${childId}' not found`, { childId, newParentId });

    if (child.parent?.id === newParentId) return ok(undefined);

    let newParent: Entity | undefined;
    if (newParentId) {
      newParent = this.entities.get(newParentId);
      if (!newParent) return err("invalid-reparent", `Parent '${newParentId}' not found`, { childId, newParentId });
      if (this.validator.wouldCreateCycle(child, newParent)) {
        return err("invalid-reparent", `Cycle detected: '${newParentId}' is a descendant of '${childId}'`, { childId, newParentId });
      }
    }

    const oldParent = child.parent;
    oldParent?.removeChild(childId);
    newParent?.addChild(child);

    const hierarchyErrors = this.validator.validateHierarchyRequirementsInSubtree(child);
    if (hierarchyErrors.length) {
      // Revert if invalid
      newParent?.removeChild(childId);
      oldParent?.addChild(child);

      return err("invalid-reparent", `Hierarchy violation moved subtree: ${hierarchyErrors[0]}`, { childId, newParentId, errors: hierarchyErrors });
    }

    this.emitChange({ kind: "hierarchy-changed", childId, newParentId });
    return ok(undefined);
  }

  // ─── Debug API ─────────────────────────────────────────────────────────────

  public setDebugEnabled(kind: string, enabled: boolean): void {
    if (this.debugFlags[kind] === enabled) return;
    this.debugFlags[kind] = enabled;
    this.renderSyncSystem?.setSceneDebugEnabled(kind, enabled);
    this.emitChange({ kind: 'scene-debug-changed', kindName: kind, enabled } as any);
  }


  // ─── Camera Management ─────────────────────────────────────────────────────

  setActiveCamera(id: string): void {
    const ent = this.entities.get(id);
    if (!ent || !this.renderSyncSystem) {
      console.warn(`[${this.id}] setActiveCamera: entity '${id}' not found or sync system missing`);
      return;
    }

    const camera = this.renderSyncSystem.getCamera?.(id);
    if (this.renderSyncSystem.getCamera && !camera) {
      console.warn(`[${this.id}] setActiveCamera: entity '${id}' has no CameraViewComponent`);
      return;
    }

    this.activeCameraId = id;
    this.renderSyncSystem.setActiveCameraEntityId(this.activeCameraId);
    this.engine?.onActiveCameraChanged();

    this.emitChange({ kind: "active-camera-changed", entityId: this.activeCameraId });
  }

  getActiveCamera(): Entity | null {
    return this.activeCameraId ? this.entities.get(this.activeCameraId) || null : null;
  }

  private clearActiveCamera(): void {
    this.activeCameraId = null;
    this.renderSyncSystem?.setActiveCameraEntityId(null);
    this.engine?.onActiveCameraChanged();
  }

  // ─── Lifecycle (Setup/Teardown) ──────────────────────────────────────────

  setup(engine: IRenderingEngine, renderScene: any): void {
    this.engine = engine;
    this.renderScene = renderScene;
    setCurrentEcsWorld(this);

    this.initializePhysics();
    this.initializeTextureResolver();
    this.initializeRenderSync(renderScene);

    // Add all pre-existing entities to systems
    for (const ent of this.entities.values()) {
      this.renderSyncSystem?.addEntity(ent);
      this.physicsSystem?.addEntity(ent);
    }
  }

  private initializePhysics(): void {
    try {
      this.physicsSystem = this.engine?.createPhysicsSystem?.();
      const sys = this.physicsSystem;

      if (sys) {
        setPhysicsServices({
          applyImpulse: (id, imp) => sys.applyImpulse?.(id, imp),
          applyForce: (id, force) => sys.applyForce?.(id, force),
          getLinearVelocity: (id) => sys.getLinearVelocity?.(id) ?? null,
          raycast: (ray) => sys.raycast?.(ray) ?? null,
        });
        this.collisionEvents.attach(sys);
      }
    } catch (err) {
      console.error(`[${this.id}] Failed to initialize physics`, err);
    }
  }

  private initializeTextureResolver(): void {
    const catalog = this.engine?.getTextureCatalog?.();
    if (!catalog) return;

    this.textureResolver = new TextureResolverService(catalog, {
      defaultQuality: this.settingsService.getSettings().graphics.textureQuality,
    });

    this.settingsUnsubscribe = this.settingsService.subscribe((s) => {
      this.textureResolver?.setDefaultQuality(s.graphics.textureQuality);
    });
  }

  private initializeRenderSync(renderScene: any): void {
    this.renderSyncSystem = this.engine?.createRenderSyncSystem?.(
      renderScene,
      this.engine.getTextureCatalog?.(),
      this.textureResolver
    );

    if (this.renderSyncSystem) {
      for (const [kind, enabled] of Object.entries(this.debugFlags)) {
        this.renderSyncSystem.setSceneDebugEnabled(kind, enabled);
      }
    }
  }

  teardown(engine: IRenderingEngine, renderScene: any): void {
    this.cleanupPhysics();
    this.cleanupSettings();
    this.cleanupEntities();

    this.renderSyncSystem = undefined;
    this.engine?.onActiveCameraChanged();
    this.renderScene = undefined;
  }

  private cleanupPhysics(): void {
    setPhysicsServices(null);
    this.collisionEvents.detach();
    if (this.physicsSystem) {
      try {
        this.physicsSystem.dispose();
      } catch (err) {
        console.error(`[${this.id}] Error disposing physics system`, err);
      }
      this.physicsSystem = undefined;
    }
  }

  private cleanupSettings(): void {
    this.settingsUnsubscribe?.();
    this.settingsUnsubscribe = undefined;
    this.textureResolver?.dispose();
    this.textureResolver = undefined;
  }

  private cleanupEntities(): void {
    for (const ent of this.entities.values()) {
      this.renderSyncSystem?.removeEntity(ent.id);
    }
    this.observerManager.clear();
    this.entities.clear();
    this.activeCameraId = null;
    this.emitChange({ kind: "active-camera-changed", entityId: null });
  }

  // ─── Helpers & Events ──────────────────────────────────────────────────────

  update(dt: number): void {
    for (const ent of this.entities.values()) ent.update(dt);
    this.physicsSystem?.update(dt);
    this.renderSyncSystem?.update(dt);
  }

  getEntities(): ReadonlyArray<Entity> {
    return Array.from(this.entities.values());
  }

  getActiveCameraEntityId(): string | null {
    return this.activeCameraId;
  }

  subscribeChanges(listener: (ev: SceneChangeEvent) => void): () => void {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  private emitChange(ev: SceneChangeEvent): void {
    for (const l of this.changeListeners) {
      try {
        l(ev);
      } catch (err) {
        console.warn(`[${this.id}] Error in change listener`, err);
      }
    }
  }
}

export default BaseScene;
