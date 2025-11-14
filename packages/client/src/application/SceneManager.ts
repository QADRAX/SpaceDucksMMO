import type IScene from '@client/domain/ports/IScene';
import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import type SceneId from '@client/domain/scene/SceneId';
import type { SettingsService } from '@client/application/SettingsService';
import { SceneFactory, type SceneDefinition } from '@client/infrastructure/scenes/SceneFactory';

/**
 * Application service that manages 3D scene lifecycle and transitions.
 * Orchestrates scene setup/teardown and delegates per-frame updates.
 * Supports both class-based scenes and declarative scene definitions.
 */
export class SceneManager {
  private engine: IRenderingEngine;
  private scenes = new Map<string, IScene>();
  private currentScene: IScene | null = null;
  private settingsService: SettingsService;

  constructor(engine: IRenderingEngine, settingsService: SettingsService) {
    this.engine = engine;
    this.settingsService = settingsService;
  }

  /**
   * Register a scene to make it available for transitions.
   * @param scene - The scene to register
   */
  register(scene: IScene): void {
    this.scenes.set(scene.id, scene);
  }

  /**
   * Register a scene from a declarative definition
   * @param definition - The scene definition
   */
  registerDefinition(definition: SceneDefinition): void {
    const scene = SceneFactory.createScene(definition, this.settingsService);
    this.register(scene);
  }

  /**
   * Switch to a different scene by ID.
   * Tears down the current scene (if any) and sets up the new one.
   * @param sceneId - The ID of the scene to switch to
   */
  switchTo(sceneId: SceneId | string): void {
    const nextScene = this.scenes.get(sceneId);
    if (!nextScene) {
      console.warn(`SceneManager: scene "${sceneId}" not found`);
      return;
    }
    if (this.currentScene === nextScene) return; // already active

    // Teardown current scene
    if (this.currentScene) {
      this.currentScene.teardown(this.engine);
    }

    // Setup new scene
    nextScene.setup(this.engine);
    this.currentScene = nextScene;
  }

  /**
   * Update the current scene (called per frame).
   * @param dt - Delta time in milliseconds
   */
  update(dt: number): void {
    if (this.currentScene) {
      this.currentScene.update(dt);
    }
  }

  /**
   * Get the currently active scene, if any.
   */
  getCurrent(): IScene | null {
    return this.currentScene;
  }
}

export default SceneManager;
