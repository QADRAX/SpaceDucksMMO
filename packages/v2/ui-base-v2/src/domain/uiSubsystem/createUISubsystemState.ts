import type { SceneSubsystemFactoryContext } from '@duckengine/core-v2';
import {
  UICustomRuntimePortDef,
  UISurfaceHostPortDef,
  UIViewRuntimePortDef,
} from '@duckengine/core-v2';
import type { UISubsystemState } from './types';

/** Optional extras when creating UI subsystem state. */
export interface CreateUISubsystemStateOptions {
  readonly cameraHasTag?: UISubsystemState['cameraHasTag'];
}

/**
 * Creates shared UI subsystem state, resolving host-agnostic UI ports from the registry.
 */
export function createUISubsystemState(
  ctx: SceneSubsystemFactoryContext,
  options?: CreateUISubsystemStateOptions,
): UISubsystemState {
  return {
    sceneId: ctx.scene.id,
    surfaceHost: ctx.ports.get(UISurfaceHostPortDef),
    viewRuntime: ctx.ports.get(UIViewRuntimePortDef),
    customRuntime: ctx.ports.get(UICustomRuntimePortDef),
    cameraHasTag: options?.cameraHasTag,
    mounted: new Set(),
  };
}
