import * as THREE from "three";
import type { TextureCache } from "./TextureCache";
import StandardMaterialComponent from "@client/domain/ecs/components/material/StandardMaterialComponent";
import BasicMaterialComponent from "@client/domain/ecs/components/material/BasicMaterialComponent";
import PhongMaterialComponent from "@client/domain/ecs/components/material/PhongMaterialComponent";
import LambertMaterialComponent from "@client/domain/ecs/components/material/LambertMaterialComponent";

export type AnyMaterialComponent =
  | StandardMaterialComponent
  | BasicMaterialComponent
  | PhongMaterialComponent
  | LambertMaterialComponent;

export class MaterialFactory {
  static build(
    comp: AnyMaterialComponent,
    textureCache: TextureCache
  ): THREE.Material {
    let material: THREE.Material;

    switch (comp.type) {
      case "standardMaterial": {
        const opts: THREE.MeshStandardMaterialParameters = {
          color: comp.color ?? 0xffffff,
          metalness: comp.metalness,
          roughness: comp.roughness,
          emissive: comp.emissive,
          emissiveIntensity: comp.emissiveIntensity,
          transparent: comp.transparent,
          opacity: comp.opacity,
        };
        material = new THREE.MeshStandardMaterial(opts);
        break;
      }
      case "basicMaterial": {
        const basic = comp as BasicMaterialComponent;
        const opts: THREE.MeshBasicMaterialParameters = {
          color: basic.color ?? 0xffffff,
          transparent: basic.transparent,
          opacity: basic.opacity,
          wireframe: basic.wireframe,
        };
        material = new THREE.MeshBasicMaterial(opts);
        break;
      }
      case "phongMaterial": {
        const phong = comp as PhongMaterialComponent;
        const opts: THREE.MeshPhongMaterialParameters = {
          color: phong.color ?? 0xffffff,
          specular: phong.specular,
          shininess: phong.shininess,
          emissive: phong.emissive,
          transparent: phong.transparent,
          opacity: phong.opacity,
        };
        material = new THREE.MeshPhongMaterial(opts);
        break;
      }
      case "lambertMaterial": {
        const lambert = comp as LambertMaterialComponent;
        const opts: THREE.MeshLambertMaterialParameters = {
          color: lambert.color ?? 0xffffff,
          emissive: lambert.emissive,
          transparent: lambert.transparent,
          opacity: lambert.opacity,
        };
        material = new THREE.MeshLambertMaterial(opts);
        break;
      }
      default:
        material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        break;
    }

    // Apply textures asynchronously if supported
    // Usamos type guards para evitar any
    if ('texture' in comp && comp.texture) {
      textureCache.load(comp.texture).then((tex) => {
        if ('map' in material) {
          (material as THREE.MeshStandardMaterial | THREE.MeshBasicMaterial | THREE.MeshPhongMaterial | THREE.MeshLambertMaterial).map = tex;
          material.needsUpdate = true;
        }
      }).catch((err) => {
        // Avoid unhandled promise rejection and provide useful debug info
        console.warn('[MaterialFactory] Failed to load texture', comp.texture, err);
      });
    }
    if ('normalMap' in comp && comp.normalMap) {
      textureCache.load(comp.normalMap).then((tex) => {
        if ('normalMap' in material) {
          (material as THREE.MeshStandardMaterial | THREE.MeshPhongMaterial | THREE.MeshLambertMaterial).normalMap = tex;
          material.needsUpdate = true;
        }
      }).catch((err) => {
        console.warn('[MaterialFactory] Failed to load normalMap', comp.normalMap, err);
      });
    }
    if ('envMap' in comp && comp.envMap) {
      textureCache.load(comp.envMap).then((tex) => {
        if ('envMap' in material) {
          (material as THREE.MeshStandardMaterial | THREE.MeshPhongMaterial | THREE.MeshLambertMaterial).envMap = tex;
          material.needsUpdate = true;
        }
      }).catch((err) => {
        console.warn('[MaterialFactory] Failed to load envMap', comp.envMap, err);
      });
    }

    return material;
  }
}
