// @ts-ignore
import * as THREE from "three/webgpu";
import { CoreLogger } from "@duckengine/core";
import type { TextureCache } from "./TextureCache";
import type {
  StandardMaterialComponent,
  BasicMaterialComponent,
  PhongMaterialComponent,
  LambertMaterialComponent,
} from "@duckengine/ecs";

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

    function normalizeHexColor(
      v: THREE.ColorRepresentation | undefined
    ): THREE.ColorRepresentation | undefined {
      if (typeof v !== 'string') return v;
      // THREE.Color supports '#RRGGBB' but not '#RRGGBBAA'.
      if (/^#[0-9a-fA-F]{8}$/.test(v)) {
        return v.slice(0, 7);
      }
      return v;
    }

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
        url.startsWith("blob:") ||
        url.startsWith("data:") ||
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
          // Some JS runtimes or mocked textures may throw during clone (eg. VideoFrame missing),
          // so guard the operation and fall back to the original texture when cloning fails.
          let t: THREE.Texture;
          try {
            // Call clone() on the typed THREE.Texture. Keep a try/catch to
            // handle runtimes/tests where clone() may throw; falling back to
            // the original texture preserves behavior without runtime typeof checks.
            t = (tex as THREE.Texture).clone();
          } catch (cloneErr) {
            CoreLogger.warn("MaterialFactory", 'Texture.clone() failed, using original texture', cloneErr);
            t = tex;
          }

          apply(t);
          if (applyTiling) applyTiling(t);
          material.needsUpdate = true;
        })
        .catch((err) => {
          CoreLogger.warn("MaterialFactory", `Failed to load ${label}`, { url, err });
        });
    };

    switch (comp.type) {
      case "standardMaterial": {
        const opts: THREE.MeshStandardMaterialParameters = {
          color: normalizeHexColor(comp.color) ?? 0xffffff,
          metalness: comp.metalness,
          roughness: comp.roughness,
          emissive: normalizeHexColor(comp.emissive),
          emissiveIntensity: comp.emissiveIntensity,
          transparent: comp.transparent,
          opacity: comp.opacity,
        };
        material = new (THREE as any).MeshStandardNodeMaterial(cleanParams(opts));
        break;
      }
      case "basicMaterial": {
        const basic = comp as BasicMaterialComponent;
        const opts: THREE.MeshBasicMaterialParameters = {
          color: normalizeHexColor(basic.color) ?? 0xffffff,
          transparent: basic.transparent,
          opacity: basic.opacity,
          wireframe: basic.wireframe,
        };
        material = new (THREE as any).MeshBasicNodeMaterial(cleanParams(opts));
        break;
      }
      case "phongMaterial": {
        const phong = comp as PhongMaterialComponent;
        const opts: THREE.MeshPhongMaterialParameters = {
          color: normalizeHexColor(phong.color) ?? 0xffffff,
          specular: normalizeHexColor(phong.specular),
          shininess: phong.shininess,
          emissive: normalizeHexColor(phong.emissive),
          transparent: phong.transparent,
          opacity: phong.opacity,
        };
        material = new (THREE as any).MeshPhongNodeMaterial(cleanParams(opts));
        break;
      }
      case "lambertMaterial": {
        const lambert = comp as LambertMaterialComponent;
        const opts: THREE.MeshLambertMaterialParameters = {
          color: normalizeHexColor(lambert.color) ?? 0xffffff,
          emissive: normalizeHexColor(lambert.emissive),
          transparent: lambert.transparent,
          opacity: lambert.opacity,
        };
        material = new (THREE as any).MeshLambertNodeMaterial(cleanParams(opts));
        break;
      }
      default:
        material = new (THREE as any).MeshStandardNodeMaterial({ color: 0xcccccc });
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
