import type { IInspectableComponent } from './IVisualComponent';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';
import * as THREE from 'three';

/**
 * Configuration for emissive properties
 */
export interface EmissiveComponentConfig {
  color: number;
  intensity?: number;
}

/**
 * Component that manages emissive properties of a material.
 * Makes objects glow with self-illumination.
 * 
 * Works with THREE.MeshStandardMaterial to add emissive lighting.
 * Useful for stars, lava, neon effects, etc.
 */
export class EmissiveComponent implements IInspectableComponent {
  private config: Required<EmissiveComponentConfig>;
  private parentMesh?: THREE.Mesh;

  constructor(config: EmissiveComponentConfig) {
    this.config = {
      color: config.color,
      intensity: config.intensity ?? 1.0,
    };
  }

  initialize(scene: THREE.Scene, parentMesh: THREE.Mesh): void {
    this.parentMesh = parentMesh;
    this.applyEmissive();
  }

  update(deltaTime: number): void {
    // Emissive properties are static unless changed via setProperty
  }

  dispose(scene: THREE.Scene): void {
    // No resources to dispose
  }

  getInspectableProperties(): InspectableProperty[] {
    return [
      {
        name: 'emissive.color',
        label: 'Emissive Color',
        type: 'color',
        value: this.config.color,
      },
      {
        name: 'emissive.intensity',
        label: 'Emissive Intensity',
        type: 'number',
        value: this.config.intensity,
        min: 0,
        max: 5,
        step: 0.1,
      },
    ];
  }

  setProperty(name: string, value: any): void {
    const propName = name.split('.')[1];

    if (propName === 'color') {
      this.config.color = value;
      this.applyEmissive();
    } else if (propName === 'intensity') {
      this.config.intensity = value;
      this.applyEmissive();
    }
  }

  getProperty(name: string): any {
    const propName = name.split('.')[1];

    if (propName === 'color') return this.config.color;
    if (propName === 'intensity') return this.config.intensity;

    return undefined;
  }

  private applyEmissive(): void {
    if (!this.parentMesh) return;

    const material = this.parentMesh.material;

    // Only works with MeshStandardMaterial
    if (material instanceof THREE.MeshStandardMaterial) {
      material.emissive.setHex(this.config.color);
      material.emissiveIntensity = this.config.intensity;
      material.needsUpdate = true;
    }
  }
}
