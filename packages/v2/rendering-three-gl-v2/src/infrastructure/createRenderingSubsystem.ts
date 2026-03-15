import type { SubsystemPortProvider } from '@duckengine/core-v2';
import { defineEngineSubsystem, type EngineSubsystem } from '@duckengine/core-v2';
import { ViewportRectProviderPortDef } from '@duckengine/core-v2';
import type { ViewportRectProviderPort } from '@duckengine/core-v2';
import {
  syncRender,
  renderFrame,
  disposeRender,
  reconcilePendingRenderablesForKey,
  type RenderEngineState,
} from '@duckengine/rendering-base-v2';
import { createRenderingState } from './createRenderingState';

/** Options for the WebGL rendering subsystem. */
export interface CreateRenderingSubsystemOptions {
  /** Viewport rect provider. Consumer implements based on layout (web, Electron, etc.). */
  readonly viewportRectProvider: ViewportRectProviderPort;
}

/**
 * Creates the WebGL rendering engine subsystem. Register via
 * setupEngine({ engineSubsystems: [createRenderingSubsystem(options)] })
 * or api.registerSubsystem({ subsystem: createRenderingSubsystem(options) }).
 *
 * When ResourceCachePort is registered (via createResourceCoordinatorSubsystem with createResourceCache),
 * mesh and skybox resolution use the cache. Add createResourceCoordinatorSubsystem({ resourceLoader }) — cache is internal to coordinator.
 * to engineSubsystems for full resource loading.
 */
export function createRenderingSubsystem(
  options: CreateRenderingSubsystemOptions,
): EngineSubsystem {
  const { viewportRectProvider } = options;

  const portProvider: SubsystemPortProvider = ({ ports }) => {
    if (!ports.has(ViewportRectProviderPortDef)) {
      ports.register(ViewportRectProviderPortDef, viewportRectProvider);
    }
  };

  const base = defineEngineSubsystem<RenderEngineState>('rendering-three-gl')
    .withState(({ engine }) => createRenderingState({ engine }))
    .onEngineEvent('resource-loaded', reconcilePendingRenderablesForKey)
    .onPreRender(syncRender)
    .onRender(renderFrame)
    .onDispose(disposeRender)
    .build();

  return {
    ...base,
    portProviders: [portProvider],
  };
}
