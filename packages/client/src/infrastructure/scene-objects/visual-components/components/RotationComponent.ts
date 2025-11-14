import type { IInspectableComponent } from './IVisualComponent';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';
import * as THREE from 'three';

/**
 * Configuration for rotation animation
 */
export interface RotationComponentConfig {
  speed: number; // radians per second
  axis?: THREE.Vector3; // default is Y axis
}

/**
 * Component that handles continuous rotation of the parent mesh.
 */
export class RotationComponent implements IInspectableComponent {
  private config: Required<RotationComponentConfig>;
  private parentMesh?: THREE.Mesh;

  constructor(config: RotationComponentConfig) {
    this.config = {
      speed: config.speed,
      axis: config.axis ?? new THREE.Vector3(0, 1, 0),
    };
  }

  initialize(scene: THREE.Scene, parentMesh: THREE.Mesh): void {
    this.parentMesh = parentMesh;
  }

  update(deltaTime: number): void {
    if (!this.parentMesh) return;

    const rotationDelta = this.config.speed * (deltaTime / 1000);
    
    // Rotate around the configured axis
    if (this.config.axis.y === 1) {
      this.parentMesh.rotation.y += rotationDelta;
    } else if (this.config.axis.x === 1) {
      this.parentMesh.rotation.x += rotationDelta;
    } else if (this.config.axis.z === 1) {
      this.parentMesh.rotation.z += rotationDelta;
    }
  }

  dispose(scene: THREE.Scene): void {
    // No resources to dispose
  }

  // ============================================
  // IInspectableComponent Implementation
  // ============================================

  getInspectableProperties(): InspectableProperty[] {
    return [
      {
        name: 'rotation.speed',
        label: 'Rotation Speed',
        type: 'number',
        value: this.config.speed,
        min: -0.01,
        max: 0.01,
        step: 0.0001,
        description: 'Speed of self-rotation'
      }
    ];
  }

  setProperty(name: string, value: any): void {
    const propName = name.split('.')[1];
    
    if (propName === 'speed') {
      this.config.speed = value;
    }
  }

  getProperty(name: string): any {
    const propName = name.split('.')[1];
    
    if (propName === 'speed') return this.config.speed;
    
    return undefined;
  }

  /**
   * Change rotation speed at runtime
   * @deprecated Use setProperty instead
   */
  setSpeed(speed: number): void {
    this.config.speed = speed;
  }
}
