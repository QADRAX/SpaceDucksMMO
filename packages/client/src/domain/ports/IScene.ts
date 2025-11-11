import type IRenderingEngine from './IRenderingEngine';

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
}

export default IScene;
