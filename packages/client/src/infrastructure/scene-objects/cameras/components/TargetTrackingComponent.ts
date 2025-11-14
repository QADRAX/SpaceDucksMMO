import * as THREE from 'three';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';
import { IInspectableCameraComponent } from './ICameraComponent';

export interface TargetTrackingComponentConfig {
  /** Object ID being tracked (for display purposes) */
  targetObjectId?: string | null;
}

/**
 * TargetTrackingComponent - Dynamically tracks a scene object's position.
 * 
 * This component allows the camera to follow a moving object by maintaining
 * a reference to the object's THREE.Object3D transform. The target position
 * is automatically updated each frame.
 * 
 * Works in combination with OrbitComponent or LookAtComponent to create
 * dynamic camera behaviors that follow objects.
 * 
 * Properties:
 * - tracking.targetObjectId: Display name of tracked object
 * 
 * @example
 * ```typescript
 * // Track a spaceship
 * const tracking = new TargetTrackingComponent({
 *   targetObjectId: 'spaceship-001'
 * });
 * 
 * // Set the transform reference (from scene)
 * const ship = scene.getObjectByName('spaceship-001');
 * tracking.setTargetTransform(ship);
 * 
 * // Combine with orbit to orbit around moving ship
 * camera
 *   .addComponent(tracking)
 *   .addComponent(new OrbitComponent({ distance: 20 }))
 *   .addComponent(new LookAtComponent());
 * 
 * // The OrbitComponent and LookAtComponent will read
 * // the updated target position from tracking
 * ```
 */
export class TargetTrackingComponent implements IInspectableCameraComponent {
  private targetObjectId: string | null;
  private targetTransform: THREE.Object3D | null = null;
  private lastPosition: THREE.Vector3 = new THREE.Vector3();
  
  // Components can read this to get the tracked position
  public trackedPosition: THREE.Vector3 = new THREE.Vector3();

  constructor(config: TargetTrackingComponentConfig = {}) {
    this.targetObjectId = config.targetObjectId ?? null;
  }

  initialize(camera: THREE.Camera, scene: THREE.Scene): void {
    // If we have a target transform, initialize tracked position
    if (this.targetTransform) {
      this.trackedPosition.copy(this.targetTransform.position);
      this.lastPosition.copy(this.targetTransform.position);
    }
  }

  update(deltaTime: number, camera: THREE.Camera): void {
    if (!this.targetTransform) return;

    // Update tracked position from transform
    this.trackedPosition.copy(this.targetTransform.position);
    this.lastPosition.copy(this.trackedPosition);
  }

  dispose(): void {
    this.targetTransform = null;
  }

  // ============================================
  // Public API
  // ============================================

  /**
   * Set the target object transform to track
   */
  setTargetTransform(transform: THREE.Object3D | null): void {
    this.targetTransform = transform;
    if (transform) {
      this.trackedPosition.copy(transform.position);
      this.lastPosition.copy(transform.position);
    }
  }

  /**
   * Get the target object transform
   */
  getTargetTransform(): THREE.Object3D | null {
    return this.targetTransform;
  }

  /**
   * Set target from a position and object ID
   */
  setTargetFromObject(position: THREE.Vector3, objectId: string): void {
    this.targetObjectId = objectId;
    this.trackedPosition.copy(position);
    this.lastPosition.copy(position);
  }

  /**
   * Get the current tracked position
   */
  getTrackedPosition(): THREE.Vector3 {
    return this.trackedPosition.clone();
  }

  /**
   * Get the target object ID
   */
  getTargetObjectId(): string | null {
    return this.targetObjectId;
  }

  /**
   * Check if actively tracking an object
   */
  isTracking(): boolean {
    return this.targetTransform !== null;
  }

  // ============================================
  // IInspectable Implementation
  // ============================================

  getInspectableProperties(): InspectableProperty[] {
    return [
      {
        name: 'tracking.targetObjectId',
        label: 'Target Object',
        type: 'string',
        value: this.targetObjectId || 'none',
        description: 'ID of object being tracked'
      },
      {
        name: 'tracking.isActive',
        label: 'Is Tracking',
        type: 'boolean',
        value: this.isTracking(),
        description: 'Whether actively tracking an object'
      },
      {
        name: 'tracking.positionX',
        label: 'Position X',
        type: 'number',
        value: this.trackedPosition.x,
        description: 'Current tracked X position (read-only)'
      },
      {
        name: 'tracking.positionY',
        label: 'Position Y',
        type: 'number',
        value: this.trackedPosition.y,
        description: 'Current tracked Y position (read-only)'
      },
      {
        name: 'tracking.positionZ',
        label: 'Position Z',
        type: 'number',
        value: this.trackedPosition.z,
        description: 'Current tracked Z position (read-only)'
      }
    ];
  }

  setProperty(name: string, value: any): void {
    switch (name) {
      case 'tracking.targetObjectId':
        this.targetObjectId = value === 'none' ? null : value;
        break;
      // Position properties are read-only
      // isActive is derived, not settable
    }
  }

  getProperty(name: string): any {
    switch (name) {
      case 'tracking.targetObjectId': return this.targetObjectId || 'none';
      case 'tracking.isActive': return this.isTracking();
      case 'tracking.positionX': return this.trackedPosition.x;
      case 'tracking.positionY': return this.trackedPosition.y;
      case 'tracking.positionZ': return this.trackedPosition.z;
      default: return undefined;
    }
  }
}
