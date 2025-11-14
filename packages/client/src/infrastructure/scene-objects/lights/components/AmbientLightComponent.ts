import * as THREE from 'three';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';
import { IInspectableLightComponent } from './ILightComponent';

export interface AmbientLightComponentConfig {
  /** Light color */
  color?: number;
  /** Light intensity */
  intensity?: number;
}

/**
 * AmbientLightComponent - Provides uniform lighting from all directions.
 * 
 * Ambient light illuminates all objects equally, without casting shadows.
 * Useful for base illumination and preventing completely dark areas.
 * 
 * Properties:
 * - ambient.color: Light color (hex)
 * - ambient.intensity: Light intensity (0-2)
 */
export class AmbientLightComponent implements IInspectableLightComponent {
  private light: THREE.AmbientLight | null = null;
  private color: number;
  private intensity: number;

  constructor(config: AmbientLightComponentConfig = {}) {
    this.color = config.color ?? 0xffffff;
    this.intensity = config.intensity ?? 0.3;
  }

  initialize(scene: THREE.Scene, container: THREE.Object3D): void {
    this.light = new THREE.AmbientLight(this.color, this.intensity);
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

  getLight(): THREE.AmbientLight | null {
    return this.light;
  }

  // ============================================
  // IInspectable Implementation
  // ============================================

  getInspectableProperties(): InspectableProperty[] {
    return [
      {
        name: 'ambient.color',
        label: 'Color',
        type: 'color',
        value: '#' + this.light?.color.getHexString() || this.color.toString(16).padStart(6, '0'),
        description: 'Ambient light color'
      },
      {
        name: 'ambient.intensity',
        label: 'Intensity',
        type: 'number',
        value: this.intensity,
        min: 0,
        max: 2,
        step: 0.1,
        description: 'Ambient light intensity'
      }
    ];
  }

  setProperty(name: string, value: any): void {
    switch (name) {
      case 'ambient.color':
        this.color = parseInt(value.replace('#', ''), 16);
        if (this.light) this.light.color.setHex(this.color);
        break;
      case 'ambient.intensity':
        this.intensity = value;
        if (this.light) this.light.intensity = this.intensity;
        break;
    }
  }

  getProperty(name: string): any {
    switch (name) {
      case 'ambient.color':
        return '#' + (this.light?.color.getHexString() || this.color.toString(16).padStart(6, '0'));
      case 'ambient.intensity':
        return this.intensity;
      default:
        return undefined;
    }
  }
}
