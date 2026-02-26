import type { IScene } from './IScene';
import type { TextureCatalogService } from '../assets/TextureCatalog';
import { IRenderSyncSystem } from './IRenderSyncSystem';
import { ITextureResolver } from './ITextureResolver';
import type { IPhysicsSystem } from '../physics/IPhysicsSystem';

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
  init(container: HTMLElement): Promise<void>;

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
  setAntialias(enabled: boolean): Promise<void>;
  setShadows(enabled: boolean, type?: any): void;

  /** Post-processing control (composer is optional) */
  enablePostProcessing(viewId?: string): any;
  disablePostProcessing(viewId?: string): void;
  getComposer(viewId?: string): any | undefined;

  getTextureCatalog(): TextureCatalogService | undefined;

  // --- Multi-view (optional) --------------------------------------------
  //
  // Some renderer backends can render the same scene into multiple views
  // (multiple canvases in the same window, or multiple windows).
  // These APIs are optional so single-canvas backends remain compatible.
  //
  // Design: a "view" owns its presentation target (canvas/container) and can
  // select a camera entity id (overriding scene active camera).

  /** Opaque view identifier returned by addView(). */
  addView?(container: HTMLElement, options?: RenderViewOptions): Promise<RenderViewId>;
  removeView?(viewId: RenderViewId): void;
  setViewCamera?(viewId: RenderViewId, cameraEntityId: string | undefined): void;
  setViewDebug?(viewId: RenderViewId, debug: RenderViewDebugOptions): void;
  getViews?(): ReadonlyArray<{ id: RenderViewId; container: HTMLElement }>;

  /**
   * Optional: renderer backends can provide a scene sync system instance.
   * Core does not implement this; backends (three, etc.) do.
   */
  createRenderSyncSystem?(
    renderScene: any,
    catalog?: TextureCatalogService,
    textureResolver?: ITextureResolver,
  ): IRenderSyncSystem | undefined;

  /**
   * Optional: physics backends can provide a physics system instance.
  * Core depends only on the interface (defined in @duckengine/core), not an implementation.
   */
  createPhysicsSystem?(): IPhysicsSystem | undefined;

  /**
   * Optional: backends can provide an imperative gizmo renderer instance.
   */
  createGizmoRenderer?(): import('./IGizmoRenderer').IGizmoRenderer | undefined;

  /**
   * Optional: return the loading tracker used by this engine.
   */
  getLoadingTracker?(): any; // LoadingTracker (using any for portability)

  /**
   * Check if the engine is currently in an initial loading/frozen state.
   */
  isLoading?(): boolean;

  /**
   * Enable or disable the built-in loading overlay.
   */
  setLoadingOverlayEnabled?(enabled: boolean): void;
}

/** Token to force module emission */
export const IRenderingEngine_TOKEN = 'IRenderingEngine';

export type RenderViewId = string;

export type RenderViewDebugOptions = {
  transforms?: boolean;
  mesh?: boolean;
  colliders?: boolean;
};

export type RenderViewOptions = {
  /** Optional id to make view addressing stable (e.g., 'main', 'editor'). */
  id?: RenderViewId;
  /** Camera entity id to render from. If omitted, backend uses the scene active camera. */
  cameraEntityId?: string;
  /** Per-view debug visibility (if supported by backend). */
  debug?: RenderViewDebugOptions;
  /** Optional per-view resolution policy override. */
  resolutionPolicy?: 'auto' | 'scale';
  resolutionScale?: number;
};
