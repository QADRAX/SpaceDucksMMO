import * as THREE from 'three';
import type { MaterialComponent, MaterialParameters } from '../../../domain/ecs/components/MaterialComponent';
import type { TextureCache } from './TextureCache';

export class MaterialFactory {
  static build(comp: MaterialComponent, textureCache: TextureCache): THREE.Material {
    const p: MaterialParameters = comp.parameters;
    let material: THREE.Material;

    switch (p.type) {
      case 'standard': {
        const opts: Partial<THREE.MeshStandardMaterialParameters> = {};
        if ('color' in p && p.color !== undefined) opts.color = p.color as any;
        if ('metalness' in p && p.metalness !== undefined) opts.metalness = p.metalness;
        if ('roughness' in p && p.roughness !== undefined) opts.roughness = p.roughness;
        if ('emissive' in p && p.emissive !== undefined) opts.emissive = p.emissive as any;
        if ('emissiveIntensity' in p && p.emissiveIntensity !== undefined) opts.emissiveIntensity = p.emissiveIntensity;
        if ('transparent' in p && p.transparent !== undefined) opts.transparent = p.transparent;
        if ('opacity' in p && p.opacity !== undefined) opts.opacity = p.opacity;
        material = new THREE.MeshStandardMaterial(opts);
        break;
      }
      case 'basic': {
        const opts: Partial<THREE.MeshBasicMaterialParameters> = {};
        if ('color' in p && p.color !== undefined) opts.color = p.color as any;
        if ('transparent' in p && p.transparent !== undefined) opts.transparent = p.transparent;
        if ('opacity' in p && p.opacity !== undefined) opts.opacity = p.opacity;
        if ('wireframe' in p && p.wireframe !== undefined) opts.wireframe = p.wireframe;
        material = new THREE.MeshBasicMaterial(opts);
        break;
      }
      case 'phong': {
        const opts: Partial<THREE.MeshPhongMaterialParameters> = {};
        if ('color' in p && p.color !== undefined) opts.color = p.color as any;
        if ('specular' in p && p.specular !== undefined) opts.specular = p.specular as any;
        if ('shininess' in p && p.shininess !== undefined) opts.shininess = p.shininess;
        if ('emissive' in p && p.emissive !== undefined) opts.emissive = p.emissive as any;
        if ('transparent' in p && p.transparent !== undefined) opts.transparent = p.transparent;
        if ('opacity' in p && p.opacity !== undefined) opts.opacity = p.opacity;
        material = new THREE.MeshPhongMaterial(opts);
        break;
      }
      case 'lambert': {
        const opts: Partial<THREE.MeshLambertMaterialParameters> = {};
        if ('color' in p && p.color !== undefined) opts.color = p.color as any;
        if ('emissive' in p && p.emissive !== undefined) opts.emissive = p.emissive as any;
        if ('transparent' in p && p.transparent !== undefined) opts.transparent = p.transparent;
        if ('opacity' in p && p.opacity !== undefined) opts.opacity = p.opacity;
        material = new THREE.MeshLambertMaterial(opts);
        break;
      }
      default:
        material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        break;
    }

    // Apply textures asynchronously
    if (comp.texture) {
      textureCache.load(comp.texture).then((tex) => {
        (material as any).map = tex;
        material.needsUpdate = true;
      });
    }
    if (comp.normalMap) {
      textureCache.load(comp.normalMap).then((tex) => {
        (material as any).normalMap = tex;
        material.needsUpdate = true;
      });
    }
    if (comp.envMap) {
      textureCache.load(comp.envMap).then((tex) => {
        (material as any).envMap = tex;
        material.needsUpdate = true;
      });
    }

    return material;
  }
}
