import {
  defineSubsystemUseCase,
  type SubsystemEngineEventParams,
} from '@duckengine/core-v2';
import type { RenderEngineState } from '../domain';

const RENDERABLE_KINDS = ['mesh', 'texture', 'skybox'] as const;

/**
 * Use case: reconciles pending renderables when a resource is loaded.
 * Triggers an immediate sync so mesh/texture/skybox appear in the same frame.
 * Used by rendering-three-gl and rendering-three-webgpu.
 */
export const reconcilePendingRenderablesForKey = defineSubsystemUseCase<
  RenderEngineState,
  SubsystemEngineEventParams,
  void
>({
  name: 'rendering/reconcilePendingRenderablesForKey',
  execute(state, params) {
    const { engine, event } = params;
    if (event.kind !== 'resource-loaded') return;
    if (!RENDERABLE_KINDS.includes(event.ref.kind as (typeof RENDERABLE_KINDS)[number])) return;

    state.sync(engine, 0);
  },
});
