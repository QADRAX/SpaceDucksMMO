import type * as THREE from 'three';
import type { RenderObjectRegistry } from './renderContextThree';

/**
 * Removes an object from the render registry and optionally disposes it.
 * Use in feature onDetach/onDetachById to unregister and clean up.
 */
export function removeFromRegistryAndDispose<T extends THREE.Object3D>(
  registry: RenderObjectRegistry,
  scene: THREE.Scene,
  entityId: string,
  object: T | undefined,
  dispose: (obj: T) => void,
): void {
  if (!object) return;
  registry.remove(entityId, object, scene);
  dispose(object);
}
