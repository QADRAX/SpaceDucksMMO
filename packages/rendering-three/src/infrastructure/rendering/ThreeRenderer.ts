import * as THREE from "three";
import type { IRenderingEngine, IScene, ITextureResolver, TextureCatalogService, IRenderSyncSystem } from "@duckengine/core";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import type { IFpsController } from "../ui/dev/FpsController";
import { RenderSyncSystem } from "../graphics/sync/RenderSyncSystem";
import { DEBUG_LAYERS } from "../graphics/debug/DebugLayers";
import type { EngineResourceResolver } from "../resources/EngineResourceResolver";

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

  setScene(scene: IScene): void {
    this.teardownPreviousScene();
    this.activeIScene = scene;
    scene.setup(this, this.scene);
    this.onActiveCameraChanged();
    if (!this.getActiveCamera()) {
      console.warn("[ThreeRenderer] Scene setup did not register an active camera.");
    }
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
