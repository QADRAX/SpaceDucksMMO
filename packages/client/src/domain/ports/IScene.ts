import type IRenderingEngine from './IRenderingEngine';
import * as THREE from 'three';
import type { ISceneController } from '../scene/ISceneController';

/**
 * Port abstraction for a complete 3D scene.
 * Scenes are self-contained environments with their own objects, camera setup, lighting, etc.
 * 
 * Lifecycle:
 * 1. setup() - Initialize scene objects, camera, lights
 * 2. update(dt) - Per-frame logic (animations, physics, etc.)
 * 3. teardown() - Cleanup resources when switching to another scene
 */
export interface IScene {
  /** Unique identifier for this scene */
  readonly id: string;

  /**
   * Initialize scene: add objects, configure camera, set lighting.
   * @param engine - The rendering engine to add objects and access camera/scene
   */
  setup(engine: IRenderingEngine): void;

  /**
   * Per-frame update logic (animations, interactions, etc.)
   * @param dt - Delta time in milliseconds since last frame
   */
  update(dt: number): void;

  /**
   * Cleanup: remove objects, dispose resources, reset state.
   * Called before transitioning to another scene.
   * @param engine - The rendering engine to remove objects from
   */
  teardown(engine: IRenderingEngine): void;

  /** Get all controllers in this scene */
  // Controller management moved out of the scene port. Scene implementations
  // may manage controllers internally but the public API no longer exposes
  // controller lists. This intentionally breaks backwards compatibility.

  /** Register a camera instance with the scene under an id. The scene is
   * responsible for owning camera lifecycle and for exposing which camera is
   * active via `getActiveCamera()`.
   */
  registerCamera(id: string, camera: THREE.Camera): void;

  /** Set which registered camera is active for this scene. Implementations
   * must ensure that calling this method will make the engine reflect the
   * change (for example by notifying the engine or by making
   * `getActiveCamera()` return the new camera immediately).
   */
  setActiveCamera(id: string): void;

  /** Return the active THREE.Camera for this scene, or null if none */
  getActiveCamera(): THREE.Camera | null;
}

export default IScene;
