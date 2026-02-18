import * as THREE from "three";
import type { IRenderingEngine, IScene, ITextureResolver, TextureCatalogService, IRenderSyncSystem } from "@duckengine/core";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import type { IFpsController } from "../ui/dev/FpsController";
import { RenderSyncSystem } from "../graphics/sync/RenderSyncSystem";
import { DEBUG_LAYERS } from "../graphics/debug/DebugLayers";
import type { EngineResourceResolver } from "../resources/EngineResourceResolver";
import { LoadingTracker } from "@duckengine/core";

export class ThreeRenderer implements IRenderingEngine {
  private scene!: THREE.Scene;
  private renderer!: THREE.WebGLRenderer;
  private composer?: EffectComposer;
  private renderPass?: RenderPass;
  private usePostProcessing = false;
  private container!: HTMLElement;
  private resolutionPolicy: "auto" | "scale" = "auto";
  private resolutionScale = 1.0;
  private rafId: number | null = null;
  private resizeRafId: number | null = null;
  private activeIScene: IScene | null = null;
  private antialias = true;
  private shadows = true;
  private missingCameraWarned = false;
  private fpsController: IFpsController;
  private textureResolver?: ITextureResolver;
  private textureCatalog?: TextureCatalogService;
  private engineResourceResolver?: EngineResourceResolver;
  private onResize?: () => void;

  private loadingTracker = new LoadingTracker();
  private initialLoading = false;
  private showLoadingOverlay = true;
  private loadingOverlayElement: HTMLElement | null = null;
  private currentLoadingSessionId = 0;

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
    if (this.loadingOverlayElement) {
      this.loadingOverlayElement.style.display = enabled && this.initialLoading ? 'flex' : 'none';
    }
  }

  init(container: HTMLElement): void {
    this.container = container;
    this.scene = new THREE.Scene();
    this.initializeRenderer();
    this.applyResolutionScale();
    try {
      // Ensure the canvas always fits and responds to container resizing.
      this.renderer.domElement.style.display = 'block';
      this.renderer.domElement.style.width = '100%';
      this.renderer.domElement.style.height = '100%';
    } catch {
      // ignore
    }
    container.appendChild(this.renderer.domElement);
    this.onResize = () => this.handleResize();
    window.addEventListener('resize', this.onResize);
  }

  /**
   * Best-effort cleanup for short-lived renderers (eg. admin previews).
   * Stops RAF, removes resize listener, and disposes WebGL resources.
   */
  dispose(): void {
    try {
      this.stop();
    } catch { }

    try {
      if (this.resizeRafId !== null) cancelAnimationFrame(this.resizeRafId);
    } catch { }
    this.resizeRafId = null;

    try {
      if (this.onResize) window.removeEventListener('resize', this.onResize);
    } catch { }
    this.onResize = undefined;

    try {
      this.disablePostProcessing();
    } catch { }

    try {
      // Teardown any active scene
      this.teardownPreviousScene();
    } catch { }

    try {
      const el = this.renderer?.domElement as any;
      if (el && el.parentNode) el.parentNode.removeChild(el);
    } catch { }

    try {
      this.renderer?.dispose?.();
    } catch { }

    try {
      this.fpsController?.dispose?.();
    } catch { }
  }

  private initializeRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({ antialias: this.antialias });
    this.renderer.shadowMap.enabled = this.shadows;
    if (this.shadows) this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  public getActiveCamera(): THREE.Camera | null {
    if (this.activeIScene?.getActiveCamera) {
      try {
        const ent = this.activeIScene.getActiveCamera();
        if (!ent) return null;
        // Find the corresponding Three.Object3D that was tagged with entityId by the RenderSyncSystem
        const obj = this.findObjectByEntityId(ent.id);
        if (obj && (obj as any) instanceof THREE.Camera) return obj as THREE.Camera;
        return null;
      } catch (err) {
        console.warn('[ThreeRenderer] Error calling scene.getActiveCamera():', err);
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

  private applyResolutionScale(): void {
    if (!this.renderer || !this.container) return;
    // clientWidth/clientHeight can lag during responsive reflow; rect is more reliable.
    const rect = this.container.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width) || this.container.clientWidth);
    const h = Math.max(1, Math.floor(rect.height) || this.container.clientHeight);
    this.renderer.setSize(w, h, false);
    const ratio =
      this.resolutionPolicy === "scale"
        ? (window.devicePixelRatio || 1) * this.resolutionScale
        : window.devicePixelRatio || 1;
    this.renderer.setPixelRatio(ratio);

    const cam = this.getActiveCamera();
    if (cam instanceof THREE.PerspectiveCamera) {
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    }
  }

  setResolutionScale(scale: number): void {
    this.resolutionScale = Math.max(0.25, Math.min(4, scale));
    this.applyResolutionScale();
  }

  setResolutionPolicy(policy: "auto" | "scale", scale?: number): void {
    this.resolutionPolicy = policy;
    if (scale !== undefined) this.setResolutionScale(scale);
  }

  setAntialias(enabled: boolean): void {
    if (this.antialias === enabled) return;
    this.antialias = enabled;
    this.reinitializeRenderer();
  }

  private reinitializeRenderer(): void {
    if (!this.container) return;
    this.renderer.domElement.remove();
    this.renderer.dispose();
    this.initializeRenderer();
    try {
      this.renderer.domElement.style.display = 'block';
      this.renderer.domElement.style.width = '100%';
      this.renderer.domElement.style.height = '100%';
    } catch {
      // ignore
    }
    this.container.appendChild(this.renderer.domElement);
    this.applyResolutionScale();
  }

  setShadows(enabled: boolean, type: any = THREE.PCFSoftShadowMap): void {
    this.shadows = enabled;
    if (this.renderer) {
      this.renderer.shadowMap.enabled = enabled;
      if (enabled) this.renderer.shadowMap.type = type;
    }
  }

  renderFrame(): void {
    const cam = this.getActiveCamera();
    if (!cam) {
      this.warnMissingCamera();
      this.clearRenderer();
      // Update FPS counter even when skipping render
      try { this.fpsController.update(); } catch { /* ignore */ }
      return;
    }

    // Sync loading state to systems
    try {
      (this.activeIScene as any).renderSyncSystem?.setIsInitialLoading(this.initialLoading);
    } catch { }

    if (this.initialLoading) {
      // In the loading/frozen phase, we still tick the scene but with 0 delta.
      // This MUST happen so RenderSyncSystem.update() is called, which allows
      // Features (like MeshFeature) to process their async load results.
      try {
        this.activeIScene?.update(0);
      } catch (e) {
        console.warn('[ThreeRenderer] Initial load update(0) failed', e);
      }

      this.clearRenderer();
      this.updateLoadingOverlay();
      try { this.fpsController.update(); } catch { /* ignore */ }
      return;
    }

    this.missingCameraWarned = false;

    // Debug helpers now live on dedicated layers; preserve previous behavior by
    // auto-including them when the scene master switches are enabled.
    const prevMask = cam.layers.mask;
    try {
      let mask = 1 << 0;
      try {
        const s: any = this.activeIScene as any;
        if (s?.getDebugTransformsEnabled?.()) mask |= 1 << DEBUG_LAYERS.transforms;
        if (s?.getDebugMeshesEnabled?.()) mask |= 1 << DEBUG_LAYERS.mesh;
        if (s?.getDebugCollidersEnabled?.()) mask |= 1 << DEBUG_LAYERS.colliders;
      } catch { }
      cam.layers.mask = mask;

      if (this.usePostProcessing && this.composer) {
        this.updateComposerCamera(cam);
        this.composer.render();
      } else {
        this.renderer.render(this.scene, cam);
      }
    } finally {
      cam.layers.mask = prevMask;
    }
    // Update FPS counter after rendering
    try { this.fpsController.update(); } catch { /* ignore */ }
  }
  private warnMissingCamera(): void {
    if (!this.missingCameraWarned) {
      console.warn("[ThreeRenderer] No active camera for current scene — skipping render frame.");
      this.missingCameraWarned = true;
    }
  }

  private clearRenderer(): void {
    try {
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.clear(true, true, true);
    } catch {
      // Ignore errors
    }
  }

  private updateComposerCamera(cam: THREE.Camera): void {
    if (this.renderPass && this.renderPass.camera !== cam) {
      this.renderPass.camera = cam;
    }
  }

  enablePostProcessing(): EffectComposer {
    if (!this.composer) {
      const cam = this.getActiveCamera();
      if (!cam) throw new Error("Cannot enable post-processing: no active camera.");
      this.composer = new EffectComposer(this.renderer);
      this.renderPass = new RenderPass(this.scene, cam);
      this.composer.addPass(this.renderPass);
    }
    this.usePostProcessing = true;
    return this.composer;
  }

  disablePostProcessing(): void {
    this.usePostProcessing = false;
    if (this.composer) {
      this.composer.dispose();
      this.composer = undefined;
    }
  }

  start(): void {
    if (this.rafId !== null) return;
    const loop = (t: number) => {
      try {
        this.renderFrame();
        this.rafId = requestAnimationFrame(loop);
      } catch (err) {
        console.error("[ThreeRenderer] Fatal loop error", err);
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
    this.createLoadingOverlay();

    try {
      // Discovery Phase: Wait for at least 500ms to allow all systems (MeshFeature, etc.)
      // to discover entities and register their async tasks (like material catalog lookups).
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (sessionId !== this.currentLoadingSessionId) return;

      this.loadingTracker.endTask('sceneDiscovery');

      await this.loadingTracker.waitForInitialLoad();
      if (sessionId !== this.currentLoadingSessionId) return;

      // GPU Warm-up Phase: Pre-compile shaders and upload textures while loader is still visible.
      const camera = this.getActiveCamera();
      if (camera) {
        this.updateLoadingOverlayText('Finalizing GPU textures...');
        try {
          // 1. Async shader compilation
          await this.renderer.compileAsync(this.scene, camera);
          if (sessionId !== this.currentLoadingSessionId) return;

          // 2. Multi-stage Hidden Render: Absorbs the synchronous cost of Buffer/Texture uploads.
          // Doing it twice ensures that any textures uploaded in the first pass are ready 
          // to be displayed in the second, preventing a "half-loaded" first frame.
          for (let i = 0; i < 2; i++) {
            this.renderer.render(this.scene, camera);
            // Yield to allow browser to consume the heavy frame
            await new Promise((resolve) => requestAnimationFrame(resolve));
            if (sessionId !== this.currentLoadingSessionId) return;
          }

          // Final safety yield
          await new Promise((resolve) => requestAnimationFrame(resolve));
        } catch (e) {
          console.warn('[ThreeRenderer] GPU Warm-up failed', e);
        }
      }
    } finally {
      // Important: Only reset state if this session is still the active one.
      // If a new session started while we were awaiting, it's responsible for its own state.
      if (sessionId === this.currentLoadingSessionId) {
        this.initialLoading = false;
        this.removeLoadingOverlay();
      }
    }
  }

  private createLoadingOverlay(): void {
    if (!this.container || !this.showLoadingOverlay || this.loadingOverlayElement) return;

    // Ensure container is positioned so absolute overlay is contained
    if (getComputedStyle(this.container).position === 'static') {
      this.container.style.position = 'relative';
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

    const spinner = document.createElement('div');
    spinner.className = 'engine-loader-spinner';
    // Add some basic CSS for spinner if needed, but simple text is fine for now

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

    this.container.appendChild(el);
    this.loadingOverlayElement = el;
  }

  private updateLoadingOverlay(): void {
    if (!this.loadingOverlayElement) return;
    const progress = this.loadingTracker.getProgress();
    const bar = this.loadingOverlayElement.querySelector('.engine-loader-progress > div') as HTMLElement;
    if (bar) {
      bar.style.width = `${Math.floor(progress * 100)}%`;
    }
  }

  private updateLoadingOverlayText(text: string): void {
    if (!this.loadingOverlayElement) return;
    const textEl = this.loadingOverlayElement.querySelector('div:first-child') as HTMLElement;
    if (textEl) {
      textEl.innerText = text;
    }
  }

  private removeLoadingOverlay(): void {
    if (this.loadingOverlayElement) {
      this.loadingOverlayElement.remove();
      this.loadingOverlayElement = null;
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
    if (!this.getActiveCamera()) {
      console.warn("[ThreeRenderer] Scene setup did not register an active camera.");
    }

    // Trigger initial load tracking routine (session-managed)
    this.startInitialLoading();
  }

  private teardownPreviousScene(): void {
    if (this.activeIScene?.teardown) {
      try {
        this.activeIScene.teardown(this, this.scene);
      } catch (e) {
        console.warn("[ThreeRenderer] Error during previous scene teardown", e);
      }
    }
    this.scene.clear();
    if (this.composer) {
      this.composer.dispose?.();
      this.composer = undefined;
      this.renderPass = undefined;
      this.usePostProcessing = false;
    }
  }

  handleResize(): void {
    // Debounce to next frame so layout has settled (helps on viewport shrink).
    if (this.resizeRafId !== null) return;
    this.resizeRafId = requestAnimationFrame(() => {
      this.resizeRafId = null;
      this.applyResolutionScale();
    });
  }

  onActiveCameraChanged(): void {
    const camera = this.getActiveCamera();
    if (camera) this.missingCameraWarned = false;
    if (this.renderPass && camera) {
      this.renderPass.camera = camera;
    }
    if (camera instanceof THREE.PerspectiveCamera) {
      const { clientWidth: w, clientHeight: h } = this.container || window;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }

  getComposer(): EffectComposer | undefined {
    return this.composer;
  }

  getActiveScene(): IScene | null {
    return this.activeIScene;
  }

  toggleFpsCounter(): void {
    if (this.fpsController.isRunning()) {
      this.fpsController.stop();
      this.fpsController.hide();
    } else {
      this.fpsController.start();
      this.fpsController.show();
    }
  }
}

export default ThreeRenderer;
