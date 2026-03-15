import type { MeshGeometryFileData, ResourceRef } from '@duckengine/core-v2';
import type { MeshResolver, SkyboxResolver, TextureResolver } from '../domain/renderContextThree';
import { createTextureResolversFromRawCache, type RawResourceCache } from './createTextureResolversFromRawCache';

/** Resource cache shape from engine ports (getMeshData + raw texture/skybox). */
export interface ResourceCachePort {
  getMeshData?(ref: ResourceRef<'mesh'>): unknown;
  getTexture?(ref: ResourceRef<'texture'>): unknown;
  getSkyboxTexture?(ref: ResourceRef<'skybox'>): unknown;
}

/**
 * Assembles mesh, texture, and skybox resolvers from a resource cache port.
 * When cache is absent, returns no-op getMeshData and undefined texture/skybox resolvers.
 * Accepts unknown for cache (from engine ports) and treats falsy as absent.
 */
export function createResolversFromResourceCache(cache: unknown): {
  getMeshData: MeshResolver;
  getSkyboxTexture?: SkyboxResolver;
  getTexture?: TextureResolver;
} {
  if (!cache) {
    return { getMeshData: () => null };
  }

  const c = cache as ResourceCachePort;
  const rawResolvers = createTextureResolversFromRawCache(c as RawResourceCache);

  const getMeshData: MeshResolver = c.getMeshData
    ? (ref) => (c.getMeshData!(ref) ?? null) as MeshGeometryFileData | null
    : () => null;

  return {
    getMeshData,
    getSkyboxTexture: rawResolvers.getSkyboxTexture,
    getTexture: rawResolvers.getTexture,
  };
}
