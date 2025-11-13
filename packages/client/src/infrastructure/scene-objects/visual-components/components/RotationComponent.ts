import type { ICelestialComponent } from './ICelestialComponent';
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
export class RotationComponent implements ICelestialComponent {
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

  /**
   * Change rotation speed at runtime
   */
  setSpeed(speed: number): void {
    this.config.speed = speed;
  }
}
