import * as THREE from "three";
import type { IRenderingEngine } from "@client/domain/ports/IRenderingEngine";
import type IScene from "@client/domain/ports/IScene";
import { FpsCounter } from "@client/infrastructure/ui/FpsCounter";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";

export class ThreeRenderer implements IRenderingEngine {
  private scene!: THREE.Scene;
  private renderer!: THREE.WebGLRenderer;
  private composer?: EffectComposer;
  private renderPass?: RenderPass;
  private usePostProcessing = false;
  private container!: HTMLElement;
  private resolutionPolicy: "auto" | "scale" = "auto";
  private resolutionScale = 1.0;
  private onResizeBound = () => this.handleResize();
  private rafId: number | null = null;
  private activeIScene: IScene | null = null;
  private antialias = true;
  private shadows = true;
  private fpsCounter: FpsCounter;
  private missingCameraWarned = false;

  constructor() {
    this.fpsCounter = new FpsCounter();
  }

  init(container: HTMLElement): void {
    this.container = container;
    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({ antialias: this.antialias });
    this.renderer.shadowMap.enabled = this.shadows;
    if (this.shadows) this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.applyResolutionScale();
    container.appendChild(this.renderer.domElement);

    window.addEventListener("resize", this.onResizeBound);
  }

  private getActiveCamera(): THREE.Camera | null {
    if (
      this.activeIScene &&
      typeof this.activeIScene.getActiveCamera === "function"
    ) {
      try {
        const cam = (this.activeIScene as any).getActiveCamera();
        return cam || null;
      } catch (err) {
        console.warn(
          "[ThreeRenderer] error calling scene.getActiveCamera():",
          err
        );
        return null;
      }
    }
    return null;
  }

  private applyResolutionScale() {
    if (!this.renderer || !this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h, false);
    const base = window.devicePixelRatio || 1;
    const ratio =
      this.resolutionPolicy === "scale" ? base * this.resolutionScale : base;
    this.renderer.setPixelRatio(ratio);

    const cam = this.getActiveCamera();
    if (cam && cam instanceof THREE.PerspectiveCamera) {
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    }
  }

  setResolutionScale(scale: number) {
    this.resolutionScale = Math.max(0.25, Math.min(4, scale));
    this.applyResolutionScale();
  }

  setResolutionPolicy(policy: "auto" | "scale", scale?: number) {
    this.resolutionPolicy = policy;
    if (typeof scale === "number")
      this.resolutionScale = Math.max(0.25, Math.min(4, scale));
    this.applyResolutionScale();
  }

  private handleResize() {
    this.applyResolutionScale();
  }

  setAntialias(enabled: boolean) {
    if (this.antialias === enabled) return;
    this.antialias = enabled;
    if (!this.container) return;
    const canvas = this.renderer?.domElement;
    try {
      canvas?.remove();
    } catch {}
    try {
      this.renderer?.dispose();
    } catch {}
    this.renderer = new THREE.WebGLRenderer({ antialias: this.antialias });
    this.renderer.shadowMap.enabled = this.shadows;
    if (this.shadows) this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
    this.applyResolutionScale();
  }

  setShadows(enabled: boolean, type: any = THREE.PCFSoftShadowMap) {
    this.shadows = enabled;
    if (!this.renderer) return;
    this.renderer.shadowMap.enabled = enabled;
    if (enabled) this.renderer.shadowMap.type = type;
  }

  renderFrame(): void {
    const cam = this.getActiveCamera();
    if (!cam) {
      if (!this.missingCameraWarned) {
        console.warn(
          "[ThreeRenderer] No active camera for current scene — skipping render frame."
        );
        this.missingCameraWarned = true;
      }
      try {
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.clear(true, true, true);
      } catch (e) {
        // ignore render-clear errors
      }
      this.fpsCounter.update();
      return;
    }

    this.missingCameraWarned = false;

    if (this.usePostProcessing && this.composer) {
      if (this.renderPass && (this.renderPass as any).camera !== cam) {
        try {
          (this.renderPass as any).camera = cam;
        } catch (e) {}
      }
      this.composer.render();
    } else {
      this.renderer.render(this.scene, cam);
    }

    this.fpsCounter.update();
  }

  toggleFpsCounter(): void {
    this.fpsCounter.toggle();
  }
  showFpsCounter(): void {
    this.fpsCounter.show();
  }
  hideFpsCounter(): void {
    this.fpsCounter.hide();
  }
  getFps(): number {
    return this.fpsCounter.getFps();
  }

  enablePostProcessing(): EffectComposer {
    if (!this.composer) {
      const cam = this.getActiveCamera();
      if (!cam)
        throw new Error(
          "Cannot enable post-processing: no active camera provided by the scene."
        );
      this.composer = new EffectComposer(this.renderer);
      const renderPass = new RenderPass(this.scene, cam as any);
      this.renderPass = renderPass;
      this.composer.addPass(renderPass);
    }
    this.usePostProcessing = true;
    return this.composer;
  }

  onActiveCameraChanged(): void {
    const camera = this.getActiveCamera();
    if (camera) this.missingCameraWarned = false;
    if (this.renderPass) {
      try {
        (this.renderPass as any).camera = camera;
      } catch (e) {}
    }
    if (camera && camera instanceof THREE.PerspectiveCamera) {
      const w = this.container?.clientWidth || window.innerWidth;
      const h = this.container?.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    if (process.env.NODE_ENV === 'development') {
      try {
        if (camera) this.fpsCounter.show(); else this.fpsCounter.hide();
      } catch (e) {
      }
    }
  }

  disablePostProcessing(): void {
    this.usePostProcessing = false;
  }
  
  getComposer(): EffectComposer | undefined {
    return this.composer;
  }

  start(): void {
    if (this.rafId != null) return;
    let lastTime = performance.now();
    const loop = (t: number) => {
      lastTime = t;
      try {
        this.renderFrame();
      } catch (err) {
        console.error("[ThreeRenderer] fatal loop error", err);
        this.stop();
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  stop(): void {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  setScene(scene: IScene): void {
    try {
      // Call teardown on the previous scene so it can cleanup its state
      const previous = this.activeIScene;
      if (previous && typeof previous.teardown === 'function') {
        try {
          previous.teardown(this, this.scene);
        } catch (e) {
          console.warn('[ThreeRenderer] error during previous scene.teardown()', e);
        }
      }

      // Remove any remaining children from the internal three scene
      // (scenes should have cleaned up during teardown, but ensure clean slate)
      while (this.scene.children.length > 0) {
        const c = this.scene.children[0];
        try { this.scene.remove(c); } catch (e) {}
      }

      // Reset post-processing/composer state to avoid rendering stale buffers
      if (this.composer) {
        try { (this.composer as any).dispose?.(); } catch (e) {}
        this.composer = undefined;
        this.renderPass = undefined;
        this.usePostProcessing = false;
      }

      // Set and initialize the new scene, injecting the THREE.Scene
      this.activeIScene = scene;
      scene.setup(this, this.scene);

      try { this.onActiveCameraChanged?.(); } catch (e) {}

      if (!this.getActiveCamera()) {
        console.warn('[ThreeRenderer] scene.setup did not register an active camera. Rendering will be skipped until a camera is provided.');
      }
    } catch (err) {
      console.error("[ThreeRenderer] Error while setting scene:", err);
    }
  }

  getActiveScene(): IScene | null {
    return this.activeIScene;
  }
}

export default ThreeRenderer;
