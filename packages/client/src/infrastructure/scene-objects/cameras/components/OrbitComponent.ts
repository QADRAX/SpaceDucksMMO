import * as THREE from 'three';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';
import { IInspectableCameraComponent } from './ICameraComponent';

export interface OrbitComponentConfig {
  /** Target position to orbit around */
  target?: THREE.Vector3;
  /** Distance from target (radius of orbit circle) */
  distance?: number;
  /** Height above target (Y offset) */
  height?: number;
  /** Rotation speed (radians per second) */
  speed?: number;
  /** Starting angle (radians) */
  startAngle?: number;
  /** Enable automatic rotation */
  autoRotate?: boolean;
}

/**
 * OrbitComponent - Makes camera orbit in a circle around a target point.
 * 
 * The camera moves in a circular path on the XZ plane at a specified height,
 * always maintaining distance from the target. Useful for showcasing objects,
 * planetary views, or automated camera tours.
 * 
 * Properties:
 * - orbit.targetX/Y/Z: Center point of orbit
 * - orbit.distance: Radius of orbit circle
 * - orbit.height: Y offset above target
 * - orbit.speed: Rotation speed (radians/sec)
 * - orbit.autoRotate: Enable/disable rotation
 * 
 * @example
 * ```typescript
 * const orbit = new OrbitComponent({
 *   target: new THREE.Vector3(0, 0, 0),
 *   distance: 15,
 *   height: 5,
 *   speed: 0.001,
 *   autoRotate: true
 * });
 * 
 * camera.addComponent(orbit);
 * ```
 */
export class OrbitComponent implements IInspectableCameraComponent {
  private target: THREE.Vector3;
  private distance: number;
  private height: number;
  private speed: number;
  private angle: number;
  private autoRotate: boolean;

  constructor(config: OrbitComponentConfig = {}) {
    this.target = config.target?.clone() || new THREE.Vector3(0, 0, 0);
    this.distance = config.distance ?? 15;
    this.height = config.height ?? 5;
    this.speed = config.speed ?? 0.001;
    this.angle = config.startAngle ?? 0;
    this.autoRotate = config.autoRotate ?? true;
  }

  initialize(camera: THREE.Camera, scene: THREE.Scene): void {
    // Position camera at starting angle
    this.updateCameraPosition(camera);
  }

  update(deltaTime: number, camera: THREE.Camera): void {
    if (!this.autoRotate) return;

    // Increment angle based on speed and delta time
    this.angle += this.speed * deltaTime;

    // Update camera position
    this.updateCameraPosition(camera);
  }

  dispose(): void {
    // No resources to cleanup
  }

  /**
   * Update camera position based on current angle
   */
  private updateCameraPosition(camera: THREE.Camera): void {
    const x = this.target.x + Math.cos(this.angle) * this.distance;
    const z = this.target.z + Math.sin(this.angle) * this.distance;
    const y = this.target.y + this.height;

    camera.position.set(x, y, z);
  }

  // ============================================
  // Public API
  // ============================================

  /**
   * Set the orbit target position
   */
  setTarget(x: number, y: number, z: number): void {
    this.target.set(x, y, z);
  }

  /**
   * Get the current orbit target
   */
  getTarget(): THREE.Vector3 {
    return this.target.clone();
  }

  /**
   * Set orbit parameters
   */
  setOrbitParams(distance: number, height: number, speed: number): void {
    this.distance = distance;
    this.height = height;
    this.speed = speed;
  }

  /**
   * Set the current orbit angle
   */
  setAngle(angle: number): void {
    this.angle = angle;
  }

  /**
   * Get the current orbit angle
   */
  getAngle(): number {
    return this.angle;
  }

  // ============================================
  // IInspectable Implementation
  // ============================================

  getInspectableProperties(): InspectableProperty[] {
    return [
      {
        name: 'orbit.targetX',
        label: 'Target X',
        type: 'number',
        value: this.target.x,
        step: 0.5,
        description: 'X position of orbit center'
      },
      {
        name: 'orbit.targetY',
        label: 'Target Y',
        type: 'number',
        value: this.target.y,
        step: 0.5,
        description: 'Y position of orbit center'
      },
      {
        name: 'orbit.targetZ',
        label: 'Target Z',
        type: 'number',
        value: this.target.z,
        step: 0.5,
        description: 'Z position of orbit center'
      },
      {
        name: 'orbit.distance',
        label: 'Distance',
        type: 'number',
        value: this.distance,
        min: 1,
        max: 100,
        step: 0.5,
        description: 'Distance from orbit target (radius)'
      },
      {
        name: 'orbit.height',
        label: 'Height',
        type: 'number',
        value: this.height,
        min: -50,
        max: 50,
        step: 0.5,
        description: 'Height above orbit target'
      },
      {
        name: 'orbit.speed',
        label: 'Speed',
        type: 'number',
        value: this.speed,
        min: 0,
        max: 0.01,
        step: 0.0001,
        description: 'Rotation speed (radians/sec)'
      },
      {
        name: 'orbit.autoRotate',
        label: 'Auto Rotate',
        type: 'boolean',
        value: this.autoRotate,
        description: 'Automatically rotate around target'
      }
    ];
  }

  setProperty(name: string, value: any): void {
    switch (name) {
      case 'orbit.targetX':
        this.target.x = value;
        break;
      case 'orbit.targetY':
        this.target.y = value;
        break;
      case 'orbit.targetZ':
        this.target.z = value;
        break;
      case 'orbit.distance':
        this.distance = value;
        break;
      case 'orbit.height':
        this.height = value;
        break;
      case 'orbit.speed':
        this.speed = value;
        break;
      case 'orbit.autoRotate':
        this.autoRotate = value;
        break;
    }
  }

  getProperty(name: string): any {
    switch (name) {
      case 'orbit.targetX': return this.target.x;
      case 'orbit.targetY': return this.target.y;
      case 'orbit.targetZ': return this.target.z;
      case 'orbit.distance': return this.distance;
      case 'orbit.height': return this.height;
      case 'orbit.speed': return this.speed;
      case 'orbit.autoRotate': return this.autoRotate;
      default: return undefined;
    }
  }
}
