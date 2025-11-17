import type IScene from '@client/domain/ports/IScene';
import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import type SceneId from '@client/domain/scene/SceneId';
import { Result, ok, err } from '@client/domain/errors/EngineError';

type VoidResult = Result<void>;
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
  // manager-level listeners that want to receive scene change events across scene switches
  private _listeners: Set<(ev: SceneChangeEvent) => void> = new Set();
  // unsubscribe function for the currently bound scene subscription
  private _sceneUnsub?: () => void;

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
  switchTo(sceneId: SceneId | string): VoidResult {
    const nextScene = this.scenes.get(sceneId);
    if (!nextScene) {
      return err('scene-not-found', `Scene "${sceneId}" not found`, { sceneId });
    }
    if (this.currentScene === nextScene) return ok(undefined); // already active

    // Unsubscribe from previous scene debug events (if any)
    try { if (this._sceneUnsub) { this._sceneUnsub(); this._sceneUnsub = undefined; } } catch {}

    // Delegate scene activation to the engine. The engine calls teardown on
    // the previous scene and setup on the new one, injecting the render scene.
    this.engine.setScene(nextScene);
    this.currentScene = nextScene;

    // If we have active listeners, subscribe to the new scene and forward events
    this.bindToCurrentSceneIfNeeded();
    return ok(undefined);
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

  /** Return the active camera entity id from the current scene, or null */
  getActiveCameraEntityId(): string | null {
    try { return this.currentScene?.getActiveCameraEntityId?.() ?? null; } catch { return null; }
  }

  /**
   * Convenience: subscribe to changes on the current scene. Returns unsubscribe.
   */
  subscribeToSceneChanges(listener: (ev: SceneChangeEvent) => void): () => void {
    this._listeners.add(listener);
    // ensure we are subscribed to the current scene
    this.bindToCurrentSceneIfNeeded();

    return () => {
      try { this._listeners.delete(listener); } catch {}
      // if no more listeners, detach underlying scene subscription
      if (this._listeners.size === 0 && this._sceneUnsub) {
        try { this._sceneUnsub(); } catch {}
        this._sceneUnsub = undefined;
      }
    };
  }

  private bindToCurrentSceneIfNeeded() {
    if (!this.currentScene) return;
    if (this._sceneUnsub) return; // already bound
    const sub = this.currentScene.subscribeChanges;
    if (!sub) return;
    try {
      this._sceneUnsub = sub.call(this.currentScene, (ev: SceneChangeEvent) => {
        for (const l of Array.from(this._listeners)) {
          try { l(ev); } catch (e) { /* swallow listener errors */ }
        }
      });
    } catch {
      this._sceneUnsub = undefined;
    }
  }

  /**
   * Convenience: reparent an entity in the current scene if supported.
   */
  reparentEntity(childId: string, newParentId: string | null): void {
    try { this.currentScene?.reparentEntity?.(childId, newParentId); } catch {}
  }

  /**
   * Convenience: set active camera on the current scene if supported.
   */
  setActiveCamera(id: string): void {
    try { this.currentScene?.setActiveCamera?.(id); } catch {}
  }

  /**
   * Reparent an entity and return a Result describing success or failure.
   * Prefer scene-level Result API when available; otherwise call the
   * legacy void API and convert to Result.
   */
  reparentEntityResult(childId: string, newParentId: string | null): VoidResult {
    try {
      const scene: any = this.currentScene;
      if (scene && typeof scene.reparentEntityResult === 'function') {
        return scene.reparentEntityResult(childId, newParentId) as VoidResult;
      }

      // Fallback: call older API and wrap
      try {
        scene?.reparentEntity?.(childId, newParentId);
        return ok(undefined);
      } catch (e: any) {
        return err('invalid-reparent', String(e), { childId, newParentId });
      }
    } catch (e: any) {
      return err('operation-not-allowed', String(e), { childId, newParentId });
    }
  }

  /**
   * Check whether a given scene is inspectable by the tools (has required debug API).
   */
  checkInspectable(sceneId: SceneId | string): Result<boolean> {
    const scene = this.scenes.get(sceneId);
    if (!scene) return err('scene-not-found', `Scene '${sceneId}' not found`, { sceneId });
    // Require debug inspector methods
    if (typeof scene.getEntities !== 'function' || typeof scene.subscribeChanges !== 'function') {
      return err('scene-not-inspectable', `Scene '${sceneId}' is not inspectable`, { sceneId });
    }
    return ok(true);
  }
}

export default SceneManager;
