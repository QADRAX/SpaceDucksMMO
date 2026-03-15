import type { MeshGeometryFileData, ResourceCachePort } from '@duckengine/core-v2';
import type { MeshResolver, SkyboxResolver, TextureResolver } from '../domain/renderContextThree';
import { createTextureResolversFromRawCache } from './createTextureResolversFromRawCache';

/**
 * Assembles mesh, texture, and skybox resolvers from a resource cache port.
 * When cache is absent, returns no-op getMeshData and undefined texture/skybox resolvers.
 * @param three - Injected THREE module from backend (three or three/webgpu).
 */
export function createResolversFromResourceCache(
  cache: ResourceCachePort | null | undefined,
  three: typeof import('three'),
): {
  getMeshData: MeshResolver;
  getSkyboxTexture?: SkyboxResolver;
  getTexture?: TextureResolver;
} {
  if (!cache) {
    return { getMeshData: () => null };
  }

  const c = cache;
  const rawResolvers = createTextureResolversFromRawCache(c, three);

  const getMeshData: MeshResolver = c.getMeshData
    ? (ref) => (c.getMeshData!(ref) ?? null) as MeshGeometryFileData | null
    : () => null;

  return {
    getMeshData,
    getSkyboxTexture: rawResolvers.getSkyboxTexture,
    getTexture: rawResolvers.getTexture,
  };
}
