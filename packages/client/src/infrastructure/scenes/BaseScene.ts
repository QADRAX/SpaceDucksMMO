import type IScene from '@client/domain/ports/IScene';
import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import * as THREE from 'three';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import type { SettingsService } from '@client/application/SettingsService';
import { isTextureReloadable } from '@client/domain/scene/ITextureReloadable';
import type SceneId from '@client/domain/scene/SceneId';

export abstract class BaseScene implements IScene {
  abstract readonly id: SceneId;
  
  protected objects: ISceneObject[] = [];
  protected cameras: Map<string, THREE.Camera> = new Map();
  protected activeCameraId: string | null = null;
  protected engine?: IRenderingEngine;
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

  /** Register a camera for this scene under an id. Does not automatically make it active. */
  registerCamera(id: string, camera: THREE.Camera): void {
    this.cameras.set(id, camera);
    if (this.engine) {
      try {
        this.engine.onActiveCameraChanged();
      } catch (e) {
      }
    }
  }

  /** Set which registered camera is active for this scene. Notifies engine if available. */
  setActiveCamera(id: string): void {
    if (!this.cameras.has(id)) {
      console.warn(`[${this.id}] setActiveCamera: camera '${id}' not registered`);
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
   * Unregister a previously registered camera. If the camera is currently active
   * it will be deactivated and the engine notified so it can update rendering state.
   * If `dispose` is true we will attempt a best-effort disposal of typical
   * child geometry/material resources attached to the camera (useful for helpers).
   */
  unregisterCamera(id: string, dispose: boolean = false): void {
    if (!this.cameras.has(id)) return;
    const cam = this.cameras.get(id);
    this.cameras.delete(id);

    // If we removed the active camera, clear active id and notify engine
    if (this.activeCameraId === id) {
      this.activeCameraId = null;
      if (this.engine) {
        try { this.engine.onActiveCameraChanged(); } catch (e) { /* ignore */ }
      }
    }

    if (dispose && cam) {
      try {
        // Cameras don't have a standard dispose method; traverse children and
        // dispose typical resources (geometries, materials, textures) as a best-effort.
        (cam as any).traverse?.((child: any) => {
          try {
            if (child.geometry) child.geometry.dispose();
          } catch (e) {}
          try {
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((m: any) => { if (m.map) try { m.map.dispose(); } catch(e){}; if (m.dispose) try { m.dispose(); } catch(e){} });
              } else {
                if (child.material.map) try { child.material.map.dispose(); } catch(e) {}
                if (child.material.dispose) try { child.material.dispose(); } catch(e) {}
              }
            }
          } catch (e) {}
        });
      } catch (e) {
        // ignore disposal errors
      }
    }
  }

  /** IScene API: return the active THREE.Camera or null */
  getActiveCamera(): THREE.Camera | null {
    if (this.activeCameraId) {
      return this.cameras.get(this.activeCameraId) || null;
    }
    return null;
  }

  /**
   * Setup the scene. Call super.setup(engine) in derived classes.
   */
  setup(engine: IRenderingEngine): void {
    // Scenes should perform engine-dependent initialization here. Avoid
    // subscribing to global services in setup(); subscriptions happen in
    // the constructor so scenes receive config updates as soon as they are
    // created (SceneManager may instantiate scenes before activating them).
    this.engine = engine;
  }

  /**
   * Add a scene object and track it for texture reloading if applicable.
   * Use this instead of engine.add() directly.
   */
  protected addObject(engine: IRenderingEngine, obj: ISceneObject): void {
    this.objects.push(obj);
    engine.add(obj);
  }

  /**
   * Get all controllers in this scene
   */
  // Controller accessors removed from public API intentionally.

  /**
   * Get all objects in this scene (for SceneEditor)
   */
  getObjects(): ISceneObject[] {
    return this.objects;
  }

  /**
   * Reload textures for all ITextureReloadable objects in the scene.
   */
  private reloadAllTextures(): void {
    if (this.objects.length === 0) {
      return;
    }
    
    let reloadCount = 0;
    
    this.objects.forEach(obj => {
      if (isTextureReloadable(obj)) {
        reloadCount++;
        obj.reloadTexture().catch((err: unknown) => {
          console.error(`[${this.id}] Failed to reload texture:`, err);
        });
      }
    });
    
    if (reloadCount > 0) {
      console.log(`[${this.id}] Reloading textures for ${reloadCount} object(s)`);
    }
  }

  /**
   * Update all objects and controllers.
   * Most scenes don't need to override this.
   */
  update(dt: number): void {
    this.objects.forEach(obj => obj.update(dt));
  }

  /**
   * Teardown the scene. Call super.teardown(engine) if overriding.
   */
  teardown(engine: IRenderingEngine): void {
    if (this.settingsUnsubscribe) {
      this.settingsUnsubscribe();
      this.settingsUnsubscribe = undefined;
    }
    
    // Dispose and remove all objects
    this.objects.forEach(obj => {
      if (obj.dispose) {
        obj.dispose(); // Clean up Three.js resources (textures, geometries, materials)
      }
      engine.remove(obj.id);
    });
    this.objects = [];

    this.cameras.clear();
    this.activeCameraId = null;
    if (engine) {
      try { engine.onActiveCameraChanged(); } catch (e) { /* ignore */ }
    }
  }
}

export default BaseScene;
