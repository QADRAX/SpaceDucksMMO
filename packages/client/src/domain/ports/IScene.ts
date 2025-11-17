import type IRenderingEngine from './IRenderingEngine';
import * as THREE from 'three';
import type { Entity } from '../ecs/core/Entity';
import type SceneChangeEvent from '../scene/SceneChangeEvent';

/**
 * Port abstraction for a complete 3D scene.
 * Scenes are self-contained environments with their own objects, camera setup, lighting, etc.
 * 
 * Lifecycle:
 * 1. setup() - Initialize scene objects, camera, lights
 * 2. update(dt) - Per-frame logic (animations, physics, etc.)
 * 3. teardown() - Cleanup resources when switching to another scene
 * 
 * Entity-first management (ECS):
 * - All scene content is represented as Entities with Components in the domain.
 * - The scene adds/removes entities via addEntity()/removeEntity().
 * - The engine queries getActiveCamera() to render from the active camera's perspective.
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

  /** Add an ECS Entity to this scene */
  addEntity(entity: Entity): void;

  /** Remove an ECS Entity by ID */
  removeEntity(id: string): void;

  /**
  * Mark the camera entity with the given ID as the active camera for this scene.
  * Implementations should notify the engine (via engine.onActiveCameraChanged()) so
  * the renderer can update its internal state.
  * @param id - The ID of the camera entity to activate
   */
  setActiveCamera(id: string): void;

  /**
   * Return the active THREE.Camera for this scene, or null if none is active.
   * The engine calls this to determine which camera to use for rendering.
   * @returns The active THREE.Camera instance, or null
   */
  getActiveCamera(): THREE.Camera | null;

  // Debug / inspector helpers (optional to keep backward compatibility)
  getEntities?(): ReadonlyArray<Entity>;
  subscribeChanges?(listener: (ev: SceneChangeEvent) => void): () => void;
  reparentEntity?(childId: string, newParentId: string | null): void;
  /** Return id of active camera entity in the scene, or null if none */
  getActiveCameraEntityId?(): string | null;
}

export default IScene;
