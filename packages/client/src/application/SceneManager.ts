import type IScene from '@client/domain/ports/IScene';
import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import type SceneId from '@client/domain/scene/SceneId';
import type { Entity } from '@client/domain/ecs/core/Entity';
import type SceneChangeEvent from '@client/domain/scene/SceneChangeEvent';
import type { SettingsService } from '@client/application/SettingsService';
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

    // Delegate scene activation to the engine. The engine calls teardown on
    // the previous scene and setup on the new one, injecting the render scene.
    this.engine.setScene(nextScene);
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

  /**
   * Convenience: return entities of the current scene or empty array.
   */
  getEntities(): ReadonlyArray<Entity> {
    if (!this.currentScene) return [];
    try {
      const res = this.currentScene.getEntities?.();
      return (res ?? []) as ReadonlyArray<Entity>;
    } catch {
      return [];
    }
  }

  /**
   * Convenience: subscribe to changes on the current scene. Returns unsubscribe.
   */
  subscribeToSceneChanges(listener: (ev: SceneChangeEvent) => void): () => void {
    if (!this.currentScene) return () => {};
    const sub = this.currentScene.subscribeChanges;
    if (!sub) return () => {};
    try { return sub.call(this.currentScene, listener); } catch { return () => {}; }
  }

  /**
   * Convenience: reparent an entity in the current scene if supported.
   */
  reparentEntity(childId: string, newParentId: string | null): void {
    try { this.currentScene?.reparentEntity?.(childId, newParentId); } catch {}
  }
}

export default SceneManager;
