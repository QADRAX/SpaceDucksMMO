import * as THREE from 'three';
import type { InspectableProperty } from '@client/domain/scene/IInspectable';

/**
 * Base interface for all camera behavior components.
 * 
 * Camera components encapsulate specific camera behaviors (orbit, follow, fixed position, etc.)
 * that can be added, removed, or replaced at runtime in a CameraBody container.
 * 
 * Philosophy:
 * - Single Responsibility: Each component handles ONE camera behavior
 * - Lifecycle: initialize → update (per frame) → dispose
 * - No direct THREE.Camera creation: Components modify an existing camera
 * - Composable: Multiple components can work together (e.g., Orbit + LookAt)
 * 
 * @example
 * ```typescript
 * class OrbitComponent implements ICameraComponent {
 *   initialize(camera: THREE.Camera, scene: THREE.Scene): void {
 *     // Setup orbit state
 *   }
 *   
 *   update(deltaTime: number, camera: THREE.Camera): void {
 *     // Rotate camera around target
 *   }
 *   
 *   dispose(): void {
 *     // Cleanup resources
 *   }
 * }
 * ```
 */
export interface ICameraComponent {
  /**
   * Initialize the camera component.
   * Called once when component is added to a CameraBody that's already in the scene,
   * or when the CameraBody is added to the scene.
   * 
   * @param camera - The THREE.Camera to control (typically PerspectiveCamera)
   * @param scene - The THREE.Scene (for raycasting, object queries, etc.)
   */
  initialize(camera: THREE.Camera, scene: THREE.Scene): void;

  /**
   * Update the camera behavior each frame.
   * 
   * @param deltaTime - Time elapsed since last frame (in seconds)
   * @param camera - The THREE.Camera to modify
   */
  update(deltaTime: number, camera: THREE.Camera): void;

  /**
   * Cleanup resources when component is removed.
   * Called when component is removed from CameraBody or CameraBody is disposed.
   */
  dispose(): void;
}

/**
 * Extended interface for camera components that expose inspectable properties.
 * 
 * Allows runtime modification of component behavior through the inspector UI.
 * 
 * @example
 * ```typescript
 * class OrbitComponent implements IInspectableCameraComponent {
 *   private distance: number = 10;
 *   private speed: number = 0.001;
 *   
 *   getInspectableProperties(): InspectableProperty[] {
 *     return [
 *       { name: 'orbit.distance', label: 'Distance', type: 'number', value: this.distance, min: 1, max: 100 },
 *       { name: 'orbit.speed', label: 'Speed', type: 'number', value: this.speed, min: 0, max: 0.01, step: 0.0001 }
 *     ];
 *   }
 *   
 *   setProperty(name: string, value: any): void {
 *     if (name === 'orbit.distance') this.distance = value;
 *     if (name === 'orbit.speed') this.speed = value;
 *   }
 * }
 * ```
 */
export interface IInspectableCameraComponent extends ICameraComponent {
  /**
   * Get all inspectable properties for this component.
   * Properties should use namespaced names (e.g., 'orbit.distance', 'follow.smoothness')
   * to avoid conflicts when multiple components are present.
   * 
   * @returns Array of inspectable properties
   */
  getInspectableProperties(): InspectableProperty[];

  /**
   * Set a property value by name.
   * 
   * @param name - Fully qualified property name (e.g., 'orbit.distance')
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
