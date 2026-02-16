import * as THREE from 'three';
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
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
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
  renderer: THREE.WebGLRenderer;
  composer?: EffectComposer;
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
 */
export class ThreeMultiRenderer implements IRenderingEngine {
  private scene!: THREE.Scene;
  private views = new Map<ViewId, ViewRuntime>();
  private activeIScene: IScene | null = null;
  private rafId: number | null = null;

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
      this.engineResourceResolver
    );
  }

  /**
   * Initializes the shared world scene and creates a default view attached to the given container.
   */
  init(container: HTMLElement): void {
    this.scene = new THREE.Scene();
    this.addView(container, { id: 'main' });

    window.addEventListener('resize', () => this.handleResize());
  }

  /** Add an extra canvas/view that renders the same scene. */
  addView(container: HTMLElement, options: (RenderViewOptions | ViewOptions) & { id?: RenderViewId } = {}): RenderViewId {
    const id = (options as any).id ?? `view:${++this.viewSeq}`;
    if (this.views.has(id)) throw new Error(`[ThreeMultiRenderer] View id already exists: ${id}`);

    const renderer = new THREE.WebGLRenderer({ antialias: this.antialias });
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

  setAntialias(enabled: boolean): void {
    if (this.antialias === enabled) return;
    this.antialias = enabled;
    // Reinitialize each view renderer (antialias is constructor-only)
    for (const v of this.views.values()) this.reinitializeViewRenderer(v);
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

  private reinitializeViewRenderer(view: ViewRuntime): void {
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

    const renderer = new THREE.WebGLRenderer({ antialias: this.antialias });
    renderer.shadowMap.enabled = this.shadows;
    if (this.shadows) renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    view.renderer = renderer;
    view.composer = undefined;
    view.renderPass = undefined;
    view.usePostProcessing = false;

    view.container.appendChild(renderer.domElement);
    this.applyResolutionScaleForView(view);
  }

  enablePostProcessing(viewId: ViewId = 'main'): EffectComposer {
    const v = this.views.get(viewId);
    if (!v) throw new Error(`[ThreeMultiRenderer] Unknown view: ${viewId}`);

    if (!v.composer) {
      const cam = this.getCameraForView(v);
      if (!cam) throw new Error('Cannot enable post-processing: no active camera.');
      v.composer = new EffectComposer(v.renderer);
      v.renderPass = new RenderPass(this.scene, cam);
      v.composer.addPass(v.renderPass);
    }

    v.usePostProcessing = true;
    return v.composer;
  }

  disablePostProcessing(viewId: ViewId = 'main'): void {
    const v = this.views.get(viewId);
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

  getComposer(viewId: ViewId = 'main'): EffectComposer | undefined {
    return this.views.get(viewId)?.composer;
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

  setScene(scene: IScene): void {
    this.teardownPreviousScene();
    this.activeIScene = scene;
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
          if (v.renderPass && v.renderPass.camera !== cam) v.renderPass.camera = cam;
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
