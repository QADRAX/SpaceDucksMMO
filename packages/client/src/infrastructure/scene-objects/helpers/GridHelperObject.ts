import * as THREE from 'three';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';

/**
 * Grid Helper as ISceneObject
 * Provides spatial reference on XZ plane
 */
export class GridHelperObject implements ISceneObject {
  readonly id: string;
  private gridHelper: THREE.GridHelper;

  constructor(
    id: string,
    size: number = 20,
    divisions: number = 20,
    colorCenterLine: number = 0x444444,
    colorGrid: number = 0x222222
  ) {
    this.id = id;
    this.gridHelper = new THREE.GridHelper(size, divisions, colorCenterLine, colorGrid);
  }

  addTo(scene: THREE.Scene): void {
    scene.add(this.gridHelper);
  }

  removeFrom(scene: THREE.Scene): void {
    scene.remove(this.gridHelper);
  }

  update(_dt: number): void {
    // Static object, no updates needed
  }

  dispose(): void {
    this.gridHelper.dispose();
  }
}
