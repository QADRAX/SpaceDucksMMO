import {
  defineSubsystemUseCase,
  ResourceCachePortDef,
  createSubsystemPortRegistry,
  type ResourceCachePort,
  type EngineSubsystemSceneEventParams,
} from '@duckengine/core-v2';
import { collectRefsFromEntity, loadRefsIntoCache } from '../domain';
import type { ResourceCoordinatorState } from '../domain/types';

/**
 * Use case: loads resource refs when a component on an entity changes.
 * Collects refs from the entity (component may have added resource refs).
 */
export const loadRefsOnComponentChanged = defineSubsystemUseCase<
  ResourceCoordinatorState,
  EngineSubsystemSceneEventParams,
  void
>({
  name: 'resource-coordinator/loadRefsOnComponentChanged',
  execute(state, params) {
    if (params.event.kind !== 'component-changed') return;
    if (!state.resourceLoader) return;

    const entity = params.scene.entities.get(params.event.entityId);
    if (!entity) return;

    const registry = createSubsystemPortRegistry(
      params.engine.subsystemRuntime.ports,
      params.engine.subsystemRuntime.portDefinitions
    );
    const cache = registry.get(ResourceCachePortDef) as ResourceCachePort | undefined;
    if (!cache) return;

    const refs = collectRefsFromEntity(entity);
    void loadRefsIntoCache(params.engine, state.resourceLoader, cache, refs);
  },
});
