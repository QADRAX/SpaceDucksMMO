import { defineEngineSubsystem, type EngineSubsystem } from '@duckengine/core-v2';
import {
  syncRender,
  renderFrame,
  disposeRender,
  reconcilePendingRenderablesForKey,
  type RenderEngineState,
} from '@duckengine/rendering-base-v2';
import {
  createRenderingState,
  type CreateRenderingStateParams,
} from './createRenderingState';

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
  options: CreateRenderingStateParams = {},
): EngineSubsystem {
  return defineEngineSubsystem<RenderEngineState>(
    'rendering-three-gl',
  )
    .withState(({ engine }) => createRenderingState({ ...options, engine }))
    .onEngineEvent('resource-loaded', reconcilePendingRenderablesForKey)
    .onPreRender(syncRender)
    .onRender(renderFrame)
    .onDispose(disposeRender)
    .build();
}
