import * as THREE from 'three';
import type { TextureCache } from './TextureCache';
import ShaderMaterialComponent from '@client/domain/ecs/components/material/ShaderMaterialComponent';

export class ShaderMaterialFactory {
  static build(comp: ShaderMaterialComponent, textureCache: TextureCache): THREE.ShaderMaterial {
    const uniforms: Record<string, { value: any }> = {};

    for (const [k, u] of Object.entries(comp.uniforms)) {
      if (u.type === 'texture') {
        uniforms[k] = { value: null };
        textureCache.load(u.value).then((tex) => {
          uniforms[k].value = tex;
        });
      } else {
        uniforms[k] = { value: u.value };
      }
    }

    if (!uniforms['time']) uniforms['time'] = { value: 0 };

    const blending =
      comp.blending === 'additive'
        ? THREE.AdditiveBlending
        : THREE.NormalBlending;

    const vertex =
      comp.vertexShader ??
      `uniform float time; varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;
    const fragment =
      comp.fragmentShader ??
      `uniform float time; varying vec2 vUv; void main(){ gl_FragColor=vec4(1.0); }`;

    return new THREE.ShaderMaterial({
      uniforms,
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: comp.transparent,
      depthWrite: comp.depthWrite,
      blending,
    });
  }
}
