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
 * Use case: loads resource refs when an entity is added to a scene.
 * Collects refs from the entity and its subtree, then loads into cache.
 */
export const loadRefsOnEntityAdded = defineSubsystemUseCase<
  ResourceCoordinatorState,
  EngineSubsystemSceneEventParams,
  void
>({
  name: 'resource-coordinator/loadRefsOnEntityAdded',
  execute(state, params) {
    if (params.event.kind !== 'entity-added') return;
    if (!state.resourceLoader) return;

    const entity = params.scene.entities.get(params.event.entityId);
    if (!entity) return;

    const registry = createSubsystemPortRegistry(
      params.engine.subsystemRuntime.ports,
      params.engine.subsystemRuntime.portDefinitions
    );
    const cache = registry.get(ResourceCachePortDef) as ResourceCachePort | undefined;
    if (!cache) return;

    const refs = collectRefsFromSubtree(entity);
    void loadRefsIntoCache(params.engine, state.resourceLoader, cache, refs);
  },
});
