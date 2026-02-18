// @ts-ignore
import * as THREE from 'three/webgpu';
// @ts-ignore
import { pass } from 'three/tsl';
import type {
  IRenderingEngine,
  IScene,
  ITextureResolver,
  TextureCatalogService,
  IRenderSyncSystem,
  RenderViewId,
  RenderViewOptions,
  RenderViewDebugOptions,
} from '@duckengine/core';
import { LoadingTracker } from '@duckengine/core';
import type { IFpsController } from '../ui/dev/FpsController';
import { RenderSyncSystem } from '../graphics/sync/RenderSyncSystem';
import { DEBUG_LAYERS } from '../graphics/debug/DebugLayers';
import type { EngineResourceResolver } from '../resources/EngineResourceResolver';

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
// These aliases are exported to avoid breaking existing imports.
export type { RenderViewId as CoreViewId, RenderViewOptions as CoreViewOptions, RenderViewDebugOptions as CoreViewDebugOptions };

type ViewRuntime = {
  id: ViewId;
  container: HTMLElement;
  renderer: any; // THREE.WebGPURenderer
  composer?: any; // THREE.PostProcessing
  renderPass?: any;
  usePostProcessing: boolean;
  cameraEntityId?: string;
  resolutionPolicy: ResolutionPolicy;
  resolutionScale: number;
  debug: Required<ViewDebugOptions>;
  missingCameraWarned: boolean;
  loadingOverlay?: HTMLElement;
};

/**
 * Multi-canvas renderer: renders the same internal THREE.Scene into multiple canvases.
 *
 * Important constraints:
 * - Works only within a single JS context (same window/renderer process).
 * - Multi-window requires a host+client architecture (separate render mirrors).
 */
export class ThreeMultiRenderer implements IRenderingEngine {
  private scene!: THREE.Scene;
  private views = new Map<ViewId, ViewRuntime>();
  private activeIScene: IScene | null = null;
  private rafId: number | null = null;
  private loadingTracker = new LoadingTracker();
  private initialLoading = false;
  private showLoadingOverlay = true;
  private currentLoadingSessionId = 0;

  private antialias = true;
  private shadows = true;

  private defaultResolutionPolicy: ResolutionPolicy = 'auto';
  private defaultResolutionScale = 1.0;

  private fpsController: IFpsController;
  private textureResolver?: ITextureResolver;
  private textureCatalog?: TextureCatalogService;
  private engineResourceResolver?: EngineResourceResolver;

  private viewSeq = 0;

  constructor(fpsController: IFpsController) {
    this.fpsController = fpsController;
  }

  setTextureResolver(resolver: ITextureResolver): void {
    this.textureResolver = resolver;
  }

  getTextureResolver(): ITextureResolver | undefined {
    return this.textureResolver;
  }

  setTextureCatalog(catalog: TextureCatalogService): void {
    this.textureCatalog = catalog;
  }

  getTextureCatalog(): TextureCatalogService | undefined {
    return this.textureCatalog;
  }

  setEngineResourceResolver(resolver: EngineResourceResolver): void {
    this.engineResourceResolver = resolver;
  }

  getEngineResourceResolver(): EngineResourceResolver | undefined {
    return this.engineResourceResolver;
  }

  createRenderSyncSystem(
    renderScene: any,
    catalog?: TextureCatalogService,
    resolver?: ITextureResolver
  ): IRenderSyncSystem {
    return new RenderSyncSystem(
      renderScene,
      catalog,
      resolver,
      this.engineResourceResolver,
      this.loadingTracker
    );
  }

  getLoadingTracker(): LoadingTracker {
    return this.loadingTracker;
  }

  isLoading(): boolean {
    return this.initialLoading;
  }

  setLoadingOverlayEnabled(enabled: boolean): void {
    this.showLoadingOverlay = enabled;
    for (const v of this.views.values()) {
      if (v.loadingOverlay) {
        v.loadingOverlay.style.display = enabled && this.initialLoading ? 'flex' : 'none';
      }
    }
  }

  /**
   * Initializes the shared world scene and creates a default view attached to the given container.
   */
  async init(container: HTMLElement): Promise<void> {
    this.scene = new THREE.Scene();
    await this.addView(container, { id: 'main' });

    window.addEventListener('resize', () => this.handleResize());
  }

  /** Add an extra canvas/view that renders the same scene. */
  async addView(container: HTMLElement, options: (RenderViewOptions | ViewOptions) & { id?: RenderViewId } = {}): Promise<RenderViewId> {
    const id = (options as any).id ?? `view:${++this.viewSeq}`;
    if (this.views.has(id)) throw new Error(`[ThreeMultiRenderer] View id already exists: ${id}`);

    const renderer = new (THREE as any).WebGPURenderer({ antialias: this.antialias });
    await renderer.init();

    // WebGPURenderer shadow properties
    (renderer as any).shadowMap.enabled = this.shadows;
    if (this.shadows) (renderer as any).shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    const view: ViewRuntime = {
      id,
      container,
      renderer,
      composer: undefined,
      renderPass: undefined,
      usePostProcessing: false,
      cameraEntityId: (options as any).cameraEntityId,
      resolutionPolicy: (options as any).resolutionPolicy ?? this.defaultResolutionPolicy,
      resolutionScale: (options as any).resolutionScale ?? this.defaultResolutionScale,
      debug: {
        transforms: (options as any).debug?.transforms ?? false,
        mesh: (options as any).debug?.mesh ?? (options as any).debug?.transforms ?? false,
        colliders: (options as any).debug?.colliders ?? false,
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

    try {
      v.renderer.domElement.remove();
    } catch { }

    try {
      v.composer?.dispose();
    } catch { }

    try {
      v.renderer.dispose();
    } catch { }

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

  /** Select the camera for a view (entity override, else scene active camera). */
  private getCameraForView(view: ViewRuntime): THREE.Camera | null {
    if (view.cameraEntityId) {
      const obj = this.findObjectByEntityId(view.cameraEntityId);
      if (obj && obj instanceof THREE.Camera) return obj as THREE.Camera;
    }

    return this.getActiveCamera();
  }

  /** Returns the scene active camera object3D (if present). */
  public getActiveCamera(): THREE.Camera | null {
    if (this.activeIScene?.getActiveCamera) {
      try {
        const ent = this.activeIScene.getActiveCamera();
        if (!ent) return null;
        const obj = this.findObjectByEntityId(ent.id);
        if (obj && obj instanceof THREE.Camera) return obj as THREE.Camera;
        return null;
      } catch (err) {
        console.warn('[ThreeMultiRenderer] Error calling scene.getActiveCamera():', err);
      }
    }
    return null;
  }

  private findObjectByEntityId(entityId: string): THREE.Object3D | null {
    if (!this.scene) return null;
    const stack: THREE.Object3D[] = [this.scene];
    while (stack.length) {
      const obj = stack.pop()!;
      try {
        if (obj.userData && (obj.userData as any).entityId === entityId) return obj;
      } catch { }
      for (const c of obj.children) stack.push(c);
    }
    return null;
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

  async setAntialias(enabled: boolean): Promise<void> {
    if (this.antialias === enabled) return;
    this.antialias = enabled;
    // Reinitialize each view renderer (antialias is constructor-only)
    await Promise.all(Array.from(this.views.values()).map(v => this.reinitializeViewRenderer(v)));
  }

  setShadows(enabled: boolean, type: any = THREE.PCFSoftShadowMap): void {
    this.shadows = enabled;
    for (const v of this.views.values()) {
      try {
        v.renderer.shadowMap.enabled = enabled;
        if (enabled) v.renderer.shadowMap.type = type;
      } catch { }
    }
  }

  private async reinitializeViewRenderer(view: ViewRuntime): Promise<void> {
    const old = view.renderer;

    try {
      old.domElement.remove();
    } catch { }

    try {
      view.composer?.dispose();
    } catch { }

    try {
      old.dispose();
    } catch { }

    const renderer = new (THREE as any).WebGPURenderer({ antialias: this.antialias });
    await renderer.init();

    // Shadow properties
    renderer.shadowMap.enabled = this.shadows;

    view.renderer = renderer;
    view.composer = undefined;
    view.renderPass = undefined;
    view.usePostProcessing = false;
    view.container.appendChild(renderer.domElement);
    this.applyResolutionScaleForView(view);
  }

  enablePostProcessing(viewId?: string): any {
    const targetId = viewId ?? this.views.keys().next().value;
    if (!targetId) return undefined;
    const v = this.views.get(targetId);
    if (!v) throw new Error(`[ThreeMultiRenderer] View not found: ${targetId}`);

    if (v.usePostProcessing && v.composer) return v.composer;

    v.usePostProcessing = true;
    // @ts-ignore
    v.composer = new (THREE as any).PostProcessing(v.renderer);

    const cam = this.getCameraForView(v);
    if (this.scene && cam) {
      v.composer.outputNode = pass(this.scene, cam);
    }

    console.log(`[ThreeMultiRenderer] Node-based post-processing enabled for view: ${viewId}`);

    return v.composer;
  }

  disablePostProcessing(viewId?: RenderViewId): void {
    const targetId = viewId ?? 'main';
    const v = this.views.get(targetId);
    if (!v) return;
    v.usePostProcessing = false;
    if (v.composer) {
      try {
        v.composer.dispose();
      } catch { }
      v.composer = undefined;
      v.renderPass = undefined;
    }
  }

  getComposer(viewId?: string): any | undefined {
    const targetId = viewId ?? this.views.keys().next().value;
    if (!targetId) return undefined;
    return this.views.get(targetId)?.composer;
  }

  start(): void {
    if (this.rafId !== null) return;
    const loop = () => {
      try {
        this.renderFrame();
        this.rafId = requestAnimationFrame(loop);
      } catch (err) {
        console.error('[ThreeMultiRenderer] Fatal loop error', err);
        this.stop();
      }
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private async startInitialLoading(): Promise<void> {
    const sessionId = ++this.currentLoadingSessionId;
    this.initialLoading = true;
    this.createLoadingOverlays();

    try {
      // Discovery Phase: Wait for at least 500ms to allow all systems (MeshFeature, etc.)
      // to discover entities and register their async tasks (like material catalog lookups).
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (sessionId !== this.currentLoadingSessionId) return;

      this.loadingTracker.endTask('sceneDiscovery');

      await this.loadingTracker.waitForInitialLoad();
      if (sessionId !== this.currentLoadingSessionId) return;

      // GPU Warm-up Phase: Pre-compile shaders and upload textures for ALL views.
      const camera = this.getActiveCamera();
      if (camera) {
        this.updateLoadingOverlaysText('Finalizing GPU textures...');
        try {
          // We warm up each view sequentially, yielding a frame between each to avoid
          // one massive blocking call that triggers [Violation] warnings.
          for (const [viewId, v] of this.views.entries()) {
            if (v.renderer) {
              // 1. Async shader compilation for this view
              await v.renderer.compileAsync(this.scene, camera);
              if (sessionId !== this.currentLoadingSessionId) return;
              await new Promise((resolve) => requestAnimationFrame(resolve));
              if (sessionId !== this.currentLoadingSessionId) return;

              // 2. Multi-stage Hidden Render: Absorbs synchronous Buffer/Texture uploads.
              // Doing it twice ensures all textures are committed before the view is exposed.
              for (let i = 0; i < 2; i++) {
                v.renderer.render(this.scene, camera);
                // Yield to allow browser to consume the heavy frame
                await new Promise((resolve) => requestAnimationFrame(resolve));
                if (sessionId !== this.currentLoadingSessionId) return;
              }
            }
          }
        } catch (e) {
          console.warn('[ThreeMultiRenderer] GPU Warm-up failed', e);
        }
      }
    } finally {
      // Important: Only reset state if this session is still the active one.
      // If a new session started while we were awaiting, it's responsible for its own state.
      if (sessionId === this.currentLoadingSessionId) {
        this.initialLoading = false;
        this.removeLoadingOverlays();
      }
    }
  }

  private createLoadingOverlays(): void {
    if (!this.showLoadingOverlay) return;
    for (const v of this.views.values()) {
      if (v.loadingOverlay) continue;

      // Ensure container is positioned so absolute overlay is contained
      if (getComputedStyle(v.container).position === 'static') {
        v.container.style.position = 'relative';
      }

      const el = document.createElement('div');
      el.style.position = 'absolute';
      el.style.top = '0';
      el.style.left = '0';
      el.style.width = '100%';
      el.style.height = '100%';
      el.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      el.style.color = 'white';
      el.style.display = 'flex';
      el.style.flexDirection = 'column';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.zIndex = '1000';
      el.style.fontFamily = 'Inter, system-ui, sans-serif';

      const text = document.createElement('div');
      text.innerText = 'Loading Scene...';
      text.style.marginBottom = '10px';

      const progress = document.createElement('div');
      progress.className = 'engine-loader-progress';
      progress.style.width = '200px';
      progress.style.height = '4px';
      progress.style.backgroundColor = '#333';
      progress.style.borderRadius = '2px';
      progress.style.overflow = 'hidden';

      const bar = document.createElement('div');
      bar.style.width = '0%';
      bar.style.height = '100%';
      bar.style.backgroundColor = '#3b82f6'; // blue-500
      bar.style.transition = 'width 0.2s ease-out';

      progress.appendChild(bar);
      el.appendChild(text);
      el.appendChild(progress);

      v.container.appendChild(el);
      v.loadingOverlay = el;
    }
  }

  private updateLoadingOverlays(): void {
    const progress = this.loadingTracker.getProgress();
    for (const v of this.views.values()) {
      if (!v.loadingOverlay) continue;
      const bar = v.loadingOverlay.querySelector('.engine-loader-progress > div') as HTMLElement;
      if (bar) {
        bar.style.width = `${Math.floor(progress * 100)}%`;
      }
    }
  }

  private updateLoadingOverlaysText(text: string): void {
    for (const v of this.views.values()) {
      if (!v.loadingOverlay) continue;
      const textEl = v.loadingOverlay.querySelector('div:first-child') as HTMLElement;
      if (textEl) {
        textEl.innerText = text;
      }
    }
  }

  private removeLoadingOverlays(): void {
    for (const v of this.views.values()) {
      if (v.loadingOverlay) {
        v.loadingOverlay.remove();
        v.loadingOverlay = undefined;
      }
    }
  }

  setScene(scene: IScene): void {
    this.teardownPreviousScene();
    this.activeIScene = scene;
    this.loadingTracker.reset();

    // Fix Race Condition: Set loading state BEFORE setup so features/textures 
    // register their tasks correctly in the tracker immediately.
    this.initialLoading = true;
    this.loadingTracker.startTask('sceneDiscovery');
    try {
      (this.activeIScene as any).renderSyncSystem?.setIsInitialLoading(true);
    } catch { }

    scene.setup(this, this.scene);
    this.onActiveCameraChanged();

    // Ensure view composers pick up the current camera next render.
    for (const v of this.views.values()) {
      if (v.renderPass) v.renderPass.camera = this.getCameraForView(v) ?? (v.renderPass.camera as any);
    }

    this.refreshSceneDebugAggregates();

    if (!this.getActiveCamera()) {
      console.warn('[ThreeMultiRenderer] Scene setup did not register an active camera.');
    }

    // Trigger initial load tracking routine (session-managed)
    this.startInitialLoading();
  }

  private teardownPreviousScene(): void {
    if (this.activeIScene?.teardown) {
      try {
        this.activeIScene.teardown(this, this.scene);
      } catch (e) {
        console.warn('[ThreeMultiRenderer] Error during previous scene teardown', e);
      }
    }

    if (this.scene) this.scene.clear();

    // Per-view postprocess depends on the scene; reset it.
    for (const v of this.views.values()) {
      if (v.composer) {
        try {
          v.composer.dispose();
        } catch { }
      }
      v.composer = undefined;
      v.renderPass = undefined;
      v.usePostProcessing = false;
    }
  }

  /** Called by core when active camera changes; multi-view mostly handles this per frame. */
  onActiveCameraChanged(): void {
    // No-op by design: we compute aspect per view per frame.
    // Keep missing camera warnings reset.
    for (const v of this.views.values()) v.missingCameraWarned = false;
  }

  getActiveScene(): IScene | null {
    return this.activeIScene;
  }

  private warnMissingCamera(view: ViewRuntime): void {
    if (!view.missingCameraWarned) {
      console.warn(`[ThreeMultiRenderer] No camera for view '${view.id}' — skipping render.`);
      view.missingCameraWarned = true;
    }
  }

  private clearRenderer(view: ViewRuntime): void {
    try {
      view.renderer.setClearColor(0x000000, 0);
      view.renderer.clear(true, true, true);
    } catch { }
  }

  private applyCameraLayersForView(view: ViewRuntime, cam: THREE.Camera): () => void {
    const prevMask = cam.layers.mask;
    let nextMask = 1 << 0;
    if (view.debug.transforms) nextMask |= 1 << DEBUG_LAYERS.transforms;
    if (view.debug.mesh) nextMask |= 1 << DEBUG_LAYERS.mesh;
    if (view.debug.colliders) nextMask |= 1 << DEBUG_LAYERS.colliders;
    cam.layers.mask = nextMask;
    return () => {
      cam.layers.mask = prevMask;
    };
  }

  renderFrame(): void {
    // Sync loading state to systems
    try {
      (this.activeIScene as any).renderSyncSystem?.setIsInitialLoading(this.initialLoading);
    } catch { }

    if (this.initialLoading) {
      try {
        this.activeIScene?.update(0);
      } catch (e) {
        console.warn('[ThreeMultiRenderer] Initial load update(0) failed', e);
      }

      for (const v of this.views.values()) {
        this.clearRenderer(v);
      }
      this.updateLoadingOverlays();
      try {
        this.fpsController.update();
      } catch { }
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
          if (v.composer.outputNode && (v.composer.outputNode as any).camera !== cam) {
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

    try {
      this.fpsController.update();
    } catch { }
  }

  handleResize(): void {
    for (const v of this.views.values()) this.applyResolutionScaleForView(v);
  }

  /**
   * Aggregate per-view debug requests into scene-level master switches.
   * This controls whether helpers get created at all.
   */
  private refreshSceneDebugAggregates(): void {
    const scene = this.activeIScene as any;
    if (!scene) return;

    const anyTransforms = Array.from(this.views.values()).some((v) => v.debug.transforms);
    const anyMesh = Array.from(this.views.values()).some((v) => v.debug.mesh);
    const anyColliders = Array.from(this.views.values()).some((v) => v.debug.colliders);

    try {
      if (typeof scene.setDebugTransformsEnabled === 'function') scene.setDebugTransformsEnabled(anyTransforms);
    } catch { }

    try {
      if (typeof scene.setDebugMeshesEnabled === 'function') scene.setDebugMeshesEnabled(anyMesh);
    } catch { }

    try {
      if (typeof scene.setDebugCollidersEnabled === 'function') scene.setDebugCollidersEnabled(anyColliders);
    } catch { }
  }
}

export default ThreeMultiRenderer;
