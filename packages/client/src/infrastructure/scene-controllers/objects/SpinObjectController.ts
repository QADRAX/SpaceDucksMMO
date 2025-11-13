import * as THREE from 'three';
import { BaseController } from '../BaseController';
import type { IParametricController, ControlParameter } from '@client/domain/scene/ISceneController';

export interface SpinObjectConfig {
  object: THREE.Object3D;
  axis?: 'x' | 'y' | 'z';
  speed?: number;
}

/**
 * Continuously rotates an object around an axis.
 * Useful for spinning planets, asteroids, UI elements, etc.
 * 
 * @example
 * ```ts
 * const controller = new SpinObjectController('spin-planet', planet.getObject3D(), {
 *   axis: 'y',
 *   speed: 0.001
 * });
 * 
 * scene.addController(controller);
 * controller.enable();
 * ```
 */
export class SpinObjectController extends BaseController implements IParametricController {
  readonly id: string;
  readonly name = 'Spin Object';

  private object: THREE.Object3D;
  private axis: 'x' | 'y' | 'z';
  private speed: number;

  constructor(id: string, object: THREE.Object3D, config: Omit<SpinObjectConfig, 'object'> = {}) {
    super();
    this.id = id;
    this.object = object;
    this.axis = config.axis ?? 'y';
    this.speed = config.speed ?? 0.001;
  }

  protected onUpdate(dt: number): void {
    const rotation = this.speed * dt;
    
    switch (this.axis) {
      case 'x':
        this.object.rotation.x += rotation;
        break;
      case 'y':
        this.object.rotation.y += rotation;
        break;
      case 'z':
        this.object.rotation.z += rotation;
        break;
    }
  }

  // Parametric Controller Interface

  getParameters(): ControlParameter[] {
    return [
      {
        name: 'speed',
        label: 'Rotation Speed',
        type: 'number',
        min: -0.005,
        max: 0.005,
        step: 0.0001,
        defaultValue: 0.001,
        description: 'Rotation speed (radians per ms)'
      },
      {
        name: 'axis',
        label: 'Rotation Axis',
        type: 'select',
        options: [
          { value: 'x', label: 'X Axis' },
          { value: 'y', label: 'Y Axis' },
          { value: 'z', label: 'Z Axis' }
        ],
        defaultValue: 'y',
        description: 'Axis of rotation'
      }
    ];
  }

  setParameter(name: string, value: any): void {
    switch (name) {
      case 'speed':
        this.speed = Number(value);
        break;
      case 'axis':
        this.axis = value as 'x' | 'y' | 'z';
        break;
    }
  }

  getParameter(name: string): any {
    switch (name) {
      case 'speed': return this.speed;
      case 'axis': return this.axis;
      default: return undefined;
    }
  }

  // Public API

  setSpeed(speed: number): void {
    this.speed = speed;
  }

  setAxis(axis: 'x' | 'y' | 'z'): void {
    this.axis = axis;
  }
}

export default SpinObjectController;
