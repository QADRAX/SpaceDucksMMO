import type { EngineState } from './types';
import type { UseCaseGuard } from '../useCases/types';
import type { SceneId, EntityId } from '../ids';

import { ok, err } from '../utils';
import { findScene, isCameraEntity } from './engineValidation';

/**
 * A guard backed by `EngineState` as root — cross-domain precondition
 * that validates engine-level invariants before a use case executes.
 *
 * @template TState  - The resolved domain state the guarded use case operates on.
 * @template TParams - The use case params the guard inspects.
 */
export type EngineGuard<TState, TParams> = UseCaseGuard<EngineState, TState, TParams>;

/**
 * Engine guard: validates that setupEngine has been executed.
 * Use on update, updateScene, registerSubsystem and any use case that depends on ports/subsystems.
 */
export const guardEngineSetupComplete: EngineGuard<unknown, unknown> = (engine, _state, _params) => {
  if (!engine.setupComplete) {
    return err('validation', 'Engine setup required. Call api.setup() before update or other setup-dependent operations.');
  }
  return ok(undefined);
};

/**
 * Engine guard: validates that `params.sceneId` references an existing scene.
 *
 * Generic over `TState` — works with any domain state (viewport, scene, engine)
 * because it only needs the engine root to look up the scene.
 */
export const guardSceneExists: EngineGuard<unknown, { readonly sceneId: SceneId }> = (
  engine,
  _state,
  params,
) => {
  if (!findScene(engine, params.sceneId)) {
    return err('not-found', `Scene '${params.sceneId}' not found.`);
  }
  return ok(undefined);
};

/**
 * Engine guard: validates that `params.cameraEntityId` exists in the
 * current scene and owns a `cameraView` component.
 *
 * Requires a state with `sceneId` so it can resolve the scene.
 * Naturally fits viewport state but works with any state that
 * carries a `sceneId`.
 */
export const guardCameraInScene: EngineGuard<
  { readonly sceneId: SceneId },
  { readonly cameraEntityId: EntityId }
> = (engine, state, params) => {
  const scene = findScene(engine, state.sceneId);
  if (!scene) {
    return err('not-found', `Scene '${state.sceneId}' not found.`);
  }
  if (!isCameraEntity(scene, params.cameraEntityId)) {
    return err(
      'not-found',
      `Camera entity '${params.cameraEntityId}' not found in scene '${state.sceneId}'.`,
    );
  }
  return ok(undefined);
};
