import type { SubsystemPortDeriver } from '@duckengine/core-v2';
import { ResourceLoaderPortDef, ResourceCachePortDef } from '@duckengine/core-v2';
import { createResourceRuntimeCache } from './resourceRuntimeCache';

/**
 * Port deriver that registers ResourceCachePort when ResourceLoaderPort exists.
 * Add to setupEngine portDerivers: [deriveResourceCache, ...].
 *
 * The cache converts async ResourceLoaderPort into sync lookups for mesh, texture, skybox.
 */
export const deriveResourceCache: SubsystemPortDeriver = ({ ports }) => {
  if (ports.has(ResourceCachePortDef)) return;

  const resourceLoader = ports.get(ResourceLoaderPortDef);
  if (!resourceLoader) return;

  const cache = createResourceRuntimeCache(resourceLoader);
  ports.register(ResourceCachePortDef, cache);
};
