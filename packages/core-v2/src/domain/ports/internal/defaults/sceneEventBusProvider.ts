import type { SceneId } from '../../../ids';
import type { SceneEventBus } from '../../../events';
import type { SceneEventBusProviderPort } from '../sceneEventBusProviderPort';
import { createSceneEventBus } from '../../../events';

/** Creates the default implementation of SceneEventBusProviderPort. Pure factory. */
export function createDefaultSceneEventBusProvider(): SceneEventBusProviderPort {
  const buses = new Map<SceneId, SceneEventBus>();

  return {
    registerSceneBus(sceneId, bus) {
      buses.set(sceneId, bus);
    },

    unregisterSceneBus(sceneId) {
      buses.delete(sceneId);
    },

    getEventBus(sceneId) {
      return buses.get(sceneId);
    },

    getOrCreateEventBus(sceneId) {
      let bus = buses.get(sceneId);
      if (!bus) {
        bus = createSceneEventBus();
        buses.set(sceneId, bus);
      }
      return bus;
    },
  };
}
