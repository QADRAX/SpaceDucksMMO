import {
  createSceneEventBus,
  type SceneEventBus,
} from '@duckengine/core-v2';

/**
 * Re-exports from core. Event bus is now owned by core (SceneEventBusProviderPort).
 */
export { createSceneEventBus, type SceneEventBus };

/** @deprecated Use createSceneEventBus */
export const createScriptEventBus = createSceneEventBus;
