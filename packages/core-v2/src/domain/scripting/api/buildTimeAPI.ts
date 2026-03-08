import type { TimeAPI, TimeAPIBuildContext } from './types';

/**
 * Builds a time API view from host/runtime frame values.
 */
export function buildTimeAPI(context: TimeAPIBuildContext): TimeAPI {
  const delta = context.delta ?? 0;

  return {
    delta,
    deltaSeconds: delta / 1000,
    elapsed: context.elapsed ?? 0,
    frameCount: context.frameCount ?? 0,
    scale: context.scale ?? 1,
  };
}
