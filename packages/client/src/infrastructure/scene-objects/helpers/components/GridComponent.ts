import * as THREE from 'three';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';
import { IInspectableComponent } from '../../visual-components/components/IVisualComponent';

export interface GridComponentConfig {
  /** Size of the grid */
  size?: number;
  /** Number of divisions */
  divisions?: number;
  /** Color of center line */
  colorCenterLine?: number;
  /** Color of grid lines */
  colorGrid?: number;
}

/**
 * GridComponent - Renders a grid on the XZ plane for spatial reference.
 * 
 * Useful for understanding scale and positioning in 3D space.
 * 
 * Properties:
 * - grid.size: Size of the grid
 * - grid.divisions: Number of divisions
 * - grid.colorCenterLine: Center line color
 * - grid.colorGrid: Grid line color
 */
export class GridComponent implements IInspectableComponent {
  private gridHelper: THREE.GridHelper | null = null;
  private size: number;
  private divisions: number;
  private colorCenterLine: number;
  private colorGrid: number;

  constructor(config: GridComponentConfig = {}) {
    this.size = config.size ?? 20;
    this.divisions = config.divisions ?? 20;
    this.colorCenterLine = config.colorCenterLine ?? 0x444444;
    this.colorGrid = config.colorGrid ?? 0x222222;
  }

  initialize(scene: THREE.Scene, parentMesh: THREE.Mesh | THREE.Object3D): void {
    this.gridHelper = new THREE.GridHelper(
      this.size,
      this.divisions,
      this.colorCenterLine,
      this.colorGrid
    );
    parentMesh.add(this.gridHelper);
  }

  update(deltaTime: number): void {
    // Static helper, no updates needed
  }

  dispose(scene: THREE.Scene): void {
    if (this.gridHelper) {
      this.gridHelper.dispose();
      this.gridHelper = null;
    }
  }

  // ============================================
  // IInspectable Implementation
  // ============================================

  getInspectableProperties(): InspectableProperty[] {
    return [
      {
        name: 'grid.size',
        label: 'Size',
        type: 'number',
        value: this.size,
        min: 1,
        max: 100,
        step: 1,
        description: 'Size of the grid'
      },
      {
        name: 'grid.divisions',
        label: 'Divisions',
        type: 'number',
        value: this.divisions,
        min: 2,
        max: 100,
        step: 1,
        description: 'Number of grid divisions'
      }
    ];
  }

  setProperty(name: string, value: any): void {
    switch (name) {
      case 'grid.size':
        this.size = value;
        this.recreateGrid();
        break;
      case 'grid.divisions':
        this.divisions = value;
        this.recreateGrid();
        break;
    }
  }

  getProperty(name: string): any {
    switch (name) {
      case 'grid.size': return this.size;
      case 'grid.divisions': return this.divisions;
      default: return undefined;
    }
  }

  // ============================================
  // Private Helpers
  // ============================================

  private recreateGrid(): void {
    if (!this.gridHelper) return;

    const parent = this.gridHelper.parent;
    this.gridHelper.removeFromParent();
    this.gridHelper.dispose();

    this.gridHelper = new THREE.GridHelper(
      this.size,
      this.divisions,
      this.colorCenterLine,
      this.colorGrid
    );

    if (parent) {
      parent.add(this.gridHelper);
    }
  }
}
