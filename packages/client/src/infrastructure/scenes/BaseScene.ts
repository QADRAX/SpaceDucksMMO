import type IScene from '@client/domain/ports/IScene';
import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import type { SettingsService } from '@client/application/SettingsService';
import { isTextureReloadable } from '@client/domain/scene/ITextureReloadable';
import type SceneId from '@client/domain/scene/SceneId';
import { SceneBuilder } from './SceneBuilder';

/**
 * Base class for scenes that provides automatic texture reload functionality and fluent scene setup.
 * 
 * Features:
 * - Automatically detects ITextureReloadable objects when added
 * - Subscribes to settings changes and reloads textures when quality changes
 * - Handles cleanup of subscriptions to prevent memory leaks
 * - Provides fluent SceneBuilder API for clean scene setup
 * 
 * Usage:
 * ```ts
 * export class MyScene extends BaseScene {
 *   readonly id = SceneId.MyScene;
 *   
 *   constructor(settingsService: SettingsService) {
 *     super(settingsService);
 *   }
 *   
 *   setup(engine: IRenderingEngine): void {
 *     super.setup(engine); // Important: call parent setup
 *     
 *     // Option 1: Fluent builder API (recommended)
 *     this.setupScene(engine)
 *       .add(skybox)
 *       .add(star, { position: [0, 0, 0] })
 *       .add(planet, { position: [3, 0, 0] })
 *       .build();
 *     
 *     // Option 2: Manual (still available)
 *     const planet = new RockyTexturedPlanet(...);
 *     this.addObject(engine, planet);
 *   }
 * }
 * ```
 */
export abstract class BaseScene implements IScene {
  abstract readonly id: SceneId;
  
  protected objects: ISceneObject[] = [];
  private settingsUnsubscribe?: () => void;
  private previousTextureQuality: string;
  
  constructor(protected settingsService: SettingsService) {
    this.previousTextureQuality = settingsService.getSettings().graphics.textureQuality;
  }

  /**
   * Setup the scene. Call super.setup(engine) in derived classes.
   */
  setup(engine: IRenderingEngine): void {
    // Subscribe to settings changes
    this.settingsUnsubscribe = this.settingsService.subscribe((newSettings) => {
      const newQuality = newSettings.graphics.textureQuality;
      
      // Only reload if texture quality changed
      if (newQuality !== this.previousTextureQuality) {
        console.log(`[${this.id}] Texture quality changed: ${this.previousTextureQuality} -> ${newQuality}`);
        this.previousTextureQuality = newQuality;
        this.reloadAllTextures();
      }
    });
  }

  /**
   * Create a fluent scene builder for adding multiple objects.
   * 
   * @example
   * ```ts
   * this.setupScene(engine)
   *   .add(skybox)
   *   .add(star, { position: [0, 0, 0] })
   *   .add(planet, { position: [3, 0, 0] })
   *   .build();
   * ```
   */
  protected setupScene(engine: IRenderingEngine): SceneBuilder {
    return new SceneBuilder(engine, this);
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

  abstract update(dt: number): void;

  /**
   * Teardown the scene. Call super.teardown(engine) in derived classes.
   */
  teardown(engine: IRenderingEngine): void {
    // Unsubscribe from settings changes
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
  }
}

export default BaseScene;
