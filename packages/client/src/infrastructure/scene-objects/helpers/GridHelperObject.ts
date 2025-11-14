import * as THREE from 'three';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';

/**
 * Grid Helper as ISceneObject
 * Provides spatial reference on XZ plane
 * 
 * @deprecated Use HelperBody with GridComponent instead.
 * 
 * For new code, use the component-based architecture:
 * 
 * @example
 * ```typescript
 * // Old (deprecated):
 * const grid = new GridHelperObject('grid', 20, 20);
 * 
 * // New (recommended):
 * import { HelperBuilder } from './builders';
 * const grid = HelperBuilder.createGrid('grid', { size: 20, divisions: 20 });
 * ```
 * 
 * @see HelperBody - Component container
 * @see GridComponent - Grid visualization
 * @see HelperBuilder - Convenient builders
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
