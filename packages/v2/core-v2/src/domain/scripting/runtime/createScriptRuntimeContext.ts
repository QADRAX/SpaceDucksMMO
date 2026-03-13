import { buildEntityAPI, buildInputAPI, buildSceneAPI, buildTimeAPI } from '../api';
import type {
  CreateScriptRuntimeContextFromInstanceParams,
  CreateScriptRuntimeContextParams,
  ScriptRuntimeContext,
} from './types';

/**
 * Creates a runtime context from explicit permissions and host callbacks.
 *
 * Use this when permissions were already computed outside (for example,
 * by a script registry/runtime that caches permission sets).
 */
export function createScriptRuntimeContext(
  params: CreateScriptRuntimeContextParams,
): ScriptRuntimeContext {
  const { scene, selfEntity, context } = params;

  return {
    self: buildEntityAPI(selfEntity, scene, true, context?.entityApiContext ?? {}),
    scene: buildSceneAPI(scene, context?.sceneApiContext ?? {}),
    input: buildInputAPI(context?.inputApiContext ?? {}),
    time: buildTimeAPI(context?.timeApiContext ?? {}),
  };
}

/**
 * Creates a runtime context from a script instance by deriving permissions from its schema.
 *
 * This helper is the default path for most callers because it keeps
 * permission derivation + API composition in one place.
 */
export function createScriptRuntimeContextFromScriptInstance(
  params: CreateScriptRuntimeContextFromInstanceParams,
): ScriptRuntimeContext {
  const { scene, selfEntity, context } = params;

  return createScriptRuntimeContext({
    scene,
    selfEntity,
    context,
  });
}

/**
 * Backward-compatible alias for callers still using the old function name.
 */
export function createScriptRuntimeContextFromInstance(
  params: CreateScriptRuntimeContextFromInstanceParams,
): ScriptRuntimeContext {
  return createScriptRuntimeContextFromScriptInstance(params);
}
