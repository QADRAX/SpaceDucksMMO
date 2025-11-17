import type IScene from '@client/domain/ports/IScene';
import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import * as THREE from 'three';
import type { SettingsService } from '@client/application/SettingsService';
import type SceneId from '@client/domain/scene/SceneId';
import { RenderSyncSystem } from '../graphics/sync/RenderSyncSystem';
import { CameraTargetSystem } from '@client/domain/ecs/systems/CameraTargetSystem';
import { OrbitSystem } from '@client/domain/ecs/systems/OrbitSystem';
import type { Entity } from '@client/domain/ecs/core/Entity';
import type SceneChangeEvent from '@client/domain/scene/SceneChangeEvent';
import type { IComponentObserver } from '@client/domain/ecs/core/IComponentObserver';

export abstract class BaseScene implements IScene {
  abstract readonly id: SceneId;
  
  protected entities: Map<string, Entity> = new Map();
  private _changeListeners: Set<(ev: SceneChangeEvent) => void> = new Set();
  private entitySubscriptions: Map<string, () => void> = new Map();
  protected activeCameraId: string | null = null;
  protected engine?: IRenderingEngine;
  protected renderScene?: any; // THREE.Scene injected by engine
  
  // ECS Systems
  protected renderSyncSystem?: RenderSyncSystem;
  protected cameraTargetSystem?: CameraTargetSystem;
  protected orbitSystem?: OrbitSystem;
  
  // Settings service kept for future use (e.g., quality affecting ECS components)
  // Currently unused since legacy texture reload path was removed.
  private settingsUnsubscribe?: () => void;
  
  constructor(protected settingsService: SettingsService) {
    // No-op: legacy texture reload path removed in ECS-only mode
  }

  /**
   * Add an ECS Entity directly, without any adapter.
   */
  addEntity(entity: Entity): void {
    if (this.entities.has(entity.id)) {
      console.warn(`[${this.id}] addEntity: entity '${entity.id}' already added`);
      return;
    }
    this.entities.set(entity.id, entity);
    if (this.renderSyncSystem) {
      this.renderSyncSystem.addEntity(entity);
    }
    // subscribe to entity-level events for inspector/debug
    this.attachEntityObservers(entity);
    this.emitChange({ kind: 'entity-added', entity });
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
    if (this.activeCameraId === id) {
      this.activeCameraId = null;
      if (this.engine) {
        try { this.engine.onActiveCameraChanged(); } catch {}
      }
    }
    this.detachEntityObservers(id);
    this.entities.delete(id);
    this.emitChange({ kind: 'entity-removed', entityId: id });
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
    const camera = this.renderSyncSystem.getCamera(id);
    if (!camera) {
      console.warn(`[${this.id}] setActiveCamera: entity '${id}' has no CameraViewComponent`);
      return;
    }
    this.activeCameraId = id;

    if (this.engine) {
      try {
        this.engine.onActiveCameraChanged();
      } catch (e) {
        // ignore notify errors
      }
    }
  }

  /**
   * IScene API: Return the active THREE.Camera or null.
   */
  getActiveCamera(): THREE.Camera | null {
    if (!this.activeCameraId) return null;

    if (this.renderSyncSystem && this.entities.has(this.activeCameraId)) {
      return this.renderSyncSystem.getCamera(this.activeCameraId) || null;
    }
    return null;
  }

  /**
   * Setup the scene. Call super.setup(engine, renderScene) in derived classes.
   */
  setup(engine: IRenderingEngine, renderScene: any): void {
    this.engine = engine;
    this.renderScene = renderScene;
    
    // Initialize ECS systems
    this.renderSyncSystem = new RenderSyncSystem(renderScene);
    this.cameraTargetSystem = new CameraTargetSystem(this.renderSyncSystem.getEntities());
    this.orbitSystem = new OrbitSystem(this.renderSyncSystem.getEntities());
    
    // Add all entities that were already added
    for (const ent of this.entities.values()) {
      this.renderSyncSystem.addEntity(ent);
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

    // Update ECS systems
    if (this.orbitSystem) {
      this.orbitSystem.update(dt);
    }
    if (this.cameraTargetSystem) {
      this.cameraTargetSystem.update(dt);
    }
    if (this.renderSyncSystem) {
      this.renderSyncSystem.update(dt);
    }
  }

  // --- Scene debug/inspector helpers -------------------------------------
  public getEntities(): ReadonlyArray<Entity> {
    return Array.from(this.entities.values());
  }

  public subscribeChanges(listener: (ev: SceneChangeEvent) => void): () => void {
    this._changeListeners.add(listener);
    return () => this._changeListeners.delete(listener);
  }

  public reparentEntity(childId: string, newParentId: string | null): void {
    const child = this.entities.get(childId);
    if (!child) return;
    const oldParent = child.parent;
    if (oldParent && oldParent.id === newParentId) return; // no-op

    // detach from old parent
    if (oldParent) oldParent.removeChild(childId);

    // attach to new parent if given
    if (newParentId) {
      const newParent = this.entities.get(newParentId);
      if (!newParent) return;

      // Prevent cycles: if the new parent is a descendant of the child, attaching would create a cycle
      if (this.wouldCreateCycle(child, newParent)) {
        this.emitChange({ kind: 'error', message: `Invalid reparent: '${newParentId}' is a descendant of '${childId}'` });
        return;
      }

      newParent.addChild(child);
    }

    this.emitChange({ kind: 'hierarchy-changed', childId, newParentId });
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
      try { l(ev); } catch (e) { /* swallow listener errors */ }
    }
  }

  private attachEntityObservers(entity: Entity) {
    const componentObserver: IComponentObserver = {
      onComponentChanged: (_entityId: string, componentType: string) => {
        // forward both normal change and removal notifications
        this.emitChange({ kind: 'component-changed', entityId: entity.id, componentType });
      },
    };

    const transformListener = () => this.emitChange({ kind: 'transform-changed', entityId: entity.id });

    for (const comp of entity.getAllComponents()) comp.addObserver(componentObserver);
    try { entity.transform.onChange(transformListener); } catch {}

    const cleanup = () => {
      for (const comp of entity.getAllComponents()) {
        try { comp.removeObserver(componentObserver); } catch {}
      }
      try { entity.transform.removeOnChange(transformListener); } catch {}
    };

    this.entitySubscriptions.set(entity.id, cleanup);
  }

  private detachEntityObservers(entityId: string) {
    const cleanup = this.entitySubscriptions.get(entityId);
    if (cleanup) {
      try { cleanup(); } catch {}
      this.entitySubscriptions.delete(entityId);
    }
  }


  /**
   * Teardown the scene. Call super.teardown(engine, renderScene) if overriding.
   */
  teardown(engine: IRenderingEngine, renderScene: any): void {
    if (this.settingsUnsubscribe) {
      this.settingsUnsubscribe();
      this.settingsUnsubscribe = undefined;
    }
    
    // Remove and dispose all entities
    if (this.renderSyncSystem) {
      for (const ent of this.entities.values()) {
        this.renderSyncSystem.removeEntity(ent.id);
        // detach any observers attached for inspector/debug
        try { this.detachEntityObservers(ent.id); } catch {}
      }
    }
    // ensure cleanup of any remaining subscriptions
    for (const id of Array.from(this.entitySubscriptions.keys())) {
      try { this.detachEntityObservers(id); } catch {}
    }
    this.entities.clear();

    this.activeCameraId = null;
    
    // Clean up systems
    this.renderSyncSystem = undefined;
    this.cameraTargetSystem = undefined;
    this.orbitSystem = undefined;
    
    // Notify engine that camera is gone
    if (engine) {
      try { engine.onActiveCameraChanged(); } catch (e) { /* ignore */ }
    }
    
    this.renderScene = undefined;
  }
}

export default BaseScene;
