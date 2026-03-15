import { defineEngineSubsystem, type EngineSubsystem } from '@duckengine/core-v2';
import {
  syncRender,
  renderFrame,
  disposeRender,
  reconcilePendingRenderablesForKey,
  type RenderEngineState,
} from '@duckengine/rendering-base-v2';
import { createRenderingState } from './createRenderingState';

/**
 * Creates the WebGPU rendering engine subsystem. Register via
 * setupEngine({ engineSubsystems: [createRenderingSubsystem()] })
 * or api.registerSubsystem({ subsystem: createRenderingSubsystem() }).
 *
 * When ResourceCachePort is registered (via createResourceCoordinatorSubsystem with createResourceCache),
 * mesh and skybox resolution use the cache. Add createResourceCoordinatorSubsystem({ resourceLoader }) — cache is internal to coordinator.
 * to engineSubsystems for full resource loading.
 */
export function createRenderingSubsystem(): EngineSubsystem {
  return defineEngineSubsystem<RenderEngineState>(
    'rendering-three-webgpu',
  )
    .withState(({ engine }) => createRenderingState({ engine }))
    .onEngineEvent('resource-loaded', reconcilePendingRenderablesForKey)
    .onPreRender(syncRender)
    .onRender(renderFrame)
    .onDispose(disposeRender)
    .build();
}
