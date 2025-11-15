import * as THREE from 'three';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';

/**
 * Base interface for all visual components.
 * Components are modular pieces that add specific functionality to visual bodies.
 */
export interface IVisualComponent {
  /**
   * Initialize component and add any meshes to the scene
   * @param scene The Three.js scene
   * @param parentMesh The parent mesh this component belongs to
   * @param visualBody Optional reference to the parent VisualBody (for accessing other components)
   */
  initialize(scene: THREE.Scene, parentMesh: THREE.Mesh, visualBody?: any): void;
  
  /**
   * Update component state each frame
   */
  update(deltaTime: number): void;
  
  /**
   * Clean up component resources
   */
  dispose(scene: THREE.Scene): void;
}

/**
 * Extended interface for components that expose inspectable properties.
 * Components implementing this interface can be edited via the Object Inspector.
 * 
 * Each component is responsible for:
 * - Defining its own properties (name, label, type, constraints)
 * - Handling property get/set operations
 * - Maintaining its own state
 * 
 * This follows the Open/Closed principle - new components can be added
 * without modifying VisualBody.
 */
export interface IInspectableComponent extends IVisualComponent {
  /**
   * Get the list of properties that can be inspected/edited.
   * Property names should be prefixed with component namespace to avoid collisions.
   * 
   * @example
   * ```ts
   * getInspectableProperties(): InspectableProperty[] {
   *   return [
   *     {
   *       name: 'corona.color',
   *       label: 'Corona Color',
   *       type: 'color',
   *       value: this.config.color,
   *       description: 'Color of the corona glow'
   *     }
   *   ];
   * }
   * ```
   */
  getInspectableProperties(): InspectableProperty[];
  
  /**
   * Set a property value.
   * The name will match one of the properties returned by getInspectableProperties().
   * 
   * @param name Property name (e.g., 'corona.color')
   * @param value New value for the property
   */
  setProperty(name: string, value: any): void;
  
  /**
   * Get the current value of a property.
   * 
   * @param name Property name (e.g., 'corona.color')
   * @returns Current property value
   */
  getProperty(name: string): any;
}
