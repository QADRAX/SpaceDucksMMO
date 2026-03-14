import * as THREE from 'three';
import type { RenderObjectRegistry } from './renderContextThree';

/**
 * Creates a registry that supports multiple Object3Ds per entity (mesh, camera, light)
 * by using a Group per entity. get() returns the group; add/remove manage children.
 * Shared by GL and WebGPU infra.
 */
export function createRenderObjectRegistry(): RenderObjectRegistry {
  const byEntity = new Map<string, THREE.Group>();

  return {
    get(entityId: string): THREE.Object3D | undefined {
      return byEntity.get(entityId);
    },

    add(entityId: string, object3D: THREE.Object3D, scene: THREE.Scene): void {
      let group = byEntity.get(entityId);
      if (!group) {
        group = new THREE.Group();
        byEntity.set(entityId, group);
        scene.add(group);
      }
      group.add(object3D);
    },

    remove(entityId: string, object3D: THREE.Object3D, scene: THREE.Scene): void {
      const group = byEntity.get(entityId);
      if (!group) return;
      group.remove(object3D);
      if (group.children.length === 0) {
        scene.remove(group);
        byEntity.delete(entityId);
      }
    },

    keys(): Iterable<string> {
      return byEntity.keys();
    },
  };
}
