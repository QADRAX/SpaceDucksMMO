import type IScene from '@client/domain/ports/IScene';
import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import * as THREE from 'three';
import type { SettingsService } from '@client/application/SettingsService';
import type SceneId from '@client/domain/scene/SceneId';
import { RenderSyncSystem } from '../graphics/sync/RenderSyncSystem';
import { CameraTargetSystem } from '@client/domain/ecs/systems/CameraTargetSystem';
import { OrbitSystem } from '@client/domain/ecs/systems/OrbitSystem';
import type { Entity } from '@client/domain/ecs/core/Entity';

export abstract class BaseScene implements IScene {
  abstract readonly id: SceneId;
  
  protected entities: Map<string, Entity> = new Map();
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
    this.entities.delete(id);
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
      }
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
