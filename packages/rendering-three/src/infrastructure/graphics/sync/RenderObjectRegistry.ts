import * as THREE from 'three';

export interface RenderComponent {
  entityId: string;
  object3D?: THREE.Object3D;
  material?: THREE.Material;
  geometry?: THREE.BufferGeometry;
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

    if (rc.object3D) scene.remove(rc.object3D);
    if (rc.geometry) rc.geometry.dispose();
    if (rc.material) {
      if (Array.isArray(rc.material))
        (rc.material as any).forEach((m: THREE.Material) => m.dispose());
      else rc.material.dispose();
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
