import * as THREE from 'three';

/**
 * Base interface for all celestial body components.
 * Components are modular pieces that add specific functionality to celestial bodies.
 */
export interface ICelestialComponent {
  /**
   * Initialize component and add any meshes to the scene
   */
  initialize(scene: THREE.Scene, parentMesh: THREE.Mesh): void;
  
  /**
   * Update component state each frame
   */
  update(deltaTime: number): void;
  
  /**
   * Clean up component resources
   */
  dispose(scene: THREE.Scene): void;
}
