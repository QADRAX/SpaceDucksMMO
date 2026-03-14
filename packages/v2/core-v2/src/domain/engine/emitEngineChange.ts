import type { EngineState, EngineChangeListener } from './types';
import type { EngineChangeEvent } from './engineEvents';

/** Notifies all engine change listeners. Swallows listener errors. */
export function emitEngineChange(engine: EngineState, event: EngineChangeEvent): void {
  for (const listener of engine.engineChangeListeners) {
    try {
      listener(engine, event);
    } catch {
      /* listener must not break engine */
    }
  }
}

/** Subscribes to engine change events. Returns an unsubscribe function. */
export function subscribeToEngineChanges(
  engine: EngineState,
  listener: EngineChangeListener
): () => void {
  engine.engineChangeListeners.add(listener);
  return () => {
    engine.engineChangeListeners.delete(listener);
  };
}
