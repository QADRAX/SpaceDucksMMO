import type { IInspectableComponent } from './IVisualComponent';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';
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
export class LightEmissionComponent implements IInspectableComponent {
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
   * @deprecated Use setProperty('light.intensity', intensity) instead
   */
  setIntensity(intensity: number): void {
    this.config.intensity = intensity;
    if (this.pointLight) {
      this.pointLight.intensity = intensity;
    }
  }

  getInspectableProperties(): InspectableProperty[] {
    return [
      { name: 'light.color', label: 'Light Color', type: 'color', value: this.config.color },
      { name: 'light.intensity', label: 'Light Intensity', type: 'number', value: this.config.intensity, min: 0, max: 10, step: 0.1 },
      { name: 'light.range', label: 'Light Range', type: 'number', value: this.config.range, min: 0, max: 1000, step: 10 },
    ];
  }

  setProperty(name: string, value: any): void {
    const propName = name.split('.')[1];
    
    if (propName === 'color') {
      this.config.color = value;
      if (this.pointLight) {
        this.pointLight.color.setHex(value);
      }
    } else if (propName === 'intensity') {
      this.config.intensity = value;
      if (this.pointLight) {
        this.pointLight.intensity = value;
      }
    } else if (propName === 'range') {
      this.config.range = value;
      if (this.pointLight) {
        this.pointLight.distance = value;
      }
    }
  }

  getProperty(name: string): any {
    const propName = name.split('.')[1];
    
    if (propName === 'color') return this.config.color;
    if (propName === 'intensity') return this.config.intensity;
    if (propName === 'range') return this.config.range;
    
    return undefined;
  }
}
