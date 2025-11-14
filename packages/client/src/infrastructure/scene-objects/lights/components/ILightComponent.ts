import * as THREE from 'three';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';

/**
 * Base interface for light components.
 * 
 * Light components encapsulate specific light behaviors (ambient, directional, point, spot)
 * that can be added, removed, or replaced at runtime in a LightBody container.
 * 
 * Philosophy:
 * - Single Responsibility: Each component handles ONE light type
 * - Lifecycle: initialize → update (optional) → dispose
 * - No scene modification: Lights add their THREE.Light to a parent container
 * 
 * @example
 * ```typescript
 * class AmbientLightComponent implements ILightComponent {
 *   initialize(scene: THREE.Scene, container: THREE.Object3D): void {
 *     const light = new THREE.AmbientLight(0xffffff, 0.3);
 *     container.add(light);
 *   }
 * }
 * ```
 */
export interface ILightComponent {
  /**
   * Initialize the light component.
   * Add the THREE.Light to the container.
   * 
   * @param scene - The THREE.Scene (for context)
   * @param container - The THREE.Object3D to add lights to
   */
  initialize(scene: THREE.Scene, container: THREE.Object3D): void;

  /**
   * Update the light each frame (optional, most lights are static).
   * 
   * @param deltaTime - Time elapsed since last frame (in seconds)
   */
  update(deltaTime: number): void;

  /**
   * Cleanup resources when component is removed.
   */
  dispose(): void;
}

/**
 * Extended interface for light components that expose inspectable properties.
 * 
 * Allows runtime modification of light properties through the inspector UI.
 */
export interface IInspectableLightComponent extends ILightComponent {
  /**
   * Get all inspectable properties for this component.
   * Properties should use namespaced names (e.g., 'ambient.color', 'directional.intensity')
   * 
   * @returns Array of inspectable properties
   */
  getInspectableProperties(): InspectableProperty[];

  /**
   * Set a property value by name.
   * 
   * @param name - Fully qualified property name
   * @param value - New value to set
   */
  setProperty(name: string, value: any): void;

  /**
   * Get a property value by name.
   * 
   * @param name - Fully qualified property name
   * @returns Current property value
   */
  getProperty(name: string): any;
}
