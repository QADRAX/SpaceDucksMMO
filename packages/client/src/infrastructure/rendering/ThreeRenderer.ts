import * as THREE from 'three';
import type { IRenderingEngine } from '@client/domain/ports/IRenderingEngine';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';

export class ThreeRenderer implements IRenderingEngine {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private objects = new Map<string, ISceneObject>();
  private container!: HTMLElement;
  private resolutionPolicy: 'auto' | 'scale' = 'auto';
  private resolutionScale = 1.0; // multiplier used when policy === 'scale'
  private onResizeBound = () => this.handleResize();
  private antialias = true;
  private shadows = true;

  init(container: HTMLElement): void {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0e14); // Dark space background
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
  }

  add(object: ISceneObject): void {
    this.objects.set(object.id, object);
    object.addTo(this.scene);
  }

  remove(id: string): void {
    const obj = this.objects.get(id);
    if (obj && obj.dispose) obj.dispose();
    this.objects.delete(id);
  }

  getScene(): THREE.Scene { return this.scene; }
  getCamera(): THREE.Camera { return this.camera; }

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
    this.renderer.render(this.scene, this.camera);
  }
}

export default ThreeRenderer;
