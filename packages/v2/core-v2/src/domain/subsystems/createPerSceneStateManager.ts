import type { EngineState } from '../engine';
import type { SceneId } from '../ids';
import type { SceneState } from '../scene';

/**
 * Options for creating a per-scene state manager.
 * Engine subsystems that need per-scene state (e.g. rendering) use this to orchestrate
 * creation and lifecycle. Resource coordinator does NOT use this — it has engine-level state only.
 */
export interface CreatePerSceneStateManagerOptions<TState> {
  /** Factory that creates per-scene state. Called when a scene is first accessed. */
  createSceneState: (engine: EngineState, scene: SceneState) => TState;
  /** Called when new per-scene state is created. Use to register scene-scoped ports (e.g. GizmoPort). */
  onSceneStateCreated: (scene: SceneState, state: TState) => void;
}

/**
 * Result of createPerSceneStateManager.
 */
export interface PerSceneStateManagerResult<TState> {
  readonly perScene: Map<SceneId, TState>;
  getOrCreateSceneState(engine: EngineState, sceneId: SceneId): TState | undefined;
}

/**
 * Generic per-scene state manager for engine subsystems.
 *
 * Engine subsystems like rendering need state per scene (Three.js scene, gizmo drawer, etc.).
 * This provides the orchestration: map, getOrCreate, and onSceneStateCreated callback.
 *
 * Resource coordinator does NOT use this — it has engine-level cache only, no per-scene state.
 *
 * @example
 * ```ts
 * const { perScene, getOrCreateSceneState } = createPerSceneStateManager(engine, {
 *   createSceneState: (engine, scene) => ({ threeScene: new THREE.Scene(), ... }),
 *   onSceneStateCreated: (scene, state) => scene.scenePorts.set(GizmoPortDef.id, createGizmo(state)),
 * });
 * ```
 */
export function createPerSceneStateManager<TState>(
  _engine: EngineState,
  options: CreatePerSceneStateManagerOptions<TState>,
): PerSceneStateManagerResult<TState> {
  const { createSceneState, onSceneStateCreated } = options;
  const perScene = new Map<SceneId, TState>();

  function getOrCreateSceneState(
    engine: EngineState,
    sceneId: SceneId,
  ): TState | undefined {
    let state = perScene.get(sceneId);
    if (state) return state;

    const scene = engine.scenes.get(sceneId);
    if (!scene) return undefined;

    state = createSceneState(engine, scene);
    perScene.set(sceneId, state);
    onSceneStateCreated(scene, state);
    return state;
  }

  return { perScene, getOrCreateSceneState };
}
