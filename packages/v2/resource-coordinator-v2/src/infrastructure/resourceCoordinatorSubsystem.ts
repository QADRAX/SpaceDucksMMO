import { defineEngineSubsystem, type EngineSubsystem } from '@duckengine/core-v2';
import {
  loadRefsOnEntityAdded,
  loadRefsOnComponentChanged,
} from '../application';
import { provideResourceCoordinatorPorts } from '../domain';
import type { ResourceLoader, ResourceCoordinatorState } from '../domain';

/** Options for the resource coordinator subsystem. */
export interface CreateResourceCoordinatorSubsystemOptions {
  /** Loader implementation. Injected by consumer (e.g. webcore client, local bundler). */
  readonly resourceLoader: ResourceLoader;
}

/**
 * Creates the ResourceCoordinator engine subsystem.
 * Registers ResourceCachePort via port providers (internal implementation).
 * Loader is closed over in state. Triggers fetches on entity-added and component-changed.
 */
export function createResourceCoordinatorSubsystem(
  options: CreateResourceCoordinatorSubsystemOptions
): EngineSubsystem {
  const { resourceLoader } = options;
  const provider = provideResourceCoordinatorPorts();
  const base = defineEngineSubsystem<ResourceCoordinatorState>('resource-coordinator')
    .withState(() => ({ resourceLoader }))
    .onSceneEvent('entity-added', loadRefsOnEntityAdded)
    .onSceneEvent('component-changed', loadRefsOnComponentChanged)
    .build();

  return {
    ...base,
    portProviders: [provider],
  };
}
