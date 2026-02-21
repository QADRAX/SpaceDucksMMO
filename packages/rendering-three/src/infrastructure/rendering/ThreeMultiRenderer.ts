// @ts-ignore — three/webgpu ships as ESM-only; jest.config.js handles the shim.
import * as THREE from 'three/webgpu';
// @ts-ignore
import { pass } from 'three/tsl';
import type {
  IScene,
  RenderViewId,
  RenderViewOptions,
  RenderViewDebugOptions,
} from '@duckengine/core';
import type { IFpsController } from '../ui/dev/FpsController';
import { DEBUG_LAYERS } from '../graphics/debug/DebugLayers';
import {
  ThreeRendererBase,
  type WebGPURenderer,
  type PostProcessing,
  type RenderPass,
  type ThreeRendererBaseOptions,
} from './ThreeRendererBase';
import { deferredDispose } from "../graphics/debug/DebugUtils";

type ResolutionPolicy = 'auto' | 'scale';

export type ViewId = string;

export type ViewDebugOptions = {
  transforms?: boolean;
  mesh?: boolean;
  colliders?: boolean;
};

export type ViewOptions = {
  /** Camera entity id to render from. If omitted, uses scene.getActiveCamera(). */
  cameraEntityId?: string;
  /** Per-view debug visibility (implemented via three.js layers). */
  debug?: ViewDebugOptions;
  /** Per-view resolution policy. Defaults to engine settings. */
  resolutionPolicy?: ResolutionPolicy;
  resolutionScale?: number;
};

// Keep engine/core naming as the source of truth for public API typing.
export type { RenderViewId as CoreViewId, RenderViewOptions as CoreViewOptions, RenderViewDebugOptions as CoreViewDebugOptions };

type ViewRuntime = {
  id: ViewId;
  container: HTMLElement;
  renderer: WebGPURenderer;
  composer?: PostProcessing;
  renderPass?: RenderPass;
  usePostProcessing: boolean;
  cameraEntityId?: string;
  resolutionPolicy: ResolutionPolicy;
  resolutionScale: number;
  debug: Required<ViewDebugOptions>;
  missingCameraWarned: boolean;
};

/**
 * Multi-canvas renderer: renders the same internal THREE.Scene into multiple canvases.
 *
 * Important constraints:
 * - Works only within a single JS context (same window/renderer process).
 * - Multi-window requires a host+client architecture (separate render mirrors).
 *
 * All shared logic (resolvers, RAF loop, debounced resize, scene management,
 * loading flow) is inherited from ThreeRendererBase.
 */
export class ThreeMultiRenderer extends ThreeRendererBase {
  private views = new Map<ViewId, ViewRuntime>();
  private viewSeq = 0;

  private defaultResolutionPolicy: ResolutionPolicy = 'auto';
  private defaultResolutionScale = 1.0;

  constructor(fpsController: IFpsController, options?: ThreeRendererBaseOptions) {
    super(fpsController, options);
  }

  // ─── IRenderingEngine ─────────────────────────────────────────────────────

  /**
   * Initializes the shared world scene and creates a default view
   * attached to the given container.
   */
  async init(container: HTMLElement): Promise<void> {
    this.scene = new THREE.Scene();
    await this.addView(container, { id: 'main' });
    this.setupResizeListener();
  }

  dispose(): void {
    this.stop();
    this.teardownResizeListener();
    for (const v of this.views.values()) this.disposeView(v);
    this.views.clear();
    try {
      this.fpsController?.dispose?.();
    } catch (err) {
      console.warn(`[${this.logPrefix}] fpsController.dispose() failed`, err);
    }
  }

  // ─── Multi-view API ───────────────────────────────────────────────────────

  /** Add an extra canvas/view that renders the same scene. */
  async addView(
    container: HTMLElement,
    options: (RenderViewOptions | ViewOptions) & { id?: RenderViewId } = {},
  ): Promise<RenderViewId> {
    const viewOptions = options as ViewOptions & { id?: string };
    const id = viewOptions.id ?? `view:${++this.viewSeq}`;
    if (this.views.has(id)) throw new Error(`[ThreeMultiRenderer] View id already exists: ${id}`);

    const renderer = new (THREE as any).WebGPURenderer({ antialias: this.antialias }) as WebGPURenderer;
    await renderer.init();
    renderer.shadowMap.enabled = this.shadows;
    if (this.shadows) renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    const view: ViewRuntime = {
      id,
      container,
      renderer,
      composer: undefined,
      renderPass: undefined,
      usePostProcessing: false,
      cameraEntityId: viewOptions.cameraEntityId,
      resolutionPolicy: viewOptions.resolutionPolicy ?? this.defaultResolutionPolicy,
      resolutionScale: viewOptions.resolutionScale ?? this.defaultResolutionScale,
      debug: {
        transforms: viewOptions.debug?.transforms ?? false,
        mesh: viewOptions.debug?.mesh ?? viewOptions.debug?.transforms ?? false,
        colliders: viewOptions.debug?.colliders ?? false,
      },
      missingCameraWarned: false,
    };

    this.views.set(id, view);
    this.applyResolutionScaleForView(view);
    this.refreshSceneDebugAggregates();

    return id;
  }

  removeView(id: ViewId): void {
    const v = this.views.get(id);
    if (!v) return;
    this.disposeView(v);
    this.views.delete(id);
    this.refreshSceneDebugAggregates();
  }

  setViewCamera(viewId: ViewId, cameraEntityId: string | undefined): void {
    const v = this.views.get(viewId);
    if (!v) throw new Error(`[ThreeMultiRenderer] Unknown view: ${viewId}`);
    v.cameraEntityId = cameraEntityId;
    v.missingCameraWarned = false;
  }

  setViewDebug(viewId: ViewId, debug: ViewDebugOptions): void {
    const v = this.views.get(viewId);
    if (!v) throw new Error(`[ThreeMultiRenderer] Unknown view: ${viewId}`);
    if (debug.transforms !== undefined) {
      v.debug.transforms = !!debug.transforms;
      // Back-compat: old callers treated transforms as "all scene debug".
      if (debug.mesh === undefined) v.debug.mesh = !!debug.transforms;
    }
    if (debug.mesh !== undefined) v.debug.mesh = !!debug.mesh;
    if (debug.colliders !== undefined) v.debug.colliders = !!debug.colliders;
    this.refreshSceneDebugAggregates();
  }

  getViews(): ReadonlyArray<{ id: ViewId; container: HTMLElement }> {
    return Array.from(this.views.values()).map((v) => ({ id: v.id, container: v.container }));
  }

  // ─── Resolution ───────────────────────────────────────────────────────────

  setResolutionScale(scale: number): void {
    this.defaultResolutionScale = Math.max(0.25, Math.min(4, scale));
    for (const v of this.views.values()) {
      v.resolutionScale = this.defaultResolutionScale;
      this.applyResolutionScaleForView(v);
    }
  }

  setResolutionPolicy(policy: ResolutionPolicy, scale?: number): void {
    this.defaultResolutionPolicy = policy;
    if (scale !== undefined) this.setResolutionScale(scale);
    for (const v of this.views.values()) {
      v.resolutionPolicy = this.defaultResolutionPolicy;
      this.applyResolutionScaleForView(v);
    }
  }

  // ─── Post-processing ──────────────────────────────────────────────────────

  enablePostProcessing(viewId?: string): PostProcessing | undefined {
    const targetId = viewId ?? this.views.keys().next().value;
    if (!targetId) return undefined;
    const v = this.views.get(targetId);
    if (!v) throw new Error(`[ThreeMultiRenderer] View not found: ${targetId}`);

    if (v.usePostProcessing && v.composer) return v.composer;

    v.usePostProcessing = true;
    v.composer = new (THREE as any).PostProcessing(v.renderer) as PostProcessing;

    const cam = this.getCameraForView(v);
    if (this.scene && cam) {
      v.composer.outputNode = pass(this.scene, cam);
    }

    console.log(`[ThreeMultiRenderer] Node-based post-processing enabled for view: ${targetId}`);
    return v.composer;
  }

  disablePostProcessing(viewId?: RenderViewId): void {
    const targetId = viewId ?? 'main';
    const v = this.views.get(targetId);
    if (!v) return;
    v.usePostProcessing = false;
    if (v.composer) {
      deferredDispose(v.composer);
      v.composer = undefined;
      v.renderPass = undefined;
    }
  }

  getComposer(viewId?: string): PostProcessing | undefined {
    const targetId = viewId ?? this.views.keys().next().value;
    if (!targetId) return undefined;
    return this.views.get(targetId)?.composer;
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  renderFrame(): void {
    // Sync loading state to scene systems
    this.activeIScene?.renderSyncSystem?.setIsInitialLoading(this.initialLoading);

    if (this.initialLoading) {
      try {
        this.activeIScene?.update(0);
      } catch (e) {
        console.warn('[ThreeMultiRenderer] Initial load update(0) failed', e);
      }
      for (const v of this.views.values()) this.clearRenderer(v);
      this.updateOverlayProgress();
      this.updateFps();
      return;
    }

    for (const v of this.views.values()) {
      this.applyResolutionScaleForView(v);

      const cam = this.getCameraForView(v);
      if (!cam) {
        this.warnMissingCamera(v);
        this.clearRenderer(v);
        continue;
      }

      v.missingCameraWarned = false;
      this.applyCameraProjectionForView(v, cam);

      const restoreLayers = this.applyCameraLayersForView(v, cam);
      try {
        if (v.usePostProcessing && v.composer) {
          if (v.composer.outputNode && v.composer.outputNode.camera !== cam) {
            v.composer.outputNode = pass(this.scene, cam);
          }
          v.composer.render();
        } else {
          v.renderer.render(this.scene, cam);
        }
      } finally {
        restoreLayers();
      }
    }

    this.updateFps();
  }

  onActiveCameraChanged(): void {
    // Per-frame computation of aspect per view handles this.
    // Reset missing-camera warnings so they trigger again if camera disappears.
    for (const v of this.views.values()) v.missingCameraWarned = false;
  }

  // ─── Abstract hook implementations ───────────────────────────────────────

  protected get logPrefix(): string {
    return 'ThreeMultiRenderer';
  }

  protected getOverlayContainers(): HTMLElement[] {
    return Array.from(this.views.values()).map((v) => v.container);
  }

  protected applyResolutionForAllViews(): void {
    for (const v of this.views.values()) this.applyResolutionScaleForView(v);
  }

  protected async reinitializeAllRenderers(): Promise<void> {
    await Promise.all(Array.from(this.views.values()).map((v) => this.reinitializeViewRenderer(v)));
  }

  protected applyAllShadows(enabled: boolean, type: THREE.ShadowMapType): void {
    for (const v of this.views.values()) {
      v.renderer.shadowMap.enabled = enabled;
      if (enabled) v.renderer.shadowMap.type = type;
    }
  }

  protected async warmupGPU(sessionId: number, camera: THREE.Camera): Promise<void> {
    // Warm up each view sequentially, yielding a frame between each to avoid
    // one massive blocking call that triggers [Violation] warnings.
    for (const v of this.views.values()) {
      if (!v.renderer) continue;

      await v.renderer.compileAsync(this.scene, camera);
      if (sessionId !== this.currentLoadingSessionId) return;

      for (let i = 0; i < 2; i++) {
        v.renderer.render(this.scene, camera);
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        if (sessionId !== this.currentLoadingSessionId) return;
      }

      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (sessionId !== this.currentLoadingSessionId) return;
    }
  }

  protected afterSceneSetup(): void {
    // Ensure view composers pick up the new scene camera.
    for (const v of this.views.values()) {
      if (v.renderPass) {
        v.renderPass.camera = this.getCameraForView(v) ?? v.renderPass.camera;
      }
    }
    this.refreshSceneDebugAggregates();
  }

  protected teardownViewComposers(): void {
    for (const v of this.views.values()) {
      if (v.composer) {
        deferredDispose(v.composer);
      }
      v.composer = undefined;
      v.renderPass = undefined;
      v.usePostProcessing = false;
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /** Select the camera for a view (entity override, else scene active camera). */
  private getCameraForView(view: ViewRuntime): THREE.Camera | null {
    if (view.cameraEntityId) {
      const obj = this.findObjectByEntityId(view.cameraEntityId);
      if (obj instanceof THREE.Camera) return obj;
    }
    return this.getActiveCamera();
  }

  private applyResolutionScaleForView(view: ViewRuntime): void {
    if (!view.renderer || !view.container) return;
    const { clientWidth: w, clientHeight: h } = view.container;
    view.renderer.setSize(w, h, false);
    const ratio =
      view.resolutionPolicy === 'scale'
        ? (window.devicePixelRatio || 1) * view.resolutionScale
        : window.devicePixelRatio || 1;
    view.renderer.setPixelRatio(ratio);
  }

  private applyCameraProjectionForView(view: ViewRuntime, cam: THREE.Camera): void {
    const { clientWidth: w, clientHeight: h } = view.container;
    if (cam instanceof THREE.PerspectiveCamera) {
      const nextAspect = w > 0 && h > 0 ? w / h : 1;
      if (cam.aspect !== nextAspect) {
        cam.aspect = nextAspect;
        cam.updateProjectionMatrix();
      }
    }
  }

  private applyCameraLayersForView(view: ViewRuntime, cam: THREE.Camera): () => void {
    const prevMask = cam.layers.mask;
    let nextMask = 1 << 0;
    if (view.debug.transforms) nextMask |= 1 << DEBUG_LAYERS.transforms;
    if (view.debug.mesh) nextMask |= 1 << DEBUG_LAYERS.mesh;
    if (view.debug.colliders) nextMask |= 1 << DEBUG_LAYERS.colliders;
    cam.layers.mask = nextMask;
    return () => { cam.layers.mask = prevMask; };
  }

  private warnMissingCamera(view: ViewRuntime): void {
    if (!view.missingCameraWarned) {
      console.warn(`[ThreeMultiRenderer] No camera for view '${view.id}' — skipping render.`);
      view.missingCameraWarned = true;
    }
  }

  private clearRenderer(view: ViewRuntime): void {
    view.renderer.setClearColor(0x000000, 0);
    view.renderer.clear(true, true, true);
  }

  private disposeView(view: ViewRuntime): void {
    view.renderer.domElement.remove();
    if (view.composer) {
      deferredDispose(view.composer);
    }
    try {
      view.renderer.dispose();
    } catch (err) {
      console.warn(`[${this.logPrefix}] renderer.dispose() failed for view '${view.id}'`, err);
    }
  }

  private async reinitializeViewRenderer(view: ViewRuntime): Promise<void> {
    view.renderer.domElement.remove();
    if (view.composer) {
      deferredDispose(view.composer);
    }
    try { view.renderer.dispose(); } catch { /* best-effort */ }

    const renderer = new (THREE as any).WebGPURenderer({ antialias: this.antialias }) as WebGPURenderer;
    await renderer.init();
    renderer.shadowMap.enabled = this.shadows;

    view.renderer = renderer;
    view.composer = undefined;
    view.renderPass = undefined;
    view.usePostProcessing = false;
    view.container.appendChild(renderer.domElement);
    this.applyResolutionScaleForView(view);
  }

  /**
   * Aggregate per-view debug requests into scene-level master switches.
   * IScene declares these as optional methods — no cast needed.
   */
  private refreshSceneDebugAggregates(): void {
    if (!this.activeIScene) return;

    const anyTransforms = Array.from(this.views.values()).some((v) => v.debug.transforms);
    const anyMesh = Array.from(this.views.values()).some((v) => v.debug.mesh);
    const anyColliders = Array.from(this.views.values()).some((v) => v.debug.colliders);

    this.activeIScene.setDebugTransformsEnabled?.(anyTransforms);
    this.activeIScene.setDebugMeshesEnabled?.(anyMesh);
    this.activeIScene.setDebugCollidersEnabled?.(anyColliders);
  }
}

export default ThreeMultiRenderer;
