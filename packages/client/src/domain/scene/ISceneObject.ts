import * as THREE from 'three';

/**
 * Contract for any object that can live in the 3D scene.
 * Domain-level abstraction (no direct knowledge of renderer loop internals).
 */
export interface ISceneObject {
  readonly id: string;
  /** Add all necessary Three.js objects to scene */
  addTo(scene: THREE.Scene): void;
  /** Remove all Three.js objects from scene and clean up resources */
  removeFrom(scene: THREE.Scene): void;
  /** Per-frame domain update (no rendering side effects out of object scope) */
  update(dt: number): void;
  /** Optional cleanup (prefer using removeFrom for proper cleanup) */
  dispose?(): void;
}
