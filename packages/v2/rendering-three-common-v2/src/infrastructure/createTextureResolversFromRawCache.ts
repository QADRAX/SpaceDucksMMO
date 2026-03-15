import * as THREE from 'three';
import type { ResourceRef } from '@duckengine/core-v2';
import type { SkyboxResolver, TextureResolver } from '../domain/renderContextThree';

/** Raw texture data from cache. Coordinator stores Blob; alternative backends may use single URL. */
export type RawTextureData = Blob | readonly [string, ...unknown[]];

/** Raw skybox data from cache. Coordinator stores 6 face URLs (px, nx, py, ny, pz, nz). */
export type RawSkyboxData = readonly [string, string, string, string, string, string];

/**
 * Input shape for texture/skybox resolution.
 * ResourceCachePort returns unknown; we narrow via type guards.
 */
export interface RawResourceCacheInput {
  getTexture?(ref: ResourceRef<'texture'>): unknown;
  getSkyboxTexture?(ref: ResourceRef<'skybox'>): unknown;
}

function isRawTextureData(raw: unknown): raw is RawTextureData {
  if (raw instanceof Blob) return true;
  return Array.isArray(raw) && raw.length > 0 && typeof raw[0] === 'string';
}

function isRawSkyboxData(raw: unknown): raw is RawSkyboxData {
  return (
    Array.isArray(raw) &&
    raw.length >= 6 &&
    raw.slice(0, 6).every((x): x is string => typeof x === 'string')
  );
}

function textureDataToLoadUrl(raw: RawTextureData): string {
  if (raw instanceof Blob) return URL.createObjectURL(raw);
  return raw[0];
}

function cacheKey(ref: ResourceRef<'texture' | 'skybox'>): string {
  return `${ref.key}@${ref.version ?? 'active'}`;
}

/**
 * Creates THREE.Texture/CubeTexture resolvers from a raw cache (Blob, string[]).
 * Parses on demand and caches parsed THREE objects.
 * Accepts cache returning unknown; narrows via type guards.
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

        const raw = rawCache.getTexture!(ref);
        if (!isRawTextureData(raw)) return null;

        const url = textureDataToLoadUrl(raw);
        const texture = textureLoader.load(
          url,
          () => (raw instanceof Blob ? URL.revokeObjectURL(url) : undefined),
          undefined,
          () => (raw instanceof Blob ? URL.revokeObjectURL(url) : undefined),
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

        const raw = rawCache.getSkyboxTexture!(ref);
        if (!isRawSkyboxData(raw)) return null;

        const cubeTexture = cubeTextureLoader.load(raw.slice(0, 6));
        skyboxCache.set(key, cubeTexture);
        return cubeTexture;
      }
    : undefined;

  return { getTexture, getSkyboxTexture };
}
