import * as THREE from 'three';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';
import { IInspectableComponent } from '../../visual-components/components/IVisualComponent';

export interface AxesComponentConfig {
  /** Size of the axes */
  size?: number;
}

/**
 * AxesComponent - Renders RGB axes for orientation reference.
 * 
 * Red = X axis
 * Green = Y axis
 * Blue = Z axis
 * 
 * Properties:
 * - axes.size: Length of axis lines
 */
export class AxesComponent implements IInspectableComponent {
  private axesHelper: THREE.AxesHelper | null = null;
  private size: number;

  constructor(config: AxesComponentConfig = {}) {
    this.size = config.size ?? 5;
  }

  initialize(scene: THREE.Scene, parentMesh: THREE.Mesh | THREE.Object3D): void {
    this.axesHelper = new THREE.AxesHelper(this.size);
    parentMesh.add(this.axesHelper);
  }

  update(deltaTime: number): void {
    // Static helper, no updates needed
  }

  dispose(scene: THREE.Scene): void {
    if (this.axesHelper) {
      this.axesHelper.dispose();
      this.axesHelper = null;
    }
  }

  // ============================================
  // IInspectable Implementation
  // ============================================

  getInspectableProperties(): InspectableProperty[] {
    return [
      {
        name: 'axes.size',
        label: 'Size',
        type: 'number',
        value: this.size,
        min: 1,
        max: 50,
        step: 0.5,
        description: 'Length of axis lines'
      }
    ];
  }

  setProperty(name: string, value: any): void {
    if (name === 'axes.size') {
      this.size = value;
      this.recreateAxes();
    }
  }

  getProperty(name: string): any {
    if (name === 'axes.size') return this.size;
    return undefined;
  }

  // ============================================
  // Private Helpers
  // ============================================

  private recreateAxes(): void {
    if (!this.axesHelper) return;

    const parent = this.axesHelper.parent;
    this.axesHelper.removeFromParent();
    this.axesHelper.dispose();

    this.axesHelper = new THREE.AxesHelper(this.size);

    if (parent) {
      parent.add(this.axesHelper);
    }
  }
}
