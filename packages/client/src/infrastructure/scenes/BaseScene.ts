import type IScene from '@client/domain/ports/IScene';
import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import * as THREE from 'three';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import type { ISceneCamera } from '@client/domain/scene/ISceneCamera';
import type { SettingsService } from '@client/application/SettingsService';
import { isTextureReloadable } from '@client/domain/scene/ITextureReloadable';
import type SceneId from '@client/domain/scene/SceneId';

/**
 * Helper to check if an object implements ISceneCamera
 */
function isSceneCamera(obj: ISceneObject): obj is ISceneCamera {
  return 'getCamera' in obj && typeof (obj as any).getCamera === 'function';
}

export abstract class BaseScene implements IScene {
  abstract readonly id: SceneId;
  
  protected objects: Map<string, ISceneObject> = new Map();
  protected activeCameraId: string | null = null;
  protected engine?: IRenderingEngine;
  protected renderScene?: any; // THREE.Scene injected by engine
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
    
    // Add to rendering scene if setup has been called
    if (this.renderScene) {
      obj.addTo(this.renderScene);
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

    // Remove from rendering scene if available
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

  /**
   * IScene API: Set which object is the active camera.
   * The object must implement ISceneCamera and must have been added via addObject() first.
   */
  setActiveCamera(id: string): void {
    const obj = this.objects.get(id);
    if (!obj) {
      console.warn(`[${this.id}] setActiveCamera: object '${id}' not found`);
      return;
    }
    if (!isSceneCamera(obj)) {
      console.warn(`[${this.id}] setActiveCamera: object '${id}' does not implement ISceneCamera`);
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
    
    const obj = this.objects.get(this.activeCameraId);
    if (!obj || !isSceneCamera(obj)) return null;
    
    return obj.getCamera();
  }

  /**
   * Setup the scene. Call super.setup(engine, renderScene) in derived classes.
   */
  setup(engine: IRenderingEngine, renderScene: any): void {
    this.engine = engine;
    this.renderScene = renderScene;
    
    // Add all objects that were already added to the rendering scene
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
    
    // Remove and dispose all objects
    for (const obj of this.objects.values()) {
      obj.removeFrom(renderScene);
      if (obj.dispose) {
        obj.dispose();
      }
    }
    this.objects.clear();
    this.activeCameraId = null;
    
    // Notify engine that camera is gone
    if (engine) {
      try { engine.onActiveCameraChanged(); } catch (e) { /* ignore */ }
    }
    
    this.renderScene = undefined;
  }
}

export default BaseScene;
