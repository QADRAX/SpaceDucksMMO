import * as THREE from 'three';
import type { MaterialComponent } from '../../../domain/ecs/components/MaterialComponent';
import type { TextureCache } from './TextureCache';

export class MaterialFactory {
  static build(comp: MaterialComponent, textureCache: TextureCache): THREE.Material {
    const p = comp.parameters;
    let material: THREE.Material;

    switch (p.type) {
      case 'standard':
        material = new THREE.MeshStandardMaterial({
          color: p.color as any,
          metalness: (p as any).metalness,
          roughness: (p as any).roughness,
          emissive: (p as any).emissive as any,
          emissiveIntensity: (p as any).emissiveIntensity,
          transparent: (p as any).transparent,
          opacity: (p as any).opacity,
        });
        break;
      case 'basic':
        material = new THREE.MeshBasicMaterial({
          color: p.color as any,
          transparent: (p as any).transparent,
          opacity: (p as any).opacity,
          wireframe: (p as any).wireframe,
        });
        break;
      case 'phong':
        material = new THREE.MeshPhongMaterial({
          color: p.color as any,
          specular: (p as any).specular as any,
          shininess: (p as any).shininess,
          emissive: (p as any).emissive as any,
          transparent: (p as any).transparent,
          opacity: (p as any).opacity,
        });
        break;
      case 'lambert':
        material = new THREE.MeshLambertMaterial({
          color: p.color as any,
          emissive: (p as any).emissive as any,
          transparent: (p as any).transparent,
          opacity: (p as any).opacity,
        });
        break;
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
