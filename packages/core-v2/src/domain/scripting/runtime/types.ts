import type { EntityState } from '../../entities';
import type { SceneState } from '../../scene';
import type {
  EntityAPI,
  InputAPI,
  InputAPIBuildContext,
  SceneAPI,
  SceneAPIBuildContext,
  ScriptAPIBuildContext,
  TimeAPI,
  TimeAPIBuildContext,
} from '../api';
import type { ScriptInstance } from '../schema';

/** Runtime API bundle exposed to a script execution host. */
export interface ScriptRuntimeContext {
  readonly self: EntityAPI;
  readonly scene: SceneAPI;
  readonly input: InputAPI;
  readonly time: TimeAPI;
}

/** Host extension points used to compose a runtime context. */
export interface ScriptRuntimeBuildContext {
  readonly entityApiContext?: ScriptAPIBuildContext;
  readonly sceneApiContext?: SceneAPIBuildContext;
  readonly inputApiContext?: InputAPIBuildContext;
  readonly timeApiContext?: TimeAPIBuildContext;
}

/** Input contract for building context from explicit parameters. */
export interface CreateScriptRuntimeContextParams {
  readonly scene: SceneState;
  readonly selfEntity: EntityState;
  readonly context?: ScriptRuntimeBuildContext;
}

/** Input contract for building context from a script instance. */
export interface CreateScriptRuntimeContextFromInstanceParams {
  readonly scene: SceneState;
  readonly selfEntity: EntityState;
  readonly instance: ScriptInstance;
  readonly context?: ScriptRuntimeBuildContext;
}
