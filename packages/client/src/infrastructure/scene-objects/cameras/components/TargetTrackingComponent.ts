import * as THREE from 'three';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';
import { IInspectableCameraComponent } from './ICameraComponent';

export interface TargetTrackingComponentConfig {
  /** Target object ID to track */
  targetObjectId?: string | null;
  /** Offset from target position (for aiming at a point relative to target) */
  offset?: THREE.Vector3;
  /** Smooth tracking factor (0 = instant, 1 = very smooth) */
  smoothing?: number;
}

/**
 * TargetTrackingComponent - Makes camera look at a moving target object.
 * 
 * This component tracks a scene object's position dynamically and makes
 * the camera always look at it, similar to LookAtComponent but for moving objects.
 * 
 * Supports offset for looking at a point relative to the target (useful for
 * aiming at the cockpit of a ship, or slightly above a character's head).
 * 
 * Mutually exclusive with LookAtComponent (both control camera direction).
 * Can be combined with OrbitComponent (which controls camera position).
 * 
 * Properties:
 * - tracking.targetObjectId: Object to track and look at
 * - tracking.offsetX/Y/Z: Offset from target center
 * - tracking.smoothing: Smooth tracking (0=instant, 1=very smooth)
 * 
 * @example
 * ```typescript
 * // Track a spaceship and look at its cockpit (offset up)
 * const tracking = new TargetTrackingComponent({
 *   targetObjectId: 'spaceship-001',
 *   offset: new THREE.Vector3(0, 2, 0), // Look 2 units above center
 *   smoothing: 0.1 // Smooth tracking
 * });
 * 
 * camera.addComponent(tracking);
 * 
 * // Combine with orbit to orbit around the moving ship while looking at it
 * camera.addComponent(new OrbitComponent({ distance: 20 }));
 * camera.addComponent(tracking);
 * ```
 */
export class TargetTrackingComponent implements IInspectableCameraComponent {
  private targetObjectId: string | null;
  private targetTransform: THREE.Object3D | null = null;
  
  // Offset from target position (for looking at a specific point relative to target)
  private offset: THREE.Vector3;
  
  // Smooth tracking factor (0 = instant, 1 = very smooth)
  private smoothing: number;
  
  // Current look-at position (smoothed)
  private currentLookAt: THREE.Vector3 = new THREE.Vector3();
  
  // Target look-at position (updated from transform + offset)
  private targetLookAt: THREE.Vector3 = new THREE.Vector3();

  constructor(config: TargetTrackingComponentConfig = {}) {
    this.targetObjectId = config.targetObjectId || null;
    this.offset = config.offset?.clone() || new THREE.Vector3(0, 0, 0);
    this.smoothing = config.smoothing ?? 0.1;
  }

  initialize(camera: THREE.Camera, scene: THREE.Scene): void {
    // If we have a target transform, initialize look-at position
    if (this.targetTransform) {
      this.targetLookAt.copy(this.targetTransform.position).add(this.offset);
      this.currentLookAt.copy(this.targetLookAt);
      camera.lookAt(this.currentLookAt);
    }
  }

  update(deltaTime: number, camera: THREE.Camera): void {
    if (!this.targetTransform) return;

    // Update target look-at position from transform + offset
    this.targetLookAt.copy(this.targetTransform.position).add(this.offset);
    
    // Apply smoothing (lerp between current and target)
    if (this.smoothing > 0) {
      // Smooth factor adjusted for deltaTime (clamped to avoid overshooting)
      const factor = Math.min(1.0, 1.0 - Math.pow(this.smoothing, deltaTime * 60));
      this.currentLookAt.lerp(this.targetLookAt, factor);
    } else {
      // No smoothing - instant tracking
      this.currentLookAt.copy(this.targetLookAt);
    }
    
    // Make camera look at the (possibly smoothed) position
    camera.lookAt(this.currentLookAt);
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
      this.targetLookAt.copy(transform.position).add(this.offset);
      this.currentLookAt.copy(this.targetLookAt);
    }
  }

  /**
   * Set the offset from target position
   */
  setOffset(offset: THREE.Vector3): void {
    this.offset.copy(offset);
  }

  /**
   * Get the current offset
   */
  getOffset(): THREE.Vector3 {
    return this.offset.clone();
  }

  /**
   * Set smoothing factor (0 = instant, 1 = very smooth)
   */
  setSmoothing(smoothing: number): void {
    this.smoothing = Math.max(0, Math.min(1, smoothing));
  }

  /**
   * Get the smoothing factor
   */
  getSmoothing(): number {
    return this.smoothing;
  }

  /**
   * Get the target object transform
   */
  getTargetTransform(): THREE.Object3D | null {
    return this.targetTransform;
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
  isTrackingObject(): boolean {
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
        type: 'select',
        value: this.targetObjectId || 'none',
        options: [],
        description: 'Object to track and look at'
      },
      {
        name: 'tracking.offsetX',
        label: 'Offset X',
        type: 'number',
        value: this.offset.x,
        step: 0.1,
        description: 'Horizontal offset from target center'
      },
      {
        name: 'tracking.offsetY',
        label: 'Offset Y',
        type: 'number',
        value: this.offset.y,
        step: 0.1,
        description: 'Vertical offset from target center'
      },
      {
        name: 'tracking.offsetZ',
        label: 'Offset Z',
        type: 'number',
        value: this.offset.z,
        step: 0.1,
        description: 'Depth offset from target center'
      },
      {
        name: 'tracking.smoothing',
        label: 'Smoothing',
        type: 'number',
        value: this.smoothing,
        min: 0,
        max: 1,
        step: 0.05,
        description: 'Smooth tracking (0=instant, 1=very smooth)'
      }
    ];
  }

  setProperty(name: string, value: any): void {
    switch (name) {
      case 'tracking.targetObjectId':
        this.targetObjectId = value === 'none' ? null : value;
        break;
      case 'tracking.offsetX':
        this.offset.x = value;
        break;
      case 'tracking.offsetY':
        this.offset.y = value;
        break;
      case 'tracking.offsetZ':
        this.offset.z = value;
        break;
      case 'tracking.smoothing':
        this.smoothing = Math.max(0, Math.min(1, value));
        break;
    }
  }

  getProperty(name: string): any {
    switch (name) {
      case 'tracking.targetObjectId': return this.targetObjectId || 'none';
      case 'tracking.offsetX': return this.offset.x;
      case 'tracking.offsetY': return this.offset.y;
      case 'tracking.offsetZ': return this.offset.z;
      case 'tracking.smoothing': return this.smoothing;
      default: return undefined;
    }
  }
}
