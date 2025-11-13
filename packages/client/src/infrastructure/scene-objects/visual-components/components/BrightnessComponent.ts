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

    // Scale color by brightness
    const baseColor = new THREE.Color(0xffffff);
    baseColor.multiplyScalar(this.config.brightness);
    
    this.material.color.copy(baseColor);
    this.material.needsUpdate = true;
  }
}
