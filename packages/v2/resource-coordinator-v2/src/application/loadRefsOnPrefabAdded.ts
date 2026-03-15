import {
  defineSubsystemUseCase,
  ResourceCachePortDef,
  createSubsystemPortRegistry,
  type ResourceCachePort,
  type EngineSubsystemSceneEventParams,
} from '@duckengine/core-v2';
import { collectRefsFromSubtree, loadRefsIntoCache } from '../domain';
import type { ResourceCoordinatorState } from '../domain/types';

/**
 * Use case: loads resource refs when a prefab is added to a scene.
 * Collects refs from the prefab entity and its subtree, then loads into cache.
 */
export const loadRefsOnPrefabAdded = defineSubsystemUseCase<
  ResourceCoordinatorState,
  EngineSubsystemSceneEventParams,
  void
>({
  name: 'resource-coordinator/loadRefsOnPrefabAdded',
  execute(state, params) {
    if (params.event.kind !== 'prefab-added') return;
    if (!state.resourceLoader) return;

    const prefabEntity = params.scene.prefabs.get(params.event.prefabId);
    if (!prefabEntity) return;

    const registry = createSubsystemPortRegistry(
      params.engine.subsystemRuntime.ports,
      params.engine.subsystemRuntime.portDefinitions,
    );
    const cache = registry.get(ResourceCachePortDef) as ResourceCachePort | undefined;
    if (!cache) return;

    const refs = collectRefsFromSubtree(prefabEntity);
    void loadRefsIntoCache(params.engine, state.resourceLoader, cache, refs);
  },
});
