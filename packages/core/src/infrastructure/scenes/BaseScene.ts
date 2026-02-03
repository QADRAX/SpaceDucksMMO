import type IScene from '../../domain/ports/IScene';
import type IRenderingEngine from '../../domain/ports/IRenderingEngine';
import type { TextureCatalogService } from '../../domain/assets/TextureCatalog';
import TextureResolverService from '../../application/TextureResolverService';
import { setCurrentEcsWorld, setPhysicsServices, Result, ok, err } from '@duckengine/ecs';
import type { Entity, IComponentObserver } from '@duckengine/ecs';
import type { Component } from '@duckengine/ecs';
import type SceneChangeEvent from '../../domain/scene/SceneChangeEvent';
import IRenderSyncSystem from '../../domain/ports/IRenderSyncSystem';
import ISettingsService from '../../domain/ports/ISettingsService';
import type { IPhysicsSystem } from '../../domain/physics/IPhysicsSystem';
import CollisionEventsHub from '../../domain/physics/CollisionEventsHub';

type VoidResult = Result<void>;

export abstract class BaseScene implements IScene {
  abstract readonly id: string;

  protected entities: Map<string, Entity> = new Map();
  private _changeListeners: Set<(ev: SceneChangeEvent) => void> = new Set();
  private entitySubscriptions: Map<string, () => void> = new Map();
  protected activeCameraId: string | null = null;
  protected engine?: IRenderingEngine;
  protected renderScene?: any; // THREE.Scene injected by engine

  // ECS Systems
  protected renderSyncSystem?: IRenderSyncSystem;
  protected physicsSystem?: IPhysicsSystem;

  /** Collision events convenience hub; auto-attaches to physics system when present. */
  public readonly collisionEvents: CollisionEventsHub = new CollisionEventsHub();
  /**
   * Scene-level master switch for debug transform helpers.
   * When false (default), no debug helpers are rendered even if
   * individual entities have their debug flag enabled. When true,
   * helpers are rendered only for entities whose `isDebugTransformEnabled()`
   * returns true.
   *
   * Public so the scene inspector can read/write the value generically.
   */
  public debugTransformsEnabled: boolean = false;

  /** Scene-level master switch for collider debug helpers. Independent from transform debug. */
  public debugCollidersEnabled: boolean = false;

  // Settings service kept for future use (e.g., quality affecting ECS components)
  // Used to drive texture resolver quality.
  private settingsUnsubscribe?: () => void;
  private textureResolver?: TextureResolverService;

  constructor(protected settingsService: ISettingsService) {
    // No-op: legacy texture reload path removed in ECS-only mode
  }

  // EcsWorldContext implementation
  getEntity(id: string) {
    return this.entities.get(id);
  }

  getAllEntities(): Iterable<Entity> {
    return this.entities.values();
  }

  /**
   * Add an ECS Entity directly, without any adapter.
   */
  addEntity(entity: Entity): void {
    if (this.entities.has(entity.id)) {
      console.warn(
        `[${this.id}] addEntity: entity '${entity.id}' already added`
      );
      return;
    }

    const hierarchyErrors = this.validateHierarchyRequirementsInSubtree(entity);
    if (hierarchyErrors.length) {
      throw new Error(
        `Cannot add entity '${entity.id}' to scene '${this.id}':\n` +
          hierarchyErrors.map((e) => `  - ${e}`).join("\n")
      );
    }

    this.entities.set(entity.id, entity);
    if (this.renderSyncSystem) {
      this.renderSyncSystem.addEntity(entity);
    }
    if (this.physicsSystem) {
      this.physicsSystem.addEntity(entity);
    }
    // subscribe to entity-level events for inspector/debug
    this.attachEntityObservers(entity);
    this.emitChange({ kind: "entity-added", entity });
  }

  /**
   * Enable or disable debug transform helpers for all entities in this scene.
   * Design: scene-level flag is a master switch. If set to false, no debug
   * helpers are visible even if entities have their personal flag enabled.
   * If set to true, helpers will be created/shown for entities that have
   * `entity.isDebugTransformEnabled() === true`.
   */
  public setDebugTransformsEnabled(enabled: boolean): void {
    if (this.debugTransformsEnabled === enabled) return;
    this.debugTransformsEnabled = enabled;
    // Notify render/debug systems so helpers are created/removed accordingly.
    if (this.renderSyncSystem) {
      this.renderSyncSystem.setSceneDebugEnabled(enabled);
    }
    // Notify subscribers (inspector/UI) about the change so they can react.
    try {
      this.emitChange({ kind: 'scene-debug-changed', enabled: !!enabled });
    } catch {}
  }

  /**
   * Enable or disable collider debug helpers for all entities in this scene.
   * Master switch: requires per-entity `entity.isDebugColliderEnabled() === true`.
   */
  public setDebugCollidersEnabled(enabled: boolean): void {
    if (this.debugCollidersEnabled === enabled) return;
    this.debugCollidersEnabled = enabled;
    if (this.renderSyncSystem) {
      try {
        this.renderSyncSystem.setSceneColliderDebugEnabled?.(enabled);
      } catch {}
    }
    try {
      this.emitChange({ kind: 'scene-collider-debug-changed', enabled: !!enabled });
    } catch {}
  }

  /** Remove an ECS Entity by ID */
  removeEntity(id: string): void {
    const ent = this.entities.get(id);
    if (!ent) {
      console.warn(`[${this.id}] removeEntity: entity '${id}' not found`);
      return;
    }
    if (this.renderSyncSystem) {
      this.renderSyncSystem.removeEntity(id);
    }
    if (this.physicsSystem) {
      try {
        this.physicsSystem.removeEntity(id);
      } catch {}
    }
    if (this.activeCameraId === id) {
      this.activeCameraId = null;
      // inform render sync system that there is no active camera now
      if (this.renderSyncSystem) this.renderSyncSystem.setActiveCameraEntityId(null);
      if (this.engine) {
        try {
          this.engine.onActiveCameraChanged();
        } catch {}
      }
    }
    this.detachEntityObservers(id);
    this.entities.delete(id);
    this.emitChange({ kind: "entity-removed", entityId: id });
  }

  /**
   * IScene API: Set which object is the active camera.
   * The object must implement ISceneCamera and must have been added via addObject() first.
   */
  setActiveCamera(id: string): void {
    const ent = this.entities.get(id);
    if (!ent || !this.renderSyncSystem) {
      console.warn(`[${this.id}] setActiveCamera: entity '${id}' not found`);
      return;
    }
    const camera = this.renderSyncSystem.getCamera?.(id);
    if (this.renderSyncSystem.getCamera && !camera) {
      console.warn(
        `[${this.id}] setActiveCamera: entity '${id}' has no CameraViewComponent`
      );
      return;
    }
    this.activeCameraId = id;

    // inform render sync system about new active camera so it can hide helpers
    if (this.renderSyncSystem) this.renderSyncSystem.setActiveCameraEntityId(this.activeCameraId);

    if (this.engine) {
      try {
        this.engine.onActiveCameraChanged();
      } catch (e) {
        // ignore notify errors
      }
    }
    // Notify subscribers that active camera changed
    this.emitChange({
      kind: "active-camera-changed",
      entityId: this.activeCameraId,
    });
  }

  /**
   * IScene API: Return the active THREE.Camera or null.
   */
  getActiveCamera(): Entity | null {
    if (!this.activeCameraId) return null;
    return this.entities.get(this.activeCameraId) || null;
  }

  /**
   * Setup the scene. Call super.setup(engine, renderScene) in derived classes.
   */
  setup(engine: IRenderingEngine, renderScene: any): void {
    this.engine = engine;
    this.renderScene = renderScene;

    // Set current ECS world context
    setCurrentEcsWorld(this);

    // Optional physics system creation (provided by app/backend)
    try {
      this.physicsSystem = this.engine?.createPhysicsSystem?.();
    } catch {
      this.physicsSystem = undefined;
    }

    // Provide physics services globally so ECS components can apply forces/impulses.
    // This is scene-scoped; teardown clears it.
    try {
      const sys = this.physicsSystem;
      setPhysicsServices({
        applyImpulse: (entityId, impulse) => {
          try {
            sys?.applyImpulse?.(entityId, impulse);
          } catch {}
        },
        applyForce: (entityId, force) => {
          try {
            sys?.applyForce?.(entityId, force);
          } catch {}
        },
        getLinearVelocity: (entityId) => {
          try {
            return sys?.getLinearVelocity?.(entityId) ?? null;
          } catch {
            return null;
          }
        },
        raycast: (ray) => {
          try {
            return sys?.raycast?.(ray) ?? null;
          } catch {
            return null;
          }
        },
      });
    } catch {}

    // Auto-wire collision event hub (no-op if physics backend doesn't support collisions).
    try {
      this.collisionEvents.attach(this.physicsSystem);
    } catch {}

    // Initialize ECS systems
    // Obtain catalog from the engine (optional). If present, core constructs
    // the texture resolver implementation.
    const catalog: TextureCatalogService | undefined = this.engine?.getTextureCatalog?.();

    // Reset any previous subscriptions/resolvers (defensive for reuse).
    if (this.settingsUnsubscribe) {
      try {
        this.settingsUnsubscribe();
      } catch {}
      this.settingsUnsubscribe = undefined;
    }
    if (this.textureResolver) {
      try {
        this.textureResolver.dispose();
      } catch {}
      this.textureResolver = undefined;
    }

    if (catalog) {
      const initialQuality = this.settingsService.getSettings().graphics.textureQuality;
      this.textureResolver = new TextureResolverService(catalog, {
        defaultQuality: initialQuality,
      });

      // Keep resolver quality in sync with settings.
      try {
        this.settingsUnsubscribe = this.settingsService.subscribe((settings) => {
          try {
            this.textureResolver?.setDefaultQuality(settings.graphics.textureQuality);
          } catch {}
        });
      } catch {
        // ignore if settings service cannot subscribe
      }
    }

    // Note: extra args are intentionally passed for backends that accept them.
    this.renderSyncSystem = this.engine?.createRenderSyncSystem?.(
      renderScene,
      catalog,
      this.textureResolver
    );

    // Ensure render sync is aware of current scene-level debug master flag
    if (this.renderSyncSystem) {
      try {
        this.renderSyncSystem.setSceneDebugEnabled(this.debugTransformsEnabled);
      } catch {}

      try {
        this.renderSyncSystem.setSceneColliderDebugEnabled?.(this.debugCollidersEnabled);
      } catch {}

      // Add all entities that were already added
      for (const ent of this.entities.values()) {
        this.renderSyncSystem.addEntity(ent);
      }
    }

    // Add all entities to physics system as well (if present)
    if (this.physicsSystem) {
      for (const ent of this.entities.values()) {
        try {
          this.physicsSystem.addEntity(ent);
        } catch {}
      }
    }
  }

  /**
   * Update all objects.
   * Most scenes don't need to override this.
   */
  update(dt: number): void {
    // Update ECS entities
    for (const ent of this.entities.values()) {
      ent.update(dt);
    }

    // Physics step (singleplayer): after ECS component updates so gameplay can
    // apply forces/impulses before stepping.
    if (this.physicsSystem) {
      try {
        this.physicsSystem.update(dt);
      } catch {}
    }
    if (this.renderSyncSystem) {
      this.renderSyncSystem.update(dt);
    }
  }

  // --- Scene debug/inspector helpers -------------------------------------
  public getEntities(): ReadonlyArray<Entity> {
    return Array.from(this.entities.values());
  }

  public getActiveCameraEntityId(): string | null {
    return this.activeCameraId;
  }

  public subscribeChanges(
    listener: (ev: SceneChangeEvent) => void
  ): () => void {
    this._changeListeners.add(listener);
    return () => this._changeListeners.delete(listener);
  }

  public reparentEntity(childId: string, newParentId: string | null): void {
    const res = this.reparentEntityResult(childId, newParentId);
    if (!res.ok) {
      // emit error for backward-compatible behavior and for debug/inspector
      this.emitChange({ kind: "error", message: res.error.message });
    }
  }

  /**
   * Result-based reparent operation. Returns structured error on failure.
   */
  public reparentEntityResult(
    childId: string,
    newParentId: string | null
  ): VoidResult {
    const child = this.entities.get(childId);
    if (!child)
      return err("invalid-reparent", `Child '${childId}' not found`, {
        childId,
        newParentId,
      });
    const oldParent = child.parent;

    // no-op when parent unchanged
    if (oldParent && oldParent.id === newParentId) return ok(undefined);

    // Validate new parent (if any) BEFORE mutating hierarchy
    let newParent: Entity | undefined;
    if (newParentId) {
      newParent = this.entities.get(newParentId);
      if (!newParent)
        return err("invalid-reparent", `Parent '${newParentId}' not found`, {
          childId,
          newParentId,
        });

      // Prevent cycles: if the new parent is a descendant of the child, attaching would create a cycle
      if (this.wouldCreateCycle(child, newParent)) {
        return err(
          "invalid-reparent",
          `Invalid reparent: '${newParentId}' is a descendant of '${childId}'`,
          { childId, newParentId }
        );
      }
    }

    // All validations passed; perform the mutation atomically
    if (oldParent) oldParent.removeChild(childId);

    if (newParent) {
      newParent.addChild(child);
    }

    // Validate hierarchy requirements for the moved subtree. If invalid, revert.
    const hierarchyErrors = this.validateHierarchyRequirementsInSubtree(child);
    if (hierarchyErrors.length) {
      // revert
      if (newParent) newParent.removeChild(childId);
      if (oldParent) oldParent.addChild(child);

      return err(
        "invalid-reparent",
        `Reparent would violate component hierarchy requirements for '${childId}':\n` +
          hierarchyErrors.map((e) => `  - ${e}`).join("\n"),
        { childId, newParentId, errors: hierarchyErrors }
      );
    }

    this.emitChange({ kind: "hierarchy-changed", childId, newParentId });
    return ok(undefined);
  }

  private validateHierarchyRequirementsInSubtree(root: Entity): string[] {
    const errors: string[] = [];
    const visit = (e: Entity) => {
      errors.push(...this.validateHierarchyRequirements(e));
      for (const c of e.getChildren()) visit(c);
    };
    visit(root);
    return errors;
  }

  private validateHierarchyRequirements(entity: Entity): string[] {
    const errors: string[] = [];
    for (const comp of entity.getAllComponents() as Component[]) {
      const reqs = (comp.metadata as any)?.requiresInHierarchy as string[] | undefined;
      if (!reqs || reqs.length === 0) continue;
      for (const req of reqs) {
        if (!this.hasComponentInSelfOrAncestors(entity, req)) {
          errors.push(
            `Component '${comp.type}' on entity '${entity.id}' requires '${req}' on this entity or an ancestor`
          );
        }
      }
    }
    return errors;
  }

  private hasComponentInSelfOrAncestors(entity: Entity, type: string): boolean {
    let cur: Entity | undefined = entity;
    while (cur) {
      if (cur.hasComponent(type)) return true;
      cur = cur.parent;
    }
    return false;
  }

  private wouldCreateCycle(child: Entity, candidateParent: Entity): boolean {
    // Walk up candidateParent's ancestor chain; if we encounter the child, it would create a cycle
    let cur: Entity | undefined = candidateParent;
    while (cur) {
      if (cur.id === child.id) return true;
      cur = cur.parent;
    }
    return false;
  }

  private emitChange(ev: SceneChangeEvent) {
    for (const l of this._changeListeners) {
      try {
        l(ev);
      } catch (e) {
        /* swallow listener errors */
      }
    }
  }

  private attachEntityObservers(entity: Entity) {
    const componentObserver: IComponentObserver = {
      onComponentChanged: (_entityId: string, componentType: string) => {
        // forward both normal change and removal notifications
        this.emitChange({
          kind: "component-changed",
          entityId: entity.id,
          componentType,
        });
      },
    };

    // Enforce requiresInHierarchy even when components are added/removed after the entity
    // has already been added to the scene.
    let isHandlingComponentEvent = false;
    const componentListener = (ev: any) => {
      if (isHandlingComponentEvent) return;
      if (!ev || ev.entity !== entity) return;
      const comp: Component | undefined = ev.component;
      const action: string | undefined = ev.action;
      if (!comp || (action !== 'added' && action !== 'removed')) return;

      isHandlingComponentEvent = true;
      try {
        if (action === 'added') {
          // Ensure scene observes new component changes.
          try {
            comp.addObserver(componentObserver);
          } catch {}

          // Validate hierarchy requirements for this entity (owner/ancestor dependencies).
          const errs = this.validateHierarchyRequirements(entity);
          if (errs.length) {
            // Revert the add.
            entity.safeRemoveComponent(comp.type);
            this.emitChange({ kind: 'error', message: errs.join('\n') } as any);
          }
        }

        if (action === 'removed') {
          // Validate subtree, because removing an owner component (e.g. rigidBody)
          // may break descendants.
          const errs = this.validateHierarchyRequirementsInSubtree(entity);
          if (errs.length) {
            // Attempt to restore the removed component instance.
            const restore = entity.safeAddComponent(comp as any);
            const msg =
              `Cannot remove component '${comp.type}' from '${entity.id}' because it breaks hierarchy requirements.\n` +
              errs.map((e) => `  - ${e}`).join('\n');
            this.emitChange({ kind: 'error', message: msg } as any);
            if (!restore.ok) {
              // If restoration fails, surface the error.
              throw new Error(msg + `\nRestore failed: ${restore.error.message}`);
            }
          }
        }
      } finally {
        isHandlingComponentEvent = false;
      }
    };

    const transformListener = () =>
      this.emitChange({ kind: "transform-changed", entityId: entity.id });

    for (const comp of entity.getAllComponents())
      comp.addObserver(componentObserver);
    try {
      entity.transform.onChange(transformListener);
    } catch {}

    try {
      entity.addComponentListener(componentListener);
    } catch {}

    const cleanup = () => {
      for (const comp of entity.getAllComponents()) {
        try {
          comp.removeObserver(componentObserver);
        } catch {}
      }
      try {
        entity.transform.removeOnChange(transformListener);
      } catch {}

      try {
        entity.removeComponentListener(componentListener);
      } catch {}
    };

    this.entitySubscriptions.set(entity.id, cleanup);
  }

  private detachEntityObservers(entityId: string) {
    const cleanup = this.entitySubscriptions.get(entityId);
    if (cleanup) {
      try {
        cleanup();
      } catch {}
      this.entitySubscriptions.delete(entityId);
    }
  }

  public getDebugTransformsEnabled(): boolean {
    return this.debugTransformsEnabled;
  }

  public getDebugCollidersEnabled(): boolean {
    return this.debugCollidersEnabled;
  }

  /**
   * Teardown the scene. Call super.teardown(engine, renderScene) if overriding.
   */
  teardown(engine: IRenderingEngine, renderScene: any): void {
    // Clear scene-scoped physics services first to avoid components calling into a disposed backend.
    try {
      setPhysicsServices(null);
    } catch {}

    // Detach collision hub first to ensure no callbacks fire during teardown/dispose.
    try {
      this.collisionEvents.detach();
    } catch {}

    if (this.settingsUnsubscribe) {
      this.settingsUnsubscribe();
      this.settingsUnsubscribe = undefined;
    }

    if (this.textureResolver) {
      try {
        this.textureResolver.dispose();
      } catch {}
      this.textureResolver = undefined;
    }

    // Remove and dispose all entities
    if (this.renderSyncSystem) {
      for (const ent of this.entities.values()) {
        this.renderSyncSystem.removeEntity(ent.id);
        // detach any observers attached for inspector/debug
        try {
          this.detachEntityObservers(ent.id);
        } catch {}
      }
    }

    if (this.physicsSystem) {
      for (const ent of this.entities.values()) {
        try {
          this.physicsSystem.removeEntity(ent.id);
        } catch {}
      }
      try {
        this.physicsSystem.dispose();
      } catch {}
      this.physicsSystem = undefined;
    }
    // ensure cleanup of any remaining subscriptions
    for (const id of Array.from(this.entitySubscriptions.keys())) {
      try {
        this.detachEntityObservers(id);
      } catch {}
    }
    this.entities.clear();

    this.activeCameraId = null;
    // notify listeners that active camera is now null
    this.emitChange({ kind: "active-camera-changed", entityId: null });

    // Clean up systems
    this.renderSyncSystem = undefined;

    // Notify engine that camera is gone
    if (engine) {
      try {
        engine.onActiveCameraChanged();
      } catch (e) {
        /* ignore */
      }
    }

    this.renderScene = undefined;
  }
}

export default BaseScene;
