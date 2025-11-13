import * as THREE from 'three';
import { BaseController } from '../BaseController';
import type { IParametricController, ControlParameter } from '@client/domain/scene/ISceneController';

export interface OrbitCameraConfig {
  camera: THREE.Camera;
  target?: THREE.Vector3;
  distance?: number;
  speed?: number;
  height?: number;
  autoRotate?: boolean;
}

/**
 * Orbits camera around a target point.
 * Useful for inspecting objects, menu backgrounds, showcase scenes.
 * 
 * @example
 * ```ts
 * const controller = new OrbitCameraController('orbit-sun', camera, {
 *   target: new THREE.Vector3(0, 0, 0),
 *   distance: 10,
 *   speed: 0.0003,
 *   autoRotate: true
 * });
 * 
 * scene.addController(controller);
 * controller.enable();
 * 
 * // Control from UI
 * controller.setParameter('speed', 0.001);
 * controller.setParameter('distance', 15);
 * ```
 */
export class OrbitCameraController extends BaseController implements IParametricController {
  readonly id: string;
  readonly name = 'Orbit Camera';

  private camera: THREE.Camera;
  private target: THREE.Vector3;
  private distance: number;
  private speed: number;
  private height: number;
  private autoRotate: boolean;
  private angle: number = 0;

  constructor(id: string, camera: THREE.Camera, config: Omit<OrbitCameraConfig, 'camera'> = {}) {
    super();
    this.id = id;
    this.camera = camera;
    this.target = config.target?.clone() || new THREE.Vector3(0, 0, 0);
    this.distance = config.distance ?? 10;
    this.speed = config.speed ?? 0.0003;
    this.height = config.height ?? 5;
    this.autoRotate = config.autoRotate ?? true;
  }

  protected onUpdate(dt: number): void {
    if (!this.autoRotate) return;

    // Increment angle
    this.angle += this.speed * dt;

    // Calculate new position
    const x = this.target.x + Math.cos(this.angle) * this.distance;
    const z = this.target.z + Math.sin(this.angle) * this.distance;

    this.camera.position.set(x, this.target.y + this.height, z);
    
    if (this.camera instanceof THREE.PerspectiveCamera || this.camera instanceof THREE.OrthographicCamera) {
      this.camera.lookAt(this.target);
    }
  }

  // Parametric Controller Interface
  
  getParameters(): ControlParameter[] {
    return [
      {
        name: 'distance',
        label: 'Orbit Distance',
        type: 'number',
        min: 1,
        max: 50,
        step: 0.5,
        defaultValue: 10,
        description: 'Distance from target'
      },
      {
        name: 'speed',
        label: 'Rotation Speed',
        type: 'number',
        min: 0,
        max: 0.002,
        step: 0.0001,
        defaultValue: 0.0003,
        description: 'Orbit speed (radians per ms)'
      },
      {
        name: 'height',
        label: 'Camera Height',
        type: 'number',
        min: -10,
        max: 20,
        step: 0.5,
        defaultValue: 5,
        description: 'Height offset from target'
      },
      {
        name: 'autoRotate',
        label: 'Auto Rotate',
        type: 'boolean',
        defaultValue: true,
        description: 'Automatically orbit around target'
      }
    ];
  }

  setParameter(name: string, value: any): void {
    switch (name) {
      case 'distance':
        this.distance = Number(value);
        break;
      case 'speed':
        this.speed = Number(value);
        break;
      case 'height':
        this.height = Number(value);
        break;
      case 'autoRotate':
        this.autoRotate = Boolean(value);
        break;
    }
  }

  getParameter(name: string): any {
    switch (name) {
      case 'distance': return this.distance;
      case 'speed': return this.speed;
      case 'height': return this.height;
      case 'autoRotate': return this.autoRotate;
      default: return undefined;
    }
  }

  // Public API for programmatic control

  setTarget(target: THREE.Vector3): void {
    this.target.copy(target);
  }

  setDistance(distance: number): void {
    this.distance = distance;
  }

  setSpeed(speed: number): void {
    this.speed = speed;
  }

  setAutoRotate(enabled: boolean): void {
    this.autoRotate = enabled;
  }

  /**
   * Snap to specific angle (in radians)
   */
  setAngle(angle: number): void {
    this.angle = angle;
  }
}

export default OrbitCameraController;
