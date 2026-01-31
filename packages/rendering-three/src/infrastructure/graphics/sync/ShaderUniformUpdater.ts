import * as THREE from 'three';
import type { Entity, ShaderMaterialComponent } from '@duckengine/ecs';
import type { RenderComponent } from './RenderObjectRegistry';

export class ShaderUniformUpdater {
  update(dt: number, entity: Entity, rc: RenderComponent): void {
    const shaderMatComp = entity.getComponent<ShaderMaterialComponent>('shaderMaterial');
    if (!shaderMatComp || !(rc.object3D instanceof THREE.Mesh)) return;

    const material = rc.object3D.material as THREE.ShaderMaterial;
    if (!material.uniforms) return;

    // Update time uniform
    if (material.uniforms.time) {
      material.uniforms.time.value += dt;
    }

    // Sync component uniforms to material uniforms
    for (const [key, uni] of Object.entries(shaderMatComp.uniforms)) {
      if (material.uniforms[key]) {
        material.uniforms[key].value = uni.value;
      }
    }
  }
}
