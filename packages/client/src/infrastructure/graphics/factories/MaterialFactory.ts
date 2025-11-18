import * as THREE from 'three';
import type { TextureCache } from './TextureCache';
import type { StandardMaterialComponent } from '../../../domain/ecs/components/StandardMaterialComponent';
import type { BasicMaterialComponent } from '../../../domain/ecs/components/BasicMaterialComponent';
import type { PhongMaterialComponent } from '../../../domain/ecs/components/PhongMaterialComponent';
import type { LambertMaterialComponent } from '../../../domain/ecs/components/LambertMaterialComponent';

export type AnyMaterialComponent =
  | StandardMaterialComponent
  | BasicMaterialComponent
  | PhongMaterialComponent
  | LambertMaterialComponent;

export class MaterialFactory {
  static build(comp: AnyMaterialComponent, textureCache: TextureCache): THREE.Material {
    let material: THREE.Material;

    switch (comp.type) {
      case 'standardMaterial': {
        const opts: Partial<THREE.MeshStandardMaterialParameters> = {};
        if ((comp as any).color !== undefined) opts.color = (comp as any).color as any;
        if ((comp as any).metalness !== undefined) opts.metalness = (comp as any).metalness;
        if ((comp as any).roughness !== undefined) opts.roughness = (comp as any).roughness;
        if ((comp as any).emissive !== undefined) opts.emissive = (comp as any).emissive as any;
        if ((comp as any).emissiveIntensity !== undefined) opts.emissiveIntensity = (comp as any).emissiveIntensity;
        if ((comp as any).transparent !== undefined) opts.transparent = (comp as any).transparent;
        if ((comp as any).opacity !== undefined) opts.opacity = (comp as any).opacity;
        material = new THREE.MeshStandardMaterial(opts);
        break;
      }
      case 'basicMaterial': {
        const opts: Partial<THREE.MeshBasicMaterialParameters> = {};
        if ((comp as any).color !== undefined) opts.color = (comp as any).color as any;
        if ((comp as any).transparent !== undefined) opts.transparent = (comp as any).transparent;
        if ((comp as any).opacity !== undefined) opts.opacity = (comp as any).opacity;
        if ((comp as any).wireframe !== undefined) opts.wireframe = (comp as any).wireframe;
        material = new THREE.MeshBasicMaterial(opts);
        break;
      }
      case 'phongMaterial': {
        const opts: Partial<THREE.MeshPhongMaterialParameters> = {};
        if ((comp as any).color !== undefined) opts.color = (comp as any).color as any;
        if ((comp as any).specular !== undefined) opts.specular = (comp as any).specular as any;
        if ((comp as any).shininess !== undefined) opts.shininess = (comp as any).shininess;
        if ((comp as any).emissive !== undefined) opts.emissive = (comp as any).emissive as any;
        if ((comp as any).transparent !== undefined) opts.transparent = (comp as any).transparent;
        if ((comp as any).opacity !== undefined) opts.opacity = (comp as any).opacity;
        material = new THREE.MeshPhongMaterial(opts);
        break;
      }
      case 'lambertMaterial': {
        const opts: Partial<THREE.MeshLambertMaterialParameters> = {};
        if ((comp as any).color !== undefined) opts.color = (comp as any).color as any;
        if ((comp as any).emissive !== undefined) opts.emissive = (comp as any).emissive as any;
        if ((comp as any).transparent !== undefined) opts.transparent = (comp as any).transparent;
        if ((comp as any).opacity !== undefined) opts.opacity = (comp as any).opacity;
        material = new THREE.MeshLambertMaterial(opts);
        break;
      }
      default:
        material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        break;
    }

    // Apply textures asynchronously if supported
    const texKey = (comp as any).texture;
    const normalKey = (comp as any).normalMap;
    const envKey = (comp as any).envMap;
    if (texKey) {
      textureCache.load(texKey).then((tex) => {
        (material as any).map = tex;
        material.needsUpdate = true;
      });
    }
    if (normalKey) {
      textureCache.load(normalKey).then((tex) => {
        (material as any).normalMap = tex;
        material.needsUpdate = true;
      });
    }
    if (envKey) {
      textureCache.load(envKey).then((tex) => {
        (material as any).envMap = tex;
        material.needsUpdate = true;
      });
    }

    return material;
  }
}
