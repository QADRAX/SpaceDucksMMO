import type { SubsystemPortProvider } from '@duckengine/core-v2';
import { ResourceCachePortDef } from '@duckengine/core-v2';
import { createResourceRuntimeCache } from './resourceRuntimeCache';

/**
 * Port provider that registers ResourceCachePort.
 * Cache is created internally by the coordinator; no consumer injection.
 */
export function provideResourceCoordinatorPorts(): SubsystemPortProvider {
  const cache = createResourceRuntimeCache();

  return ({ ports }) => {
    if (!ports.has(ResourceCachePortDef)) {
      ports.register(ResourceCachePortDef, cache);
    }
  };
}
