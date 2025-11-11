import type IRenderingEngine from '@client/domain/ports/IRenderingEngine';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import * as THREE from 'three';

/** Simple cube object implementing ISceneObject */
class RotatingCube implements ISceneObject {
  id = 'cube';
  private mesh!: THREE.Mesh;
  addTo(scene: THREE.Scene): void {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    this.mesh = new THREE.Mesh(geometry, material);
    scene.add(this.mesh);
  }
  update(dt: number): void {
    if (!this.mesh) return;
    const delta = dt / 1000; // convert ms to seconds logically
    this.mesh.rotation.x += 1 * delta;
    this.mesh.rotation.y += 1 * delta;
  }
  dispose(): void {
    this.mesh?.geometry.dispose();
    (this.mesh?.material as THREE.Material).dispose();
  }
}

/**
 * Application service that orchestrates scene setup and animation loop.
 * Decoupled from concrete renderer implementation via IRenderingEngine.
 */
export class SceneService {
  private engine: IRenderingEngine;
  private objects: ISceneObject[] = [];
  private running = false;
  private frameHandle: number | null = null;
  private lastTime = performance.now();

  constructor(engine: IRenderingEngine) {
    this.engine = engine;
  }

  init(container: HTMLElement): void {
    this.engine.init(container);
    // Add domain objects
    const cube = new RotatingCube();
    this.objects.push(cube);
    this.engine.add(cube);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    const loop = () => {
      if (!this.running) return;
      const now = performance.now();
      const dt = now - this.lastTime;
      this.lastTime = now;
      // Update objects with real dt
      this.objects.forEach(o => o.update(dt));
      this.engine.renderFrame();
      this.frameHandle = requestAnimationFrame(loop);
    };
    loop();
  }

  stop(): void {
    this.running = false;
    if (this.frameHandle) cancelAnimationFrame(this.frameHandle);
    this.frameHandle = null;
  }
}

export default SceneService;
