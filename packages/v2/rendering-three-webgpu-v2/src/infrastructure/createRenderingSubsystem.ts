import { defineEngineSubsystem, type EngineSubsystem } from '@duckengine/core-v2';
import { syncRender, renderFrame, disposeRender } from '@duckengine/rendering-base-v2';
import {
  createRenderingState,
  type CreateRenderingStateParams,
} from './createRenderingState';

/**
 * Creates the WebGPU rendering engine subsystem. Register via
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
  return defineEngineSubsystem<ReturnType<typeof createRenderingState>>(
    'rendering-three-webgpu',
  )
    .withState(({ engine }) => createRenderingState({ ...options, engine }))
    .onPreRender(syncRender)
    .onRender(renderFrame)
    .onDispose(disposeRender)
    .build();
}
