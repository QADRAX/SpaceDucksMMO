import * as THREE from 'three';
import type { ResourceRef } from '@duckengine/core-v2';
import type { SkyboxResolver, TextureResolver } from '../domain/renderContextThree';

/** Raw cache: getTexture returns Blob | null, getSkyboxTexture returns string[] | null. */
export interface RawResourceCache {
  getTexture?(ref: ResourceRef<'texture'>): unknown;
  getSkyboxTexture?(ref: ResourceRef<'skybox'>): unknown;
}

/**
 * Creates THREE.Texture/CubeTexture resolvers from a raw cache (Blob, string[]).
 * Parses on demand and caches parsed THREE objects.
 */
export function createTextureResolversFromRawCache(
  rawCache: RawResourceCache,
): { getTexture?: TextureResolver; getSkyboxTexture?: SkyboxResolver } {
  const textureCache = new Map<string, THREE.Texture>();
  const skyboxCache = new Map<string, THREE.CubeTexture>();
  const textureLoader = new THREE.TextureLoader();
  const cubeTextureLoader = new THREE.CubeTextureLoader();

  function cacheKey(ref: ResourceRef<'texture' | 'skybox'>): string {
    return `${ref.key}@${ref.version ?? 'active'}`;
  }

  const getTexture: TextureResolver | undefined = rawCache.getTexture
    ? (ref) => {
        const key = cacheKey(ref);
        const cached = textureCache.get(key);
        if (cached) return cached;

        const raw = rawCache.getTexture!(ref);
        if (raw == null) return null;

        if (raw instanceof Blob) {
          const url = URL.createObjectURL(raw);
          const texture = textureLoader.load(
            url,
            () => URL.revokeObjectURL(url),
            undefined,
            () => URL.revokeObjectURL(url),
          );
          textureCache.set(key, texture);
          return texture;
        }
        if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'string') {
          const texture = textureLoader.load(raw[0] as string);
          textureCache.set(key, texture);
          return texture;
        }
        return null;
      }
    : undefined;

  const getSkyboxTexture: SkyboxResolver | undefined = rawCache.getSkyboxTexture
    ? (ref) => {
        const key = cacheKey(ref);
        const cached = skyboxCache.get(key);
        if (cached) return cached;

        const urls = rawCache.getSkyboxTexture!(ref) as string[] | null | undefined;
        if (!urls || urls.length < 6) return null;

        const cubeTexture = cubeTextureLoader.load(urls);
        skyboxCache.set(key, cubeTexture);
        return cubeTexture;
      }
    : undefined;

  return { getTexture, getSkyboxTexture };
}
