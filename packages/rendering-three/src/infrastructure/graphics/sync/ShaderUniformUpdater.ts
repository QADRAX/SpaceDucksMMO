// @ts-ignore
import * as THREE from 'three/webgpu';
import type { Entity, AnyCustomShaderComponent } from '@duckengine/ecs';
import type { RenderComponent } from './RenderObjectRegistry';

export class ShaderUniformUpdater {
  update(dt: number, entity: Entity, rc: RenderComponent): void {
    const shaderMatComp = entity.getComponent<AnyCustomShaderComponent>('basicShaderMaterial') ||
      entity.getComponent<AnyCustomShaderComponent>('standardShaderMaterial') ||
      entity.getComponent<AnyCustomShaderComponent>('physicalShaderMaterial');
    if (!shaderMatComp || !(rc.object3D as any).isMesh) return;

    const mesh = rc.object3D as any;
    const material = mesh.material as THREE.MeshBasicNodeMaterial;

    if (!material || !material.userData) return;

    const uniformNodes = material.userData.customUniformNodes as Record<string, any>;
    if (!uniformNodes) return;

    // 1. Sync PBR Properties (Roughness, Metalness, etc.)
    if (shaderMatComp.type === 'physicalShaderMaterial') {
      const p = shaderMatComp as any;
      material.roughness = p.roughness;
      material.metalness = p.metalness;
      material.clearcoat = p.clearcoat;
      material.transmission = p.transmission;
      material.ior = p.ior;
      material.thickness = p.thickness;
    } else if (shaderMatComp.type === 'standardShaderMaterial') {
      const s = shaderMatComp as any;
      material.roughness = s.roughness;
      material.metalness = s.metalness;
    }

    // 2. Sync Custom Uniforms
    // Update time uniform
    if (uniformNodes['time']) {
      uniformNodes['time'].value += dt / 1000;
    }

    // Sync component uniforms to material uniforms
    for (const [id, uni] of Object.entries(shaderMatComp.uniforms)) {
      const uniAny = uni as any;
      if (uniAny.type === 'texture') continue;

      // Try to find node by ID first, then fallback to key
      let node = uniformNodes[id];
      if (!node && uniAny.key) {
        // Search nodes for one with a matching name (shaderKey)
        node = Object.values(uniformNodes).find(n => n.name === uniAny.key);
      }

      if (node) {
        // 1. Color sync
        if (uniAny.type === 'color' && node.value && node.value.isColor) {
          node.value.set(uniAny.value);
        }
        // 2. Vector sync (vec2, vec3)
        else if (Array.isArray(uniAny.value) && node.value) {
          if (node.value.isVector2 || node.value.isVector3 || node.value.isVector4) {
            node.value.fromArray(uniAny.value);
          } else {
            node.value = uniAny.value;
          }
        }
        // 3. Scalar/Generic sync
        else if (node.value !== uniAny.value) {
          node.value = uniAny.value;
        }
      }
    }
  }
}
