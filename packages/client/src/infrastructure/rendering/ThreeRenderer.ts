import * as THREE from 'three';
import type { IRenderingEngine } from '@client/domain/ports/IRenderingEngine';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';

export class ThreeRenderer implements IRenderingEngine {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private objects = new Map<string, ISceneObject>();

  init(container: HTMLElement): void {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // basic light
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    this.scene.add(light);
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

  renderFrame(): void {
    // update domain objects
    this.objects.forEach(o => o.update(16)); // TODO: inject real dt if needed
    this.renderer.render(this.scene, this.camera);
  }
}

export default ThreeRenderer;
