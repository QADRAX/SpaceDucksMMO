import * as THREE from 'three';

/**
 * Property definition for inspector UI
 */
export interface InspectableProperty {
  name: string;
  label: string;
  type: 'number' | 'boolean' | 'string' | 'color' | 'vector3' | 'select';
  value: any;
  min?: number;
  max?: number;
  step?: number;
  options?: Array<{ value: any; label: string }>;
  description?: string;
  readonly?: boolean;
}

/**
 * Contract for objects that can be inspected and edited in real-time.
 * Extends ISceneObject with runtime property editing capabilities.
 * 
 * Usage:
 * - Scene editor UI can list all inspectable properties
 * - User can modify properties and see changes in real-time
 * - Properties include transform (position, rotation, scale) and custom props
 * 
 * Example:
 * ```ts
 * class EditablePlanet extends BasePlanet implements IInspectable {
 *   getInspectableProperties(): InspectableProperty[] {
 *     return [
 *       { name: 'radius', label: 'Radius', type: 'number', value: this.radius, min: 0.1, max: 10 },
 *       { name: 'color', label: 'Color', type: 'color', value: this.color },
 *       { name: 'rotationSpeed', label: 'Rotation Speed', type: 'number', value: this.speed, step: 0.0001 }
 *     ];
 *   }
 *   
 *   setProperty(name: string, value: any): void {
 *     if (name === 'radius') {
 *       this.setRadius(value);
 *     } else if (name === 'color') {
 *       this.setColor(value);
 *     }
 *   }
 * }
 * ```
 */
export interface IInspectable {
  /**
   * Get object's transform (position, rotation, scale).
   * Returns the Three.js Object3D that can be manipulated.
   */
  getTransform(): THREE.Object3D | null;
  
  /**
   * Get all inspectable properties for this object.
   * Includes custom properties beyond standard transform.
   */
  getInspectableProperties(): InspectableProperty[];
  
  /**
   * Set a property value by name.
   * Should handle validation and update the object state.
   */
  setProperty(name: string, value: any): void;
  
  /**
   * Get current value of a property.
   */
  getProperty(name: string): any;
  
  /**
   * Optional: Get a human-readable type name for UI display.
   */
  getTypeName?(): string;
}

/**
 * Type guard to check if an object is inspectable
 */
export function isInspectable(obj: any): obj is IInspectable {
  return (
    obj &&
    typeof obj.getTransform === 'function' &&
    typeof obj.getInspectableProperties === 'function' &&
    typeof obj.setProperty === 'function' &&
    typeof obj.getProperty === 'function'
  );
}

export default IInspectable;
