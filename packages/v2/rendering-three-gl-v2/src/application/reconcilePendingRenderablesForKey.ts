import type { SubsystemEngineEventParams } from '@duckengine/core-v2';
import type { RenderEngineState } from '@duckengine/rendering-base-v2';

const RENDERABLE_KINDS = ['mesh', 'texture', 'skybox'] as const;

/**
 * Reconciles pending renderables when a resource is loaded.
 * Triggers an immediate sync so mesh/texture/skybox appear in the same frame.
 */
export const reconcilePendingRenderablesForKey = {
  name: 'rendering/reconcilePendingRenderablesForKey',
  execute(state: RenderEngineState, params: SubsystemEngineEventParams): void {
    const { engine, event } = params;
    if (event.kind !== 'resource-loaded') return;
    if (!RENDERABLE_KINDS.includes(event.ref.kind as (typeof RENDERABLE_KINDS)[number])) return;

    state.sync(engine, 0);
  },
};
