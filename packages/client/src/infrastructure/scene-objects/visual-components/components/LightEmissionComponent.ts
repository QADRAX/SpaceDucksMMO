import type { ICelestialComponent } from './ICelestialComponent';
import * as THREE from 'three';

/**
 * Configuration for light emission (PointLight)
 */
export interface LightEmissionComponentConfig {
  color: number;
  intensity: number;
  range: number;
  castShadow?: boolean;
}

/**
 * Component that makes a celestial body emit light (for stars).
 * Creates and manages a PointLight attached to the parent body.
 */
export class LightEmissionComponent implements ICelestialComponent {
  private config: Required<LightEmissionComponentConfig>;
  private pointLight?: THREE.PointLight;
  private parentMesh?: THREE.Mesh;

  constructor(config: LightEmissionComponentConfig) {
    this.config = {
      color: config.color,
      intensity: config.intensity,
      range: config.range,
      castShadow: config.castShadow ?? true,
    };
  }

  initialize(scene: THREE.Scene, parentMesh: THREE.Mesh): void {
    this.parentMesh = parentMesh;

    this.pointLight = new THREE.PointLight(
      this.config.color,
      this.config.intensity,
      this.config.range
    );
    
    this.pointLight.castShadow = this.config.castShadow;
    this.pointLight.shadow.mapSize.width = 1024;
    this.pointLight.shadow.mapSize.height = 1024;
    this.pointLight.position.copy(parentMesh.position);
    
    scene.add(this.pointLight);
  }

  update(deltaTime: number): void {
    // Keep light synchronized with parent position
    if (this.pointLight && this.parentMesh) {
      this.pointLight.position.copy(this.parentMesh.position);
    }
  }

  dispose(scene: THREE.Scene): void {
    if (this.pointLight) {
      scene.remove(this.pointLight);
    }
  }

  /**
   * Update light intensity at runtime
   */
  setIntensity(intensity: number): void {
    this.config.intensity = intensity;
    if (this.pointLight) {
      this.pointLight.intensity = intensity;
    }
  }
}
