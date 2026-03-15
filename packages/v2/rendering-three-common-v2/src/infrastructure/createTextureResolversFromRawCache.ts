import * as THREE from 'three';
import type { ResourceRef } from '@duckengine/core-v2';
import type { SkyboxResolver, TextureResolver } from '../domain/renderContextThree';

/**
 * Input shape for texture/skybox resolution.
 * Matches ResourceCachePort: getTexture → Blob | null, getSkyboxTexture → string[] | null.
 */
export interface RawResourceCacheInput {
  getTexture?(ref: ResourceRef<'texture'>): Blob | null;
  getSkyboxTexture?(ref: ResourceRef<'skybox'>): string[] | null;
}

function cacheKey(ref: ResourceRef<'texture' | 'skybox'>): string {
  return `${ref.key}@${ref.version ?? 'active'}`;
}

/**
 * Creates THREE.Texture/CubeTexture resolvers from a raw cache (Blob, string[]).
 * Parses on demand and caches parsed THREE objects.
 */
export function createTextureResolversFromRawCache(
  rawCache: RawResourceCacheInput,
): { getTexture?: TextureResolver; getSkyboxTexture?: SkyboxResolver } {
  const textureCache = new Map<string, THREE.Texture>();
  const skyboxCache = new Map<string, THREE.CubeTexture>();
  const textureLoader = new THREE.TextureLoader();
  const cubeTextureLoader = new THREE.CubeTextureLoader();

  const getTexture: TextureResolver | undefined = rawCache.getTexture
    ? (ref) => {
        const key = cacheKey(ref);
        const cached = textureCache.get(key);
        if (cached) return cached;

        const blob = rawCache.getTexture!(ref);
        if (!blob) return null;

        const url = URL.createObjectURL(blob);
        const texture = textureLoader.load(
          url,
          () => URL.revokeObjectURL(url),
          undefined,
          () => URL.revokeObjectURL(url),
        );
        textureCache.set(key, texture);
        return texture;
      }
    : undefined;

  const getSkyboxTexture: SkyboxResolver | undefined = rawCache.getSkyboxTexture
    ? (ref) => {
        const key = cacheKey(ref);
        const cached = skyboxCache.get(key);
        if (cached) return cached;

        const urls = rawCache.getSkyboxTexture!(ref);
        if (!urls || urls.length < 6) return null;

        const cubeTexture = cubeTextureLoader.load(urls.slice(0, 6));
        skyboxCache.set(key, cubeTexture);
        return cubeTexture;
      }
    : undefined;

  return { getTexture, getSkyboxTexture };
}
