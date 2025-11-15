import * as THREE from 'three';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';
import { IInspectableCameraComponent } from './ICameraComponent';

export interface LookAtComponentConfig {
  /** Target position to look at */
  target?: THREE.Vector3;
}

/**
 * LookAtComponent - Makes camera always look at a target point.
 * 
 * This component ensures the camera's orientation is always pointing toward
 * a specific position. Useful in combination with orbit, follow, or path components.
 * 
 * Properties:
 * - lookAt.targetX/Y/Z: Position to look at
 * 
 * @example
 * ```typescript
 * const lookAt = new LookAtComponent({
 *   target: new THREE.Vector3(0, 0, 0)
 * });
 * 
 * // Combine with orbit for automatic showcase
 * camera
 *   .addComponent(new OrbitComponent({ ... }))
 *   .addComponent(lookAt);
 * ```
 */
export class LookAtComponent implements IInspectableCameraComponent {
  private target: THREE.Vector3;
  private targetTransform: THREE.Object3D | null = null; // Reference to target object for dynamic tracking

  constructor(config: LookAtComponentConfig = {}) {
    this.target = config.target?.clone() || new THREE.Vector3(0, 0, 0);
  }

  initialize(camera: THREE.Camera, scene: THREE.Scene): void {
    // Look at target on initialization
    camera.lookAt(this.target);
  }

  update(deltaTime: number, camera: THREE.Camera): void {
    // Update target position from transform if tracking an object
    if (this.targetTransform) {
      this.target.copy(this.targetTransform.position);
    }
    
    // Update lookAt every frame (in case target changes)
    camera.lookAt(this.target);
  }

  dispose(): void {
    // No resources to cleanup
  }

  // ============================================
  // Public API
  // ============================================

  /**
   * Set the target object transform to track dynamically
   */
  setTargetTransform(transform: THREE.Object3D | null): void {
    this.targetTransform = transform;
    if (transform) {
      this.target.copy(transform.position);
    }
  }

  /**
   * Set the target position to look at
   */
  setTarget(x: number, y: number, z: number): void {
    this.target.set(x, y, z);
  }

  /**
   * Get the current target position
   */
  getTarget(): THREE.Vector3 {
    return this.target.clone();
  }

  // ============================================
  // IInspectable Implementation
  // ============================================

  getInspectableProperties(): InspectableProperty[] {
    return [
      {
        name: 'lookAt.targetX',
        label: 'Target X',
        type: 'number',
        value: this.target.x,
        step: 0.5,
        description: 'X position to look at'
      },
      {
        name: 'lookAt.targetY',
        label: 'Target Y',
        type: 'number',
        value: this.target.y,
        step: 0.5,
        description: 'Y position to look at'
      },
      {
        name: 'lookAt.targetZ',
        label: 'Target Z',
        type: 'number',
        value: this.target.z,
        step: 0.5,
        description: 'Z position to look at'
      }
    ];
  }

  setProperty(name: string, value: any): void {
    switch (name) {
      case 'lookAt.targetX':
        this.target.x = value;
        break;
      case 'lookAt.targetY':
        this.target.y = value;
        break;
      case 'lookAt.targetZ':
        this.target.z = value;
        break;
    }
  }

  getProperty(name: string): any {
    switch (name) {
      case 'lookAt.targetX': return this.target.x;
      case 'lookAt.targetY': return this.target.y;
      case 'lookAt.targetZ': return this.target.z;
      default: return undefined;
    }
  }
}
