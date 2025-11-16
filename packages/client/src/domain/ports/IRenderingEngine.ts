import type IScene from './IScene';

/**
 * Port abstraction for a rendering engine.
 *
 * NOTE: design decision — the engine does NOT provide a default camera.
 * Scenes are responsible for managing their own cameras by adding them as
 * ISceneCamera objects via `scene.addObject(cameraEntity)` and calling
 * `scene.setActiveCamera(id)` to make one active. The engine queries the
 * active scene for its camera each frame via `scene.getActiveCamera()` and
 * will fail-fast if it's missing. This makes camera ownership explicit
 * and aligns with the ECS-first model.
 * 
 * Object management: Scenes manage their own objects via addObject/removeObject.
 * The engine injects its internal rendering scene (e.g. THREE.Scene) during
 * setup()/teardown() so scenes can add/remove visual representations without
 * the engine port exposing renderer-specific types. The engine does NOT track
 * scene objects — that's the scene's responsibility.
 */
export interface IRenderingEngine {
  /** Initialize engine resources and attach to DOM container */
  init(container: HTMLElement): void;

  /** Start the update+render loop */
  start(): void;

  /** Stop the loop and pause updates */
  stop(): void;

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
