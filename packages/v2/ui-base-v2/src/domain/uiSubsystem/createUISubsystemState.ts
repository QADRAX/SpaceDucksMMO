import type { SceneSubsystemFactoryContext } from '@duckengine/core-v2';
import {
  UISpaRuntimePortDef,
  UISurfaceHostPortDef,
  UIViewRuntimePortDef,
} from '@duckengine/core-v2';
import type { UISubsystemState } from './types';

/** Optional extras when creating UI subsystem state. */
export interface CreateUISubsystemStateOptions {
  readonly cameraHasTag?: UISubsystemState['cameraHasTag'];
}

/**
 * Creates UI subsystem state, resolving host-agnostic UI ports from the registry.
 */
export function createUISubsystemState(
  ctx: SceneSubsystemFactoryContext,
  options?: CreateUISubsystemStateOptions,
): UISubsystemState {
  return {
    sceneId: ctx.scene.id,
    surfaceHost: ctx.ports.get(UISurfaceHostPortDef),
    viewRuntime: ctx.ports.get(UIViewRuntimePortDef),
    spaRuntime: ctx.ports.get(UISpaRuntimePortDef),
    cameraHasTag: options?.cameraHasTag,
    mounted: new Set(),
  };
}
