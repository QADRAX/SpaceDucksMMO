import type IScene from '@client/domain/ports/IScene';
import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import * as THREE from 'three';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import type { ISceneCamera } from '@client/domain/scene/ISceneCamera';
import type { SettingsService } from '@client/application/SettingsService';
import { isTextureReloadable } from '@client/domain/scene/ITextureReloadable';
import type SceneId from '@client/domain/scene/SceneId';
import { RenderSyncSystem } from '../scene-ecs/RenderSyncSystem';
import { CameraTargetSystem } from '../scene-ecs/CameraTargetSystem';
import { OrbitSystem } from '../scene-ecs/OrbitSystem';
import type { Entity } from '../scene-ecs/Entity';

/**
 * Helper to check if an object implements ISceneCamera
 */
function isSceneCamera(obj: ISceneObject): obj is ISceneCamera {
  return 'getCamera' in obj && typeof (obj as any).getCamera === 'function';
}

export abstract class BaseScene implements IScene {
  abstract readonly id: SceneId;
  
  protected objects: Map<string, ISceneObject> = new Map();
  protected entities: Map<string, Entity> = new Map();
  protected activeCameraId: string | null = null;
  protected engine?: IRenderingEngine;
  protected renderScene?: any; // THREE.Scene injected by engine
  
  // ECS Systems
  protected renderSyncSystem?: RenderSyncSystem;
  protected cameraTargetSystem?: CameraTargetSystem;
  protected orbitSystem?: OrbitSystem;
  
  private settingsUnsubscribe?: () => void;
  private previousTextureQuality: string;
  
  constructor(protected settingsService: SettingsService) {
    this.previousTextureQuality = settingsService.getSettings().graphics.textureQuality;

    this.settingsUnsubscribe = this.settingsService.subscribe((newSettings) => {
      const newQuality = newSettings.graphics.textureQuality;
      if (newQuality !== this.previousTextureQuality) {
        console.log(`[${this.id}] Texture quality changed: ${this.previousTextureQuality} -> ${newQuality}`);
        this.previousTextureQuality = newQuality;
        this.reloadAllTextures();
      }
    });
  }

  /**
   * IScene API: Add a scene object (including cameras).
   * The object is tracked internally and added to the rendering scene.
   */
  addObject(obj: ISceneObject): void {
    if (this.objects.has(obj.id)) {
      console.warn(`[${this.id}] addObject: object '${obj.id}' already added`);
      return;
    }
    this.objects.set(obj.id, obj);

    // Legacy path: for old ISceneObject implementations (SceneEntity, CameraEntity)
    if (this.renderScene) {
      obj.addTo(this.renderScene);
    }
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

  /**
   * IScene API: Remove a scene object by ID.
   * The object is removed from the rendering scene and untracked.
   * If the removed object was the active camera, the active camera is cleared.
   */
  removeObject(id: string): void {
    const obj = this.objects.get(id);
    if (!obj) {
      console.warn(`[${this.id}] removeObject: object '${id}' not found`);
      return;
    }

    // Legacy path
    if (this.renderScene) {
      obj.removeFrom(this.renderScene);
    }

    // If this was the active camera, clear it and notify engine
    if (this.activeCameraId === id) {
      this.activeCameraId = null;
      if (this.engine) {
        try { this.engine.onActiveCameraChanged(); } catch (e) { /* ignore */ }
      }
    }

    this.objects.delete(id);
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
    const obj = this.objects.get(id);
    if (obj) {
      if (isSceneCamera(obj)) {
        this.activeCameraId = id;
      } else {
        console.warn(`[${this.id}] setActiveCamera: object '${id}' is not a camera`);
        return;
      }
    } else {
      // Try ECS entity
      const ent = this.entities.get(id);
      if (!ent || !this.renderSyncSystem) {
        console.warn(`[${this.id}] setActiveCamera: id '${id}' not found as object or entity`);
        return;
      }
      const camera = this.renderSyncSystem.getCamera(id);
      if (!camera) {
        console.warn(`[${this.id}] setActiveCamera: entity '${id}' has no CameraViewComponent`);
        return;
      }
      this.activeCameraId = id;
    }

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

    // First try ECS
    if (this.renderSyncSystem && this.entities.has(this.activeCameraId)) {
      return this.renderSyncSystem.getCamera(this.activeCameraId) || null;
    }
    // Legacy path: ISceneCamera
    const obj = this.objects.get(this.activeCameraId);
    if (obj && isSceneCamera(obj)) return obj.getCamera();
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

    // Add all legacy objects that were already added
    for (const obj of this.objects.values()) {
      obj.addTo(renderScene);
    }
  }

  /**
   * Get all objects in this scene (for SceneEditor)
   */
  getObjects(): ISceneObject[] {
    return Array.from(this.objects.values());
  }

  /**
   * Reload textures for all ITextureReloadable objects in the scene.
   */
  private reloadAllTextures(): void {
    if (this.objects.size === 0) {
      return;
    }
    
    let reloadCount = 0;
    
    for (const obj of this.objects.values()) {
      if (isTextureReloadable(obj)) {
        reloadCount++;
        obj.reloadTexture().catch((err: unknown) => {
          console.error(`[${this.id}] Failed to reload texture:`, err);
        });
      }
    }
    
    if (reloadCount > 0) {
      console.log(`[${this.id}] Reloading textures for ${reloadCount} object(s)`);
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
    
    // Update legacy scene objects
    for (const obj of this.objects.values()) {
      obj.update(dt);
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

    // Remove and dispose all legacy objects
    for (const obj of this.objects.values()) {
      obj.removeFrom(renderScene);
      obj.dispose?.();
    }
    this.objects.clear();
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
