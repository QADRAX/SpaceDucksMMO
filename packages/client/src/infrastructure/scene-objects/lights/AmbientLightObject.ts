import * as THREE from 'three';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import type { IInspectable, InspectableProperty } from '@client/domain/scene/IInspectable';

/**
 * Ambient Light as ISceneObject
 * Provides uniform lighting from all directions
 */
export class AmbientLightObject implements ISceneObject, IInspectable {
  readonly id: string;
  private light: THREE.AmbientLight;

  constructor(
    id: string,
    color: number = 0xffffff,
    intensity: number = 0.3
  ) {
    this.id = id;
    this.light = new THREE.AmbientLight(color, intensity);
  }

  addTo(scene: THREE.Scene): void {
    scene.add(this.light);
  }

  removeFrom(scene: THREE.Scene): void {
    scene.remove(this.light);
  }

  update(_dt: number): void {
    // Lights don't need updates
  }

  dispose(): void {
    this.light.dispose();
  }

  /**
   * Get the underlying Three.js light for advanced configuration
   */
  getLight(): THREE.AmbientLight {
    return this.light;
  }

  /**
   * Set light intensity
   */
  setIntensity(intensity: number): void {
    this.light.intensity = intensity;
  }

  /**
   * Set light color
   */
  setColor(color: number): void {
    this.light.color.setHex(color);
  }

  // IInspectable implementation
  getTransform(): THREE.Object3D {
    return this.light;
  }

  getInspectableProperties(): InspectableProperty[] {
    return [
      {
        name: 'color',
        label: 'Color',
        type: 'color',
        value: '#' + this.light.color.getHexString(),
        readonly: false
      },
      {
        name: 'intensity',
        label: 'Intensity',
        type: 'number',
        value: this.light.intensity,
        min: 0,
        max: 2,
        step: 0.1,
        readonly: false
      }
    ];
  }

  setProperty(name: string, value: any): void {
    switch (name) {
      case 'color':
        this.setColor(parseInt(value.replace('#', ''), 16));
        break;
      case 'intensity':
        this.setIntensity(value);
        break;
    }
  }

  getProperty(name: string): any {
    switch (name) {
      case 'color':
        return '#' + this.light.color.getHexString();
      case 'intensity':
        return this.light.intensity;
      default:
        return undefined;
    }
  }

  getTypeName(): string {
    return 'Ambient Light';
  }
}
