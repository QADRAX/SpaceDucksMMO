import * as THREE from 'three';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';

/**
 * Axes Helper as ISceneObject
 * Shows RGB axes (Red=X, Green=Y, Blue=Z)
 */
export class AxesHelperObject implements ISceneObject {
  readonly id: string;
  private axesHelper: THREE.AxesHelper;

  constructor(id: string, size: number = 5) {
    this.id = id;
    this.axesHelper = new THREE.AxesHelper(size);
  }

  addTo(scene: THREE.Scene): void {
    scene.add(this.axesHelper);
  }

  removeFrom(scene: THREE.Scene): void {
    scene.remove(this.axesHelper);
  }

  update(_dt: number): void {
    // Static object, no updates needed
  }

  dispose(): void {
    this.axesHelper.dispose();
  }
}
