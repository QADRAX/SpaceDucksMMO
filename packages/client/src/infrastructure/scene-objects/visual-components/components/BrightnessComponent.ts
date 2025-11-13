import type { ICelestialComponent } from './ICelestialComponent';
import * as THREE from 'three';

/**
 * Configuration for brightness adjustment
 */
export interface BrightnessComponentConfig {
  brightness: number;
}

/**
 * Component that applies brightness multiplier to a material.
 * Works by scaling the material's color by the brightness value.
 */
export class BrightnessComponent implements ICelestialComponent {
  private config: BrightnessComponentConfig;
  private material?: THREE.MeshBasicMaterial | THREE.MeshStandardMaterial;

  constructor(config: BrightnessComponentConfig) {
    this.config = config;
  }

  initialize(scene: THREE.Scene, parentMesh: THREE.Mesh): void {
    this.material = parentMesh.material as THREE.MeshBasicMaterial | THREE.MeshStandardMaterial;
    this.applyBrightness();
  }

  update(deltaTime: number): void {
    // Brightness is static unless changed via setBrightness
  }

  dispose(scene: THREE.Scene): void {
    // No resources to dispose
  }

  /**
   * Change brightness at runtime
   */
  setBrightness(brightness: number): void {
    this.config.brightness = brightness;
    this.applyBrightness();
  }

  private applyBrightness(): void {
    if (!this.material) return;

    // For materials with textures, use emissiveIntensity if available
    if (this.material instanceof THREE.MeshStandardMaterial) {
      // Store original emissive if not already stored
      if (!this.material.userData.originalEmissive) {
        this.material.userData.originalEmissive = this.material.emissive.clone();
      }
      
      // Apply brightness through emissive
      const originalEmissive = this.material.userData.originalEmissive as THREE.Color;
      this.material.emissive.copy(originalEmissive).multiplyScalar(this.config.brightness);
      this.material.needsUpdate = true;
    } 
    else if (this.material instanceof THREE.MeshBasicMaterial) {
      // For MeshBasicMaterial (like skybox), preserve the base color and multiply
      if (!this.material.userData.originalColor) {
        this.material.userData.originalColor = this.material.color.clone();
      }
      
      const originalColor = this.material.userData.originalColor as THREE.Color;
      this.material.color.copy(originalColor).multiplyScalar(this.config.brightness);
      this.material.needsUpdate = true;
    }
  }
}
