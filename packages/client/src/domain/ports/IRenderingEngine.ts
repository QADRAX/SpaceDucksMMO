import type IScene from './IScene';
import type TextureResolverService from '@client/application/TextureResolverService';
import type { TextureCatalogService } from '@client/application/TextureCatalog';

/**
 * Port abstraction for a rendering engine.
 *
 * NOTE: design decision — the engine does NOT provide a default camera.
 * Scenes are responsible for managing their own cameras by creating camera
 * entities (with CameraViewComponent) and calling `scene.setActiveCamera(id)`.
 * The engine queries the active scene each frame via `scene.getActiveCamera()`
 * and will fail-fast if it's missing. This keeps camera ownership explicit
 * and aligns with the ECS-first model.
 *
 * Entity management: Scenes manage their Entities (domain) and the engine
 * injects its internal rendering scene (e.g. THREE.Scene) during
 * setup()/teardown(). Visual representations are created by infrastructure
 * sync systems (e.g., RenderSyncSystem). The engine does NOT track scene
 * objects; it only renders using the active camera provided by the scene.
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

  /**
   * Optional: expose texture services to scenes so they can wire ECS sync systems.
   * Engines that support asset discovery/resolution (e.g., ThreeRenderer) should
   * implement these. These methods are intentionally allowed to return
   * `undefined` for lightweight engine implementations.
   */
  getTextureResolver(): TextureResolverService | undefined;
  getTextureCatalog(): TextureCatalogService | undefined;
}

export default IRenderingEngine;
