import * as THREE from "three";
import type { IRenderingEngine } from "@client/domain/ports/IRenderingEngine";
import type IScene from "@client/domain/ports/IScene";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import type { FpsController } from "@client/infrastructure/ui/dev/FpsController";

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
  private activeIScene: IScene | null = null;
  private antialias = true;
  private shadows = true;
  private missingCameraWarned = false;
  private fpsController: FpsController;

  constructor(fpsController: FpsController) {
    this.fpsController = fpsController;
  }

  init(container: HTMLElement): void {
    this.container = container;
    this.scene = new THREE.Scene();
    this.initializeRenderer();
    this.applyResolutionScale();
    container.appendChild(this.renderer.domElement);
    window.addEventListener("resize", () => this.handleResize());
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
      } catch {}
      for (const c of obj.children) stack.push(c);
    }
    return null;
  }

  private applyResolutionScale(): void {
    if (!this.renderer || !this.container) return;
    const { clientWidth: w, clientHeight: h } = this.container;
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

    if (this.usePostProcessing && this.composer) {
      this.updateComposerCamera(cam);
      this.composer.render();
    } else {
      this.renderer.render(this.scene, cam);
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
    this.applyResolutionScale();
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
