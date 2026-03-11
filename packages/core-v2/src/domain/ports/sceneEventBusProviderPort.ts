import type { SceneId } from '../ids';

/**
 * Minimal event bus interface for UI ↔ scripting communication.
 * scripting-lua's ScriptEventBus conforms to this.
 */
export interface SceneEventBus {
  fire(name: string, data: Record<string, unknown>): void;
  on(slotId: string, name: string, cb: (data: Record<string, unknown>) => void): () => void;
}

/**
 * Port that provides the event bus for a scene.
 * Scripting subsystem registers its bus; UI adapter retrieves it for mounting.
 */
export interface SceneEventBusProviderPort {
  /** Registers the event bus for a scene. Called by scripting on scene-setup. */
  registerSceneBus(sceneId: SceneId, bus: SceneEventBus): void;

  /** Unregisters the event bus. Called by scripting on teardown. */
  unregisterSceneBus(sceneId: SceneId): void;

  /** Returns the event bus for a scene, or undefined if not registered. */
  getEventBus(sceneId: SceneId): SceneEventBus | undefined;
}
