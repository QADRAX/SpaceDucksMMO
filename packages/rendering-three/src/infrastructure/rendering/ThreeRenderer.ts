// @ts-ignore — three/webgpu ships as ESM-only; jest.config.js handles the shim.
import * as THREE from "three/webgpu";
// @ts-ignore
import { pass } from 'three/tsl';
import type { IRenderSyncSystem } from "@duckengine/core";
import { CoreLogger } from "@duckengine/core";
import type { IFpsController } from "../ui/dev/FpsController";
import { DEBUG_LAYERS } from "../graphics/debug/DebugLayers";
import { GIZMO_LAYER } from "../graphics/debug/GizmoOverlaySystem";
import {
  ThreeRendererBase,
  type WebGPURenderer,
  type PostProcessing,
  type RenderPass,
  type ThreeRendererBaseOptions,
} from "./ThreeRendererBase";
import { deferredDispose } from "../graphics/debug/DebugUtils";

/**
 * Single-canvas Three.js/WebGPU renderer.
 *
 * Manages one WebGPURenderer + one canvas attached to `container`.
 * All shared logic (resolver wiring, RAF loop, debounced resize, scene
 * management, loading flow) lives in ThreeRendererBase.
 */
export class ThreeRenderer extends ThreeRendererBase {
  private container!: HTMLElement;
  private renderer!: WebGPURenderer;
  private composer?: PostProcessing;
  private renderPass?: RenderPass;
  private usePostProcessing = false;
  private resolutionPolicy: 'auto' | 'scale' = 'auto';
  private resolutionScale = 1.0;
  private missingCameraWarned = false;

  constructor(fpsController: IFpsController, options?: ThreeRendererBaseOptions) {
    super(fpsController, options);
  }

  // ─── IRenderingEngine ─────────────────────────────────────────────────────

  async init(container: HTMLElement): Promise<void> {
    this.container = container;
    this.scene = new THREE.Scene();
    await this.initializeRenderer();
    this.applyResolutionScale();
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);
    this.setupResizeListener();
  }

  dispose(): void {
    this.stop();
    this.teardownResizeListener();
    this.teardownViewComposers();

    const el = this.renderer?.domElement;
    if (el?.parentNode) el.parentNode.removeChild(el);

    try {
      this.renderer?.dispose?.();
    } catch (err) {
      CoreLogger.warn(this.logPrefix, 'renderer.dispose() failed', err);
    }
    try {
      this.fpsController?.dispose?.();
    } catch (err) {
      CoreLogger.warn(this.logPrefix, 'fpsController.dispose() failed', err);
    }
  }

  renderFrame(): void {
    const cam = this.getActiveCamera();
    if (!cam) {
      this.warnMissingCamera();
      this.clearRenderer();
      this.updateFps();
      return;
    }

    // Sync loading state via scene runtime adapter (if present)
    this.syncSceneInitialLoadingState();

    if (this.initialLoading) {
      // Still tick the scene with Δt=0 so RenderSyncSystem can process async results.
      try {
        this.activeIScene?.update(0);
      } catch (e) {
        CoreLogger.warn(this.logPrefix, 'Initial load update(0) failed', e);
      }
      this.clearRenderer();
      this.updateOverlayProgress();
      this.updateFps();
      return;
    }

    this.missingCameraWarned = false;

    const prevMask = cam.layers.mask;
    try {
      cam.layers.mask = this.buildDebugLayerMask();

      if (this.usePostProcessing && this.composer) {
        if (this.composer.outputNode && this.composer.outputNode.camera !== cam) {
          this.composer.outputNode = pass(this.scene, cam);
        }
        this.composer.render();
      } else {
        this.renderer.render(this.scene, cam);
      }
    } finally {
      cam.layers.mask = prevMask;
    }
    this.updateFps();
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

  // ─── Resolution ──────────────────────────────────────────────────────────

  setResolutionScale(scale: number): void {
    this.resolutionScale = Math.max(0.25, Math.min(4, scale));
    this.applyResolutionScale();
  }

  setResolutionPolicy(policy: 'auto' | 'scale', scale?: number): void {
    this.resolutionPolicy = policy;
    if (scale !== undefined) this.setResolutionScale(scale);
  }

  // ─── Post-processing ─────────────────────────────────────────────────────

  enablePostProcessing(_viewId?: string): PostProcessing | undefined {
    if (this.usePostProcessing && this.composer) return this.composer;

    this.usePostProcessing = true;
    this.composer = new (THREE as any).PostProcessing(this.renderer) as PostProcessing;

    const cam = this.getActiveCamera();
    if (this.scene && cam) {
      this.composer.outputNode = pass(this.scene, cam);
    }

    CoreLogger.info(this.logPrefix, 'Node-based post-processing enabled.');
    return this.composer;
  }

  disablePostProcessing(_viewId?: string): void {
    this.usePostProcessing = false;
    if (this.composer) {
      deferredDispose(this.composer);
      this.composer = undefined;
    }
  }

  getComposer(_viewId?: string): PostProcessing | undefined {
    return this.composer;
  }

  // ─── Abstract hook implementations ───────────────────────────────────────

  protected get logPrefix(): string {
    return 'ThreeRenderer';
  }

  protected getOverlayContainers(): HTMLElement[] {
    return this.container ? [this.container] : [];
  }

  protected applyResolutionForAllViews(): void {
    this.applyResolutionScale();
  }

  protected async reinitializeAllRenderers(): Promise<void> {
    if (!this.container) return;
    this.renderer.domElement.remove();
    this.renderer.dispose();
    await this.initializeRenderer();
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.container.appendChild(this.renderer.domElement);
    this.applyResolutionScale();
  }

  protected applyAllShadows(enabled: boolean, type: THREE.ShadowMapType): void {
    if (!this.renderer) return;
    this.renderer.shadowMap.enabled = enabled;
    if (enabled) this.renderer.shadowMap.type = type;
  }

  protected async warmupGPU(sessionId: number, camera: THREE.Camera): Promise<void> {
    await this.renderer.compileAsync(this.scene, camera);
    if (sessionId !== this.currentLoadingSessionId) return;

    for (let i = 0; i < 2; i++) {
      this.renderer.render(this.scene, camera);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (sessionId !== this.currentLoadingSessionId) return;
    }

    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }

  protected afterSceneSetup(): void {
    // Nothing extra needed for single-canvas renderer.
  }

  protected teardownViewComposers(): void {
    if (this.composer) {
      deferredDispose(this.composer);
      this.composer = undefined;
      this.renderPass = undefined;
      this.usePostProcessing = false;
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private async initializeRenderer(): Promise<void> {
    this.renderer = new (THREE as any).WebGPURenderer({ antialias: this.antialias }) as WebGPURenderer;
    await this.renderer.init();

    this.renderer.shadowMap.enabled = this.shadows;
    if (this.shadows) this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  private applyResolutionScale(): void {
    if (!this.renderer || !this.container) return;
    const rect = this.container.getBoundingClientRect();
    const w = Math.max(1, Math.floor(rect.width) || this.container.clientWidth);
    const h = Math.max(1, Math.floor(rect.height) || this.container.clientHeight);
    this.renderer.setSize(w, h, false);
    const ratio =
      this.resolutionPolicy === 'scale'
        ? (window.devicePixelRatio || 1) * this.resolutionScale
        : window.devicePixelRatio || 1;
    this.renderer.setPixelRatio(ratio);

    const cam = this.getActiveCamera();
    if (cam instanceof THREE.PerspectiveCamera) {
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    }
  }

  private buildDebugLayerMask(): number {
    let mask = (1 << 0) | (1 << GIZMO_LAYER);
    const flags = (this.activeIScene as any)?.debugFlags;
    if (flags) {
      mask |= flags.transform ? 1 << DEBUG_LAYERS.transforms : 0;
      mask |= flags.mesh ? 1 << DEBUG_LAYERS.mesh : 0;
      mask |= flags.collider ? 1 << DEBUG_LAYERS.colliders : 0;
      mask |= flags.camera ? 1 << DEBUG_LAYERS.cameras : 0;
    }
    return mask;
  }

  private warnMissingCamera(): void {
    if (!this.missingCameraWarned) {
      CoreLogger.warn(this.logPrefix, 'No active camera for current scene — skipping render frame.');
      this.missingCameraWarned = true;
    }
  }

  private clearRenderer(): void {
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.clear(true, true, true);
  }
}

export default ThreeRenderer;
