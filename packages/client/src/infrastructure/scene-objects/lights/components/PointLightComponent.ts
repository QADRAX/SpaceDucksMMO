import * as THREE from 'three';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';
import { IInspectableLightComponent } from './ILightComponent';

export interface PointLightComponentConfig {
  /** Light color */
  color?: number;
  /** Light intensity */
  intensity?: number;
  /** Light position */
  position?: [number, number, number];
  /** Maximum range of the light */
  distance?: number;
  /** Decay rate */
  decay?: number;
  /** Cast shadows */
  castShadow?: boolean;
}

/**
 * PointLightComponent - Emits light in all directions from a single point.
 * 
 * Point light illuminates in all directions like a light bulb.
 * Useful for torches, lamps, explosions, etc.
 * 
 * Properties:
 * - point.color: Light color (hex)
 * - point.intensity: Light intensity (0-10)
 * - point.position: Light position (X, Y, Z)
 * - point.distance: Maximum range
 * - point.decay: Light decay rate
 * - point.castShadow: Enable shadow casting
 */
export class PointLightComponent implements IInspectableLightComponent {
  private light: THREE.PointLight | null = null;
  private color: number;
  private intensity: number;
  private position: THREE.Vector3;
  private distance: number;
  private decay: number;
  private castShadow: boolean;

  constructor(config: PointLightComponentConfig = {}) {
    this.color = config.color ?? 0xffffff;
    this.intensity = config.intensity ?? 1.0;
    this.position = new THREE.Vector3(
      config.position?.[0] ?? 0,
      config.position?.[1] ?? 5,
      config.position?.[2] ?? 0
    );
    this.distance = config.distance ?? 0; // 0 = infinite
    this.decay = config.decay ?? 2; // Physically correct
    this.castShadow = config.castShadow ?? false;
  }

  initialize(scene: THREE.Scene, container: THREE.Object3D): void {
    this.light = new THREE.PointLight(this.color, this.intensity, this.distance, this.decay);
    this.light.position.copy(this.position);
    this.light.castShadow = this.castShadow;
    container.add(this.light);
  }

  update(deltaTime: number): void {
    // Static light, no updates needed
  }

  dispose(): void {
    if (this.light) {
      this.light.dispose();
      this.light = null;
    }
  }

  // ============================================
  // Public API
  // ============================================

  getLight(): THREE.PointLight | null {
    return this.light;
  }

  setPosition(x: number, y: number, z: number): void {
    this.position.set(x, y, z);
    if (this.light) this.light.position.copy(this.position);
  }

  // ============================================
  // IInspectable Implementation
  // ============================================

  getInspectableProperties(): InspectableProperty[] {
    return [
      {
        name: 'point.color',
        label: 'Color',
        type: 'color',
        value: '#' + (this.light?.color.getHexString() || this.color.toString(16).padStart(6, '0')),
        description: 'Point light color'
      },
      {
        name: 'point.intensity',
        label: 'Intensity',
        type: 'number',
        value: this.intensity,
        min: 0,
        max: 10,
        step: 0.1,
        description: 'Point light intensity'
      },
      {
        name: 'point.position.x',
        label: 'Position X',
        type: 'number',
        value: this.position.x,
        min: -50,
        max: 50,
        step: 0.5,
        description: 'Light X position'
      },
      {
        name: 'point.position.y',
        label: 'Position Y',
        type: 'number',
        value: this.position.y,
        min: -50,
        max: 50,
        step: 0.5,
        description: 'Light Y position'
      },
      {
        name: 'point.position.z',
        label: 'Position Z',
        type: 'number',
        value: this.position.z,
        min: -50,
        max: 50,
        step: 0.5,
        description: 'Light Z position'
      },
      {
        name: 'point.distance',
        label: 'Distance',
        type: 'number',
        value: this.distance,
        min: 0,
        max: 100,
        step: 1,
        description: 'Maximum range (0 = infinite)'
      },
      {
        name: 'point.decay',
        label: 'Decay',
        type: 'number',
        value: this.decay,
        min: 0,
        max: 10,
        step: 0.1,
        description: 'Light decay rate'
      },
      {
        name: 'point.castShadow',
        label: 'Cast Shadow',
        type: 'boolean',
        value: this.castShadow,
        description: 'Enable shadow casting'
      }
    ];
  }

  setProperty(name: string, value: any): void {
    switch (name) {
      case 'point.color':
        this.color = parseInt(value.replace('#', ''), 16);
        if (this.light) this.light.color.setHex(this.color);
        break;
      case 'point.intensity':
        this.intensity = value;
        if (this.light) this.light.intensity = this.intensity;
        break;
      case 'point.position.x':
        this.position.x = value;
        if (this.light) this.light.position.copy(this.position);
        break;
      case 'point.position.y':
        this.position.y = value;
        if (this.light) this.light.position.copy(this.position);
        break;
      case 'point.position.z':
        this.position.z = value;
        if (this.light) this.light.position.copy(this.position);
        break;
      case 'point.distance':
        this.distance = value;
        if (this.light) this.light.distance = this.distance;
        break;
      case 'point.decay':
        this.decay = value;
        if (this.light) this.light.decay = this.decay;
        break;
      case 'point.castShadow':
        this.castShadow = value;
        if (this.light) this.light.castShadow = this.castShadow;
        break;
    }
  }

  getProperty(name: string): any {
    switch (name) {
      case 'point.color':
        return '#' + (this.light?.color.getHexString() || this.color.toString(16).padStart(6, '0'));
      case 'point.intensity':
        return this.intensity;
      case 'point.position.x':
        return this.position.x;
      case 'point.position.y':
        return this.position.y;
      case 'point.position.z':
        return this.position.z;
      case 'point.distance':
        return this.distance;
      case 'point.decay':
        return this.decay;
      case 'point.castShadow':
        return this.castShadow;
      default:
        return undefined;
    }
  }
}
