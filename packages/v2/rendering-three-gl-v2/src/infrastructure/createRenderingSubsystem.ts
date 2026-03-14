import { defineEngineSubsystem, type EngineSubsystem } from '@duckengine/core-v2';
import { syncRender, renderFrame, disposeRender } from '@duckengine/rendering-base-v2';
import {
  createRenderingState,
  type CreateRenderingStateParams,
} from './createRenderingState';

/**
 * Creates the WebGL rendering engine subsystem. Register via
 * setupEngine({ engineSubsystems: [createRenderingSubsystem(options)] })
 * or api.registerSubsystem({ subsystem: createRenderingSubsystem(options) }).
 *
 * When ResourceCachePort is registered (via deriveResourceCache), mesh and skybox
 * resolution use the cache. Add deriveResourceCache to portDerivers and
 * createResourceCoordinatorSubsystem to sceneSubsystems for full resource loading.
 */
export function createRenderingSubsystem(
  options: CreateRenderingStateParams = {},
): EngineSubsystem {
  return defineEngineSubsystem<ReturnType<typeof createRenderingState>>(
    'rendering-three-gl',
  )
    .withState(({ engine }) => createRenderingState({ ...options, engine }))
    .onPreRender(syncRender)
    .onRender(renderFrame)
    .onDispose(disposeRender)
    .build();
}
