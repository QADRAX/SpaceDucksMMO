import type {
  EngineSubsystemUpdateParams,
  SubsystemUseCase,
  ResourceCachePort,
} from '@duckengine/core-v2';
import { ResourceCachePortDef } from '@duckengine/core-v2';
import { collectRefsFromAllScenes } from '../domain/collectResourceRefs';
import { loadRefsIntoCache } from './loadRefsIntoCache';
import type { ResourceCoordinatorState } from '../domain/types';

/**
 * Loads all mesh, texture, skybox, and script refs from all scenes via ResourceLoader
 * and stores in cache. Runs each frame in earlyUpdate. Only coordinator calls the loader.
 */
export const preloadAllScenesRefs: SubsystemUseCase<
  ResourceCoordinatorState,
  EngineSubsystemUpdateParams,
  void
> = {
  name: 'resource-coordinator/loadAllScenesRefs',
  execute(state, params) {
    const cache = params.ports.get(ResourceCachePortDef) as ResourceCachePort | undefined;
    if (!state.resourceLoader || !cache) return;

    const refs = collectRefsFromAllScenes(params.engine);
    void loadRefsIntoCache(params.engine, state.resourceLoader, cache, refs);
  },
};
