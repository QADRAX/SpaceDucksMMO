import type IRenderingEngine from './IRenderingEngine';
import * as THREE from 'three';
import type { ISceneObject } from '../scene/ISceneObject';

/**
 * Port abstraction for a complete 3D scene.
 * Scenes are self-contained environments with their own objects, camera setup, lighting, etc.
 * 
 * Lifecycle:
 * 1. setup() - Initialize scene objects, camera, lights
 * 2. update(dt) - Per-frame logic (animations, physics, etc.)
 * 3. teardown() - Cleanup resources when switching to another scene
 * 
 * Object management:
 * - All scene objects (including cameras) are added via addObject()
 * - Cameras implementing ISceneCamera can be marked as active via setActiveCamera(id)
 * - The engine queries getActiveCamera() to render from the active camera's perspective
 */
export interface IScene {
  /** Unique identifier for this scene */
  readonly id: string;

  /**
   * Initialize scene: add objects, configure camera, set lighting.
   * @param engine - The rendering engine
   * @param renderScene - The internal rendering scene (e.g. THREE.Scene) where visual objects are added
   */
  setup(engine: IRenderingEngine, renderScene: any): void;

  /**
   * Per-frame update logic (animations, interactions, etc.)
   * @param dt - Delta time in milliseconds since last frame
   */
  update(dt: number): void;

  /**
   * Cleanup: remove objects, dispose resources, reset state.
   * Called before transitioning to another scene.
   * @param engine - The rendering engine
   * @param renderScene - The internal rendering scene (e.g. THREE.Scene) to remove visual objects from
   */
  teardown(engine: IRenderingEngine, renderScene: any): void;

  /**
   * Add a scene object (mesh, light, camera, etc.) to this scene.
   * The object will be added to the Three.js scene via obj.addTo(scene).
   * @param obj - The scene object to add
   */
  addObject(obj: ISceneObject): void;

  /**
   * Remove a scene object by ID from this scene.
   * The object will be removed from the Three.js scene via obj.removeFrom(scene).
   * @param id - The ID of the object to remove
   */
  removeObject(id: string): void;

  /**
   * Mark the camera object with the given ID as the active camera for this scene.
   * The object must implement ISceneCamera and must have been added via addObject() first.
   * Implementations should notify the engine (via engine.onActiveCameraChanged()) so
   * the renderer can update its internal state.
   * @param id - The ID of the camera object to activate
   */
  setActiveCamera(id: string): void;

  /**
   * Return the active THREE.Camera for this scene, or null if none is active.
   * The engine calls this to determine which camera to use for rendering.
   * @returns The active THREE.Camera instance, or null
   */
  getActiveCamera(): THREE.Camera | null;
}

export default IScene;
