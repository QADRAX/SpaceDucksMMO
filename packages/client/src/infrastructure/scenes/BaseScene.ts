import type IScene from '@client/domain/ports/IScene';
import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import type { SettingsService } from '@client/application/SettingsService';
import { isTextureReloadable } from '@client/domain/scene/ITextureReloadable';
import type SceneId from '@client/domain/scene/SceneId';

/**
 * Base class for scenes that provides automatic texture reload functionality.
 * 
 * Features:
 * - Automatically detects ITextureReloadable objects when added
 * - Subscribes to settings changes and reloads textures when quality changes
 * - Handles cleanup of subscriptions to prevent memory leaks
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
 *     // Add your objects
 *     const planet = new RockyTexturedPlanet(...);
 *     this.addObject(engine, planet); // Use addObject instead of engine.add
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
    
    // Remove all objects
    this.objects.forEach(obj => engine.remove(obj.id));
    this.objects = [];
  }
}

export default BaseScene;
