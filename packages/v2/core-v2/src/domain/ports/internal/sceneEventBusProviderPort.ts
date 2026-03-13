import type { SceneId } from '../../ids';
import type { SceneEventBus } from '../../events';

/**
 * Port that provides the event bus for a scene.
 * Internal port: core implements it. Scripting and UI retrieve buses via getOrCreateEventBus.
 */
export interface SceneEventBusProviderPort {
  /** Registers the event bus for a scene. Allows override. */
  registerSceneBus(sceneId: SceneId, bus: SceneEventBus): void;

  /** Unregisters the event bus. Called on teardown. */
  unregisterSceneBus(sceneId: SceneId): void;

  /** Returns the event bus for a scene, or undefined if not registered. */
  getEventBus(sceneId: SceneId): SceneEventBus | undefined;

  /** Returns the event bus for a scene, creating and storing one if not present. */
  getOrCreateEventBus(sceneId: SceneId): SceneEventBus;
}
