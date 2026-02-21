import * as THREE from 'three';
import { deferredDispose, deferredDisposeObject } from "../debug/DebugUtils";

export interface RenderComponent {
  entityId: string;
  object3D?: THREE.Object3D;
  material?: THREE.Material | THREE.Material[];
  geometry?: THREE.BufferGeometry;
  animationMixer?: THREE.AnimationMixer;
  availableAnimations?: THREE.AnimationClip[];
  activeAction?: THREE.AnimationAction;
}

export class RenderObjectRegistry {
  private components = new Map<string, RenderComponent>();

  add(entityId: string, component: RenderComponent): void {
    this.components.set(entityId, component);
  }

  get(entityId: string): RenderComponent | undefined {
    return this.components.get(entityId);
  }

  has(entityId: string): boolean {
    return this.components.has(entityId);
  }

  remove(entityId: string, scene: THREE.Scene): void {
    const rc = this.components.get(entityId);
    if (!rc) return;

    if (rc.object3D) {
      // Directional/spot lights add a target Object3D to the scene.
      // If we don't remove it, recreating lights (or hot reload) leaves orphan targets behind.
      try {
        if (rc.object3D instanceof THREE.DirectionalLight || rc.object3D instanceof THREE.SpotLight) {
          scene.remove(rc.object3D.target);
        }
      } catch {
        // ignore
      }

      scene.remove(rc.object3D);
      deferredDisposeObject(rc.object3D);
    }
    if (rc.geometry) deferredDispose(rc.geometry);
    if (rc.material) {
      if (Array.isArray(rc.material))
        rc.material.forEach((m: THREE.Material) => deferredDispose(m));
      else deferredDispose(rc.material);
    }

    this.components.delete(entityId);
  }

  getAll(): Map<string, RenderComponent> {
    return this.components;
  }

  clear(scene: THREE.Scene): void {
    for (const entityId of this.components.keys()) {
      this.remove(entityId, scene);
    }
  }
}
