import type { IInspectableComponent } from './IVisualComponent';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';
import * as THREE from 'three';

/**
 * Configuration for color tinting
 */
export interface TintComponentConfig {
  tintColor: number;
  intensity: number;
}

/**
 * Component that applies color tinting to a material.
 * Blends the tint color with the base texture/color.
 */
export class TintComponent implements IInspectableComponent {
  private config: TintComponentConfig;
  private material?: THREE.MeshStandardMaterial;

  constructor(config: TintComponentConfig) {
    this.config = config;
  }

  initialize(scene: THREE.Scene, parentMesh: THREE.Mesh): void {
    this.material = parentMesh.material as THREE.MeshStandardMaterial;
    this.applyTint();
  }

  update(deltaTime: number): void {
    // Tint is static unless changed via setTint
  }

  dispose(scene: THREE.Scene): void {
    // No resources to dispose
  }

  // ============================================
  // IInspectableComponent Implementation
  // ============================================

  getInspectableProperties(): InspectableProperty[] {
    return [
      {
        name: 'tint.color',
        label: 'Tint Color',
        type: 'color',
        value: this.config.tintColor,
        description: 'Color overlay for the surface'
      },
      {
        name: 'tint.intensity',
        label: 'Tint Intensity',
        type: 'number',
        value: this.config.intensity,
        min: 0,
        max: 1,
        step: 0.05,
        description: 'Strength of color tint'
      }
    ];
  }

  setProperty(name: string, value: any): void {
    const propName = name.split('.')[1];
    
    if (propName === 'color') {
      this.config.tintColor = value;
      this.applyTint();
    } else if (propName === 'intensity') {
      this.config.intensity = Math.max(0, Math.min(1, value));
      this.applyTint();
    }
  }

  getProperty(name: string): any {
    const propName = name.split('.')[1];
    
    if (propName === 'color') return this.config.tintColor;
    if (propName === 'intensity') return this.config.intensity;
    
    return undefined;
  }

  /**
   * Change tint color and intensity at runtime
   * @deprecated Use setProperty instead
   */
  setTint(color: number, intensity?: number): void {
    this.config.tintColor = color;
    if (intensity !== undefined) {
      this.config.intensity = Math.max(0, Math.min(1, intensity));
    }
    this.applyTint();
  }

  private applyTint(): void {
    if (!this.material) return;

    const baseColor = this.material.map ? 0xffffff : this.material.color.getHex();
    const tinted = this.calculateTintedColor(baseColor, this.config.tintColor, this.config.intensity);
    
    this.material.color.setHex(tinted);
    this.material.needsUpdate = true;
  }

  private calculateTintedColor(base: number, tint: number, intensity: number): number {
    if (intensity === 0) return base;
    if (intensity === 1) return tint;

    const baseColor = new THREE.Color(base);
    const tintColor = new THREE.Color(tint);
    baseColor.lerp(tintColor, intensity);
    
    return baseColor.getHex();
  }
}
