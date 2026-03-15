import type * as THREE from 'three';
import type { MaterialComponent, ResourceRef } from '@duckengine/core-v2';
import { parseColor } from './parseColor';
import type { TextureResolver } from './renderContextThree';

/**
 * Builds a Three.js Material from a plain material component (standard/basic/phong/lambert).
 * When textureResolver is provided, applies albedo and other texture maps from ResourceRefs.
 * @param three - Injected THREE module from backend (three or three/webgpu).
 */
export function materialFromComponent(
  comp: MaterialComponent,
  textureResolver: TextureResolver | undefined,
  three: typeof import('three'),
): THREE.Material {
  const color = comp.color ? parseColor(comp.color, 0xcccccc) : 0xcccccc;
  const transparent = comp.transparent ?? false;
  const opacity = comp.opacity ?? 1;

  const map = textureResolver && comp.albedo ? textureResolver(comp.albedo) : undefined;

  switch (comp.type) {
    case 'basicMaterial': {
      const mat = new three.MeshBasicMaterial({ color, transparent, opacity, map });
      if (comp.wireframe) mat.wireframe = true;
      return mat;
    }
    case 'lambertMaterial':
      return new three.MeshLambertMaterial({
        color,
        transparent,
        opacity,
        map,
        emissive: comp.emissive ? parseColor(comp.emissive, 0x000000) : 0x000000,
      });
    case 'phongMaterial':
      return new three.MeshPhongMaterial({
        color,
        transparent,
        opacity,
        map,
        specular: comp.specular ? parseColor(comp.specular, 0x111111) : 0x111111,
        shininess: comp.shininess ?? 30,
        emissive: comp.emissive ? parseColor(comp.emissive, 0x000000) : 0x000000,
      });
    case 'standardMaterial':
    default: {
      const std = comp as MaterialComponent & {
        metalness?: number;
        roughness?: number;
        emissive?: string;
        emissiveIntensity?: number;
        normalMap?: ResourceRef<'texture'>;
        aoMap?: ResourceRef<'texture'>;
        roughnessMap?: ResourceRef<'texture'>;
        metallicMap?: ResourceRef<'texture'>;
        envMap?: ResourceRef<'texture'>;
      };
      const mat = new three.MeshStandardMaterial({
        color,
        transparent,
        opacity,
        map,
        metalness: std.metalness ?? 0,
        roughness: std.roughness ?? 1,
        emissive: std.emissive ? parseColor(std.emissive, 0x000000) : 0x000000,
        emissiveIntensity: std.emissiveIntensity ?? 0,
      });
      if (textureResolver) {
        if (std.normalMap) mat.normalMap = textureResolver(std.normalMap) ?? null;
        if (std.aoMap) mat.aoMap = textureResolver(std.aoMap) ?? null;
        if (std.roughnessMap) mat.roughnessMap = textureResolver(std.roughnessMap) ?? null;
        if (std.metallicMap) mat.metalnessMap = textureResolver(std.metallicMap) ?? null;
        if (std.envMap) mat.envMap = textureResolver(std.envMap) ?? null;
      }
      return mat;
    }
  }
}
