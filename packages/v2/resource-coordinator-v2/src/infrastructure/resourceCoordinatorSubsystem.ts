import { defineEngineSubsystem, type EngineSubsystem } from '@duckengine/core-v2';
import { preloadAllScenesRefs } from '../application';
import { provideResourceCoordinatorPorts } from './provideResourceCoordinatorPorts';
import type { ResourceLoader } from '../domain/resourceLoader';
import type { ResourceCoordinatorState } from '../domain/types';

/** Options for the resource coordinator subsystem. */
export interface CreateResourceCoordinatorSubsystemOptions {
  /** Loader implementation. Injected by consumer (e.g. webcore client, local bundler). */
  readonly resourceLoader: ResourceLoader;
}

/**
 * Creates the ResourceCoordinator engine subsystem.
 * Registers ResourceCachePort via port providers (internal implementation).
 * Loader is closed over in state. Calls loader to load assets and stores in cache.
 */
export function createResourceCoordinatorSubsystem(
  options: CreateResourceCoordinatorSubsystemOptions
): EngineSubsystem {
  const { resourceLoader } = options;
  const provider = provideResourceCoordinatorPorts();
  const base = defineEngineSubsystem<ResourceCoordinatorState>('resource-coordinator')
    .withState(() => ({ resourceLoader }))
    .onEarlyUpdate(preloadAllScenesRefs)
    .updateWhenPaused(true)
    .build();

  return {
    ...base,
    portProviders: [provider],
  };
}
