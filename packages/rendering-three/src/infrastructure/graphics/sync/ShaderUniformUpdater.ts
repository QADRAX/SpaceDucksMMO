// @ts-ignore
import * as THREE from 'three/webgpu';
import type { Entity, ShaderMaterialComponent } from '@duckengine/ecs';
import type { RenderComponent } from './RenderObjectRegistry';

export class ShaderUniformUpdater {
  update(dt: number, entity: Entity, rc: RenderComponent): void {
    const shaderMatComp = entity.getComponent<ShaderMaterialComponent>('shaderMaterial');
    if (!shaderMatComp || !(rc.object3D as any).isMesh) return;

    const mesh = rc.object3D as any;
    const material = mesh.material as THREE.MeshBasicNodeMaterial;

    if (!material || !material.userData) return;

    const uniformNodes = material.userData.customUniformNodes as Record<string, any>;
    if (!uniformNodes) return;

    // Update time uniform
    if (uniformNodes['time']) {
      uniformNodes['time'].value += dt;
    }

    // Sync component uniforms to material uniforms
    for (const [key, uni] of Object.entries(shaderMatComp.uniforms)) {
      if (uniformNodes[key] && uni.type !== 'texture') {
        const node = uniformNodes[key];
        // Use .set() for color objects to avoid replacing the object identity
        if (uni.type === 'color' && node.value && node.value.isColor) {
          node.value.set(uni.value);
        } else {
          if (node.value !== uni.value) {
            console.log(`[ShaderUniformUpdater] Syncing ${key}: ${node.value} -> ${uni.value}`);
            node.value = uni.value;
          }
        }
      }
    }
  }
}
