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
    textureCache: TextureCache,
    applyTiling?: (tex: THREE.Texture) => void
  ): THREE.Material {
    let material: THREE.Material;

    // Remove undefined keys to avoid THREE warnings about undefined params
    function cleanParams<T extends object>(params: T): T {
      Object.keys(params).forEach((key) => {
        if ((params as any)[key] === undefined) {
          delete (params as any)[key];
        }
      });
      return params;
    }

    // Heuristic to detect direct file paths/URLs vs catalog ids
    function looksLikeDirectPath(url: string | undefined): boolean {
      if (!url) return false;
      return (
        url.startsWith("/") ||
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("assets/") ||
        url.includes(".") // anything with a dot is assumed to be a file path
      );
    }

    const tryLoad = (
      url: string | undefined,
      apply: (tex: THREE.Texture) => void,
      label: string
    ) => {
      if (!url || !looksLikeDirectPath(url)) return; // skip catalog ids
      textureCache
        .load(url)
        .then((tex) => {
          // Clone the texture before modifying it so we don't mutate
          // a shared cached texture instance used by other materials/entities.
          const t = tex.clone();
          apply(t);
          if (applyTiling) applyTiling(t);
          material.needsUpdate = true;
        })
        .catch((err) => {
          console.warn(`[MaterialFactory] Failed to load ${label}`, url, err);
        });
    };

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
        material = new THREE.MeshStandardMaterial(cleanParams(opts));
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
        material = new THREE.MeshBasicMaterial(cleanParams(opts));
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
        material = new THREE.MeshPhongMaterial(cleanParams(opts));
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
        material = new THREE.MeshLambertMaterial(cleanParams(opts));
        break;
      }
      default:
        material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        break;
    }

    // Apply textures asynchronously for direct file paths only (catalog ids are resolved elsewhere)
    if ('texture' in comp) {
      tryLoad((comp as any).texture, (tex) => {
        if ('map' in material) (material as any).map = tex;
      }, 'texture');
    }
    if ('normalMap' in comp) {
      tryLoad((comp as any).normalMap, (tex) => {
        if ('normalMap' in material) (material as any).normalMap = tex;
      }, 'normalMap');
    }
    if ('envMap' in comp) {
      tryLoad((comp as any).envMap, (tex) => {
        if ('envMap' in material) (material as any).envMap = tex;
      }, 'envMap');
    }
    if ('aoMap' in comp) {
      tryLoad((comp as any).aoMap, (tex) => {
        if ('aoMap' in material) (material as any).aoMap = tex;
      }, 'aoMap');
    }
    if ('roughnessMap' in comp) {
      tryLoad((comp as any).roughnessMap, (tex) => {
        if ('roughnessMap' in material) (material as any).roughnessMap = tex;
      }, 'roughnessMap');
    }
    if ('metalnessMap' in comp) {
      tryLoad((comp as any).metalnessMap, (tex) => {
        if ('metalnessMap' in material) (material as any).metalnessMap = tex;
      }, 'metalnessMap');
    }

    return material;
  }
}
