import type { SceneId, EntityId } from '@duckengine/core-v2';
import { createEntity, createComponent, createSceneId, createEntityId } from '@duckengine/core-v2';
import type { createDuckEngineAPI } from '@duckengine/core-v2';

type DuckEngineAPI = ReturnType<typeof createDuckEngineAPI>;
import { setupScriptingIntegrationTest } from './setup';
import type { ScriptingSubsystemConfig } from '../scriptingSubsystem';

/** Script reference shape for addEntityWithScripts. */
export interface ScriptRef {
  scriptId: string;
  enabled?: boolean;
  properties?: Record<string, unknown>;
}

/** Result of createScriptingTestFixtures. */
export interface ScriptingTestFixtures {
  api: DuckEngineAPI;
  sceneId: SceneId;
  entityId: EntityId;
  scene: ReturnType<DuckEngineAPI['scene']>;
  /** Add a scene with an entity. Call before addScripts. */
  addSceneWithEntity: (sceneId?: SceneId, entityId?: EntityId) => ScriptingTestFixtures;
  /** Add script component to the entity. */
  addEntityWithScripts: (scripts: ScriptRef[]) => ScriptingTestFixtures;
  /** Wait for async slot initialization. */
  waitForSlotInit: (ms?: number) => Promise<void>;
  /** Run N update frames. */
  runFrames: (count: number, dt?: number) => void;
  /** Trigger reconcile. */
  reconcile: () => void;
}

const DEFAULT_SCENE_ID = createSceneId('main');
const DEFAULT_ENTITY_ID = createEntityId('e1');

/**
 * Waits for async slot initialization.
 *
 * @param ms - Delay in milliseconds. Default 50.
 */
export async function waitForSlotInit(ms = 50): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Runs N update frames with the given dt.
 *
 * @param api - Engine API.
 * @param count - Number of frames.
 * @param dt - Delta time per frame. Default 0.016.
 */
export function runFrames(
  api: DuckEngineAPI,
  count: number,
  dt = 0.016,
): void {
  for (let i = 0; i < count; i++) {
    api.update({ dt });
  }
}

/**
 * Creates a scene and returns the scene API.
 */
export function createScene(
  api: DuckEngineAPI,
  sceneId: SceneId = DEFAULT_SCENE_ID,
): ReturnType<DuckEngineAPI['scene']> {
  api.addScene({ sceneId });
  return api.scene(sceneId);
}

/**
 * Adds a scene and entity. Returns the scene API.
 */
export function addSceneWithEntity(
  api: DuckEngineAPI,
  sceneId: SceneId = DEFAULT_SCENE_ID,
  entityId: EntityId = DEFAULT_ENTITY_ID,
): ReturnType<DuckEngineAPI['scene']> {
  const scene = createScene(api, sceneId);
  scene.addEntity({ entity: createEntity(entityId) });
  return scene;
}

/**
 * Adds an entity to an existing scene.
 * Use when adding entities at runtime (e.g. dynamic spawn scenarios).
 */
export function addEntityToScene(
  api: DuckEngineAPI,
  sceneId: SceneId,
  entityId: EntityId,
): void {
  const scene = api.scene(sceneId);
  scene.addEntity({ entity: createEntity(entityId) });
}

/**
 * Adds a script component to an entity.
 */
export function addEntityWithScripts(
  api: DuckEngineAPI,
  sceneId: SceneId,
  entityId: EntityId,
  scripts: ScriptRef[],
): void {
  const scene = api.scene(sceneId);
  const scriptComp = createComponent('script', {
    scripts: scripts.map((s) => ({
      scriptId: s.scriptId,
      enabled: s.enabled ?? true,
      properties: s.properties ?? {},
    })),
  });
  scene.entity(entityId).addComponent({ component: scriptComp });
}

/**
 * Creates reusable test fixtures for scripting integration tests.
 *
 * @param options - Optional config and custom scene/entity IDs.
 */
export async function createScriptingTestFixtures(options?: {
  config?: ScriptingSubsystemConfig;
  sceneId?: SceneId;
  entityId?: EntityId;
}): Promise<ScriptingTestFixtures> {
  const { api } = await setupScriptingIntegrationTest({
    config: options?.config,
  });

  const sceneId = options?.sceneId ?? DEFAULT_SCENE_ID;
  const entityId = options?.entityId ?? DEFAULT_ENTITY_ID;

  let scene: ReturnType<DuckEngineAPI['scene']> | null = null;

  const addSceneWithEntityFn = (
    sid: SceneId = sceneId,
    eid: EntityId = entityId,
  ): ScriptingTestFixtures => {
    addSceneWithEntity(api, sid, eid);
    scene = api.scene(sid);
    return fixtures;
  };

  const addEntityWithScriptsFn = (scripts: ScriptRef[]): ScriptingTestFixtures => {
    if (!scene) {
      addSceneWithEntity(api, sceneId, entityId);
      scene = api.scene(sceneId);
    }
    addEntityWithScripts(api, sceneId, entityId, scripts);
    return fixtures;
  };

  const fixtures: ScriptingTestFixtures = {
    api,
    sceneId,
    entityId,
    get scene() {
      if (!scene) {
        addSceneWithEntity(api, sceneId, entityId);
        scene = api.scene(sceneId);
      }
      return scene;
    },
    addSceneWithEntity: addSceneWithEntityFn,
    addEntityWithScripts: addEntityWithScriptsFn,
    waitForSlotInit: (ms = 50) => waitForSlotInit(ms),
    runFrames: (count, dt = 0.016) => runFrames(api, count, dt),
    reconcile: () => api.update({ dt: 0 }),
  };

  return fixtures;
}
