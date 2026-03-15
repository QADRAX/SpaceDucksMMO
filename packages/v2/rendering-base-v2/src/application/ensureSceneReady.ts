import { defineSubsystemUseCase } from '@duckengine/core-v2';
import type { RenderEngineState } from '../domain';
import type { EngineSubsystemSceneAddedParams } from '@duckengine/core-v2';

/**
 * Use case: ensure per-scene state exists when a scene is added.
 * Registers GizmoPort and other scene-scoped ports before scene subsystems run createState.
 */
export const ensureSceneReady = defineSubsystemUseCase<
  RenderEngineState,
  EngineSubsystemSceneAddedParams,
  void
>({
  name: 'rendering/ensureSceneReady',
  execute(state, { engine, scene }) {
    state.ensureSceneReady(engine, scene.id);
  },
});
