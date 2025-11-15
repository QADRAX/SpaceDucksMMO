import * as THREE from 'three';
import type { IRenderingEngine } from '@client/domain/ports/IRenderingEngine';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import { FpsCounter } from '@client/infrastructure/ui/FpsCounter';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

export class ThreeRenderer implements IRenderingEngine {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private composer?: EffectComposer;
  private usePostProcessing = false;
  private objects = new Map<string, ISceneObject>();
  private container!: HTMLElement;
  private resolutionPolicy: 'auto' | 'scale' = 'auto';
  private resolutionScale = 1.0; // multiplier used when policy === 'scale'
  private onResizeBound = () => this.handleResize();
  private antialias = true;
  private shadows = true;
  private fpsCounter: FpsCounter;

  constructor() {
    this.fpsCounter = new FpsCounter();
  }

  init(container: HTMLElement): void {
    this.container = container;
    this.scene = new THREE.Scene();
    // No background color - let skybox handle it
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;

  this.renderer = new THREE.WebGLRenderer({ antialias: this.antialias });
  this.renderer.shadowMap.enabled = this.shadows;
  if (this.shadows) this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.applyResolutionScale();
    container.appendChild(this.renderer.domElement);

  // listen for window resize to keep internal buffer in sync with window size
  window.addEventListener('resize', this.onResizeBound);

    // No default lights - scenes handle their own lighting
    
    // Show FPS counter in development
    if (process.env.NODE_ENV === 'development') {
      this.fpsCounter.show();
    }
  }

  add(object: ISceneObject): void {
    this.objects.set(object.id, object);
    object.addTo(this.scene);
  }

  remove(id: string): void {
    const obj = this.objects.get(id);
    if (obj) {
      // First remove from Three.js scene (calls removeFrom which handles dispose)
      obj.removeFrom(this.scene);
      // Then remove from tracking map
      this.objects.delete(id);
      
      // Debug: Log scene children count
      console.log('[ThreeRenderer] Scene children after removal:', this.scene.children.length);
      console.log('[ThreeRenderer] Scene children types:', this.scene.children.map(c => c.type).join(', '));
    }
  }

  getScene(): THREE.Scene { return this.scene; }
  getCamera(): THREE.Camera { return this.camera; }

  /** Replace the active camera used for rendering. Accepts any THREE.Camera. */
  setCamera(camera: THREE.Camera): void {
    // Prefer to keep a PerspectiveCamera reference when possible
    if (camera instanceof THREE.PerspectiveCamera) {
      this.camera = camera;
    } else {
      // Fallback: try to keep the provided camera reference
      // (may affect applyResolutionScale behavior which expects PerspectiveCamera)
      // @ts-ignore
      this.camera = camera;
    }
    // Ensure aspect/projection matrix matches current container size
    this.applyResolutionScale();
  }

  /**
   * Apply a resolution scale factor to the WebGL renderer. This keeps the CSS size the same
   * but renders to a smaller/larger internal buffer for performance/quality tradeoff.
   */
  private applyResolutionScale() {
    if (!this.renderer || !this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    // Keep CSS size (false) so canvas stays layout-sized, but internal buffer scales
    this.renderer.setSize(w, h, false);
    const base = window.devicePixelRatio || 1;
    const ratio = this.resolutionPolicy === 'scale' ? base * this.resolutionScale : base;
    this.renderer.setPixelRatio(ratio);

    // update camera aspect as well
    if (this.camera && this.camera instanceof THREE.PerspectiveCamera) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  }

  /** Update resolution scale factor at runtime (e.g., after changing settings) */
  setResolutionScale(scale: number) {
    this.resolutionScale = Math.max(0.25, Math.min(4, scale));
    this.applyResolutionScale();
  }

  /** Set the resolution policy (auto or scale) and optional scale multiplier */
  setResolutionPolicy(policy: 'auto' | 'scale', scale?: number) {
    this.resolutionPolicy = policy;
    if (typeof scale === 'number') this.resolutionScale = Math.max(0.25, Math.min(4, scale));
    this.applyResolutionScale();
  }

  private handleResize() {
    this.applyResolutionScale();
  }

  /** Toggle antialias; requires recreating the renderer to take effect reliably */
  setAntialias(enabled: boolean) {
    if (this.antialias === enabled) return;
    this.antialias = enabled;
    if (!this.container) return;
    // dispose old renderer and recreate
    const canvas = this.renderer?.domElement;
    try { canvas?.remove(); } catch {}
    try { this.renderer?.dispose(); } catch {}
    this.renderer = new THREE.WebGLRenderer({ antialias: this.antialias });
    this.renderer.shadowMap.enabled = this.shadows;
    if (this.shadows) this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
    this.applyResolutionScale();
  }

  /** Toggle shadows at renderer level; scene objects also need cast/receive flags separately */
  setShadows(enabled: boolean, type: THREE.ShadowMapType = THREE.PCFSoftShadowMap) {
    this.shadows = enabled;
    if (!this.renderer) return;
    this.renderer.shadowMap.enabled = enabled;
    if (enabled) this.renderer.shadowMap.type = type;
  }

  renderFrame(): void {
    // Objects are updated by SceneService loop, not here
    if (this.usePostProcessing && this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
    
    // Update FPS counter
    this.fpsCounter.update();
  }

  /**
   * Toggle FPS counter visibility
   */
  toggleFpsCounter(): void {
    this.fpsCounter.toggle();
  }

  /**
   * Show FPS counter
   */
  showFpsCounter(): void {
    this.fpsCounter.show();
  }

  /**
   * Hide FPS counter
   */
  hideFpsCounter(): void {
    this.fpsCounter.hide();
  }

  /**
   * Get current FPS value
   */
  getFps(): number {
    return this.fpsCounter.getFps();
  }

  /**
   * Enable post-processing with EffectComposer
   * Returns the composer so passes can be added
   */
  enablePostProcessing(): EffectComposer {
    if (!this.composer) {
      this.composer = new EffectComposer(this.renderer);
      const renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(renderPass);
    }
    this.usePostProcessing = true;
    return this.composer;
  }

  /**
   * Disable post-processing (use direct rendering)
   */
  disablePostProcessing(): void {
    this.usePostProcessing = false;
  }

  /**
   * Get the effect composer (if enabled)
   */
  getComposer(): EffectComposer | undefined {
    return this.composer;
  }

  /**
   * Get the WebGL renderer instance
   */
  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }
}

export default ThreeRenderer;
