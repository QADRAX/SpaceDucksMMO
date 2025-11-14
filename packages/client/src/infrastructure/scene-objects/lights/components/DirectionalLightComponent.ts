import * as THREE from 'three';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';
import { IInspectableLightComponent } from './ILightComponent';

export interface DirectionalLightComponentConfig {
  /** Light color */
  color?: number;
  /** Light intensity */
  intensity?: number;
  /** Light position */
  position?: [number, number, number];
  /** Cast shadows */
  castShadow?: boolean;
}

/**
 * DirectionalLightComponent - Provides parallel rays of light (like sun).
 * 
 * Directional light illuminates from a specific direction, useful for
 * simulating sunlight or moonlight. Can cast shadows.
 * 
 * Properties:
 * - directional.color: Light color (hex)
 * - directional.intensity: Light intensity (0-2)
 * - directional.position: Light position (X, Y, Z)
 * - directional.castShadow: Enable shadow casting
 */
export class DirectionalLightComponent implements IInspectableLightComponent {
  private light: THREE.DirectionalLight | null = null;
  private color: number;
  private intensity: number;
  private position: THREE.Vector3;
  private castShadow: boolean;

  constructor(config: DirectionalLightComponentConfig = {}) {
    this.color = config.color ?? 0xffffff;
    this.intensity = config.intensity ?? 0.7;
    this.position = new THREE.Vector3(
      config.position?.[0] ?? 5,
      config.position?.[1] ?? 10,
      config.position?.[2] ?? 5
    );
    this.castShadow = config.castShadow ?? true;
  }

  initialize(scene: THREE.Scene, container: THREE.Object3D): void {
    this.light = new THREE.DirectionalLight(this.color, this.intensity);
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

  getLight(): THREE.DirectionalLight | null {
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
        name: 'directional.color',
        label: 'Color',
        type: 'color',
        value: '#' + (this.light?.color.getHexString() || this.color.toString(16).padStart(6, '0')),
        description: 'Directional light color'
      },
      {
        name: 'directional.intensity',
        label: 'Intensity',
        type: 'number',
        value: this.intensity,
        min: 0,
        max: 2,
        step: 0.1,
        description: 'Directional light intensity'
      },
      {
        name: 'directional.position.x',
        label: 'Position X',
        type: 'number',
        value: this.position.x,
        min: -50,
        max: 50,
        step: 0.5,
        description: 'Light X position'
      },
      {
        name: 'directional.position.y',
        label: 'Position Y',
        type: 'number',
        value: this.position.y,
        min: -50,
        max: 50,
        step: 0.5,
        description: 'Light Y position'
      },
      {
        name: 'directional.position.z',
        label: 'Position Z',
        type: 'number',
        value: this.position.z,
        min: -50,
        max: 50,
        step: 0.5,
        description: 'Light Z position'
      },
      {
        name: 'directional.castShadow',
        label: 'Cast Shadow',
        type: 'boolean',
        value: this.castShadow,
        description: 'Enable shadow casting'
      }
    ];
  }

  setProperty(name: string, value: any): void {
    switch (name) {
      case 'directional.color':
        this.color = parseInt(value.replace('#', ''), 16);
        if (this.light) this.light.color.setHex(this.color);
        break;
      case 'directional.intensity':
        this.intensity = value;
        if (this.light) this.light.intensity = this.intensity;
        break;
      case 'directional.position.x':
        this.position.x = value;
        if (this.light) this.light.position.copy(this.position);
        break;
      case 'directional.position.y':
        this.position.y = value;
        if (this.light) this.light.position.copy(this.position);
        break;
      case 'directional.position.z':
        this.position.z = value;
        if (this.light) this.light.position.copy(this.position);
        break;
      case 'directional.castShadow':
        this.castShadow = value;
        if (this.light) this.light.castShadow = this.castShadow;
        break;
    }
  }

  getProperty(name: string): any {
    switch (name) {
      case 'directional.color':
        return '#' + (this.light?.color.getHexString() || this.color.toString(16).padStart(6, '0'));
      case 'directional.intensity':
        return this.intensity;
      case 'directional.position.x':
        return this.position.x;
      case 'directional.position.y':
        return this.position.y;
      case 'directional.position.z':
        return this.position.z;
      case 'directional.castShadow':
        return this.castShadow;
      default:
        return undefined;
    }
  }
}
