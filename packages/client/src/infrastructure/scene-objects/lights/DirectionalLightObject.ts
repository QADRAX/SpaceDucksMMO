import * as THREE from 'three';
import type { ISceneObject } from '@client/domain/scene/ISceneObject';
import type { IInspectable, InspectableProperty } from '@client/domain/scene/IInspectable';

/**
 * Directional Light as ISceneObject
 * Provides parallel rays of light (like sun)
 * 
 * @deprecated Use LightBody with DirectionalLightComponent instead.
 * 
 * For new code, use the component-based architecture:
 * 
 * @example
 * ```typescript
 * // Old (deprecated):
 * const light = new DirectionalLightObject('sun', { color: 0xffffff, intensity: 0.7 });
 * 
 * // New (recommended):
 * import { LightBuilder } from './builders';
 * const light = LightBuilder.createDirectional('sun', { 
 *   color: 0xffffff, 
 *   intensity: 0.7,
 *   position: [5, 10, 5] 
 * });
 * ```
 * 
 * @see LightBody - Component container
 * @see DirectionalLightComponent - Directional light
 * @see LightBuilder - Convenient builders
 */
export class DirectionalLightObject implements ISceneObject, IInspectable {
  readonly id: string;
  private light: THREE.DirectionalLight;

  constructor(
    id: string,
    options: {
      color?: number;
      intensity?: number;
      position?: [number, number, number];
      castShadow?: boolean;
    } = {}
  ) {
    this.id = id;
    
    const {
      color = 0xffffff,
      intensity = 0.7,
      position = [5, 10, 5],
      castShadow = true
    } = options;

    this.light = new THREE.DirectionalLight(color, intensity);
    this.light.position.set(...position);
    this.light.castShadow = castShadow;
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
  getLight(): THREE.DirectionalLight {
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

  /**
   * Set light position
   */
  setPosition(x: number, y: number, z: number): void {
    this.light.position.set(x, y, z);
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
      },
      {
        name: 'position.x',
        label: 'Position X',
        type: 'number',
        value: this.light.position.x,
        min: -50,
        max: 50,
        step: 0.5,
        readonly: false
      },
      {
        name: 'position.y',
        label: 'Position Y',
        type: 'number',
        value: this.light.position.y,
        min: -50,
        max: 50,
        step: 0.5,
        readonly: false
      },
      {
        name: 'position.z',
        label: 'Position Z',
        type: 'number',
        value: this.light.position.z,
        min: -50,
        max: 50,
        step: 0.5,
        readonly: false
      },
      {
        name: 'castShadow',
        label: 'Cast Shadow',
        type: 'boolean',
        value: this.light.castShadow,
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
      case 'position.x':
        this.light.position.x = value;
        break;
      case 'position.y':
        this.light.position.y = value;
        break;
      case 'position.z':
        this.light.position.z = value;
        break;
      case 'castShadow':
        this.light.castShadow = value;
        break;
    }
  }

  getProperty(name: string): any {
    switch (name) {
      case 'color':
        return '#' + this.light.color.getHexString();
      case 'intensity':
        return this.light.intensity;
      case 'position.x':
        return this.light.position.x;
      case 'position.y':
        return this.light.position.y;
      case 'position.z':
        return this.light.position.z;
      case 'castShadow':
        return this.light.castShadow;
      default:
        return undefined;
    }
  }

  getTypeName(): string {
    return 'Directional Light';
  }
}
