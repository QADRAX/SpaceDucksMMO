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
 */
export function createRenderingSubsystem(
  options: CreateRenderingStateParams = {},
): EngineSubsystem {
  return defineEngineSubsystem<ReturnType<typeof createRenderingState>>(
    'rendering-three-gl',
  )
    .withState(() => createRenderingState(options))
    .onPreRender(syncRender)
    .onRender(renderFrame)
    .onDispose(disposeRender)
    .build();
}
