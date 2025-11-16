import type { ISceneObject } from '../scene/ISceneObject';
import type IScene from './IScene';

/**
 * Port abstraction for a rendering engine.
 *
 * NOTE: design decision — the engine does NOT provide a default camera.
 * Scenes are responsible for creating/registering a camera (for example
 * by exposing it via `IScene.getActiveCamera()` or by registering a camera
 * with the scene via `BaseScene.registerCamera(id, camera)` and calling
 * `BaseScene.setActiveCamera(id)`).
 * The renderer will query the active scene for its camera each frame and
 * will fail-fast if it's missing. This makes camera ownership explicit
 * and aligns with the ECS-first model.
 */
export interface IRenderingEngine {
  /** Initialize engine resources and attach to DOM container */
  init(container: HTMLElement): void;

  /** Start the update+render loop */
  start(): void;

  /** Stop the loop and pause updates */
  stop(): void;

  /** Add a scene object (ISceneObject implements addTo/removeFrom/update) */
  add(object: ISceneObject): void;

  /** Remove an object by id and dispose its resources */
  remove(id: string): void;

  /** Engine implementations must NOT expose renderer internals (Three.js types).
   *  The engine is intentionally agnostic from the port perspective. Scenes
   *  provide cameras via the `IScene` contract; the renderer implementation
   *  may query the active scene internally but should not leak Three.js types
   *  through this interface.
   */

  /** Set the active scene for the engine. The engine will call teardown on the previous scene and setup on the new one. */
  setScene(scene: IScene): void;

  /** Get the currently active IScene instance (if any) */
  getActiveScene(): IScene | null;

  /** Render a single frame (updates assumed to be handled externally or by the engine loop) */
  renderFrame(): void;

  /** Notifies the engine that the active camera for the currently active scene has changed.
   *  This hook intentionally does not expose the camera object; engine
   *  implementations should query the active scene internally if they need
   *  access to the camera instance.
   */
  onActiveCameraChanged(): void;

  /** Rendering/quality settings */
  setResolutionPolicy(policy: 'auto' | 'scale', scale?: number): void;
  setResolutionScale(scale: number): void;
  setAntialias(enabled: boolean): void;
  setShadows(enabled: boolean, type?: any): void;

  /** Post-processing control (composer is optional) */
  enablePostProcessing(): any;
  disablePostProcessing(): void;
  getComposer(): any | undefined;

  /** Debug helpers */
  toggleFpsCounter(): void;
  getFps(): number;
}

export default IRenderingEngine;
