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
 */
export function createRenderingSubsystem(
  options: CreateRenderingStateParams = {},
): EngineSubsystem {
  return defineEngineSubsystem<ReturnType<typeof createRenderingState>>(
    'rendering-three-webgpu',
  )
    .withState(() => createRenderingState(options))
    .onPreRender(syncRender)
    .onRender(renderFrame)
    .onDispose(disposeRender)
    .build();
}
