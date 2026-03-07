import type { SceneState } from './sceneState';
import type { SceneChangeEventWithError } from './sceneEvents';

/**
 * Listener signature for scene change events.
 * Receives the scene state and the event that was emitted.
 */
export type SceneChangeListener = (
  scene: SceneState,
  event: SceneChangeEventWithError,
) => void;

/**
 * A scene system adapter reacts to scene change events and
 * participates in the frame-update pipeline.
 *
 * Render, physics, scripting and other subsystems implement this
 * interface so they can be registered during `setupScene`.
 *
 * - `handleSceneEvent` receives reactive notifications (entity-added,
 *   component-changed, etc.).
 * - `update` is called synchronously by the game loop in registration
 *   order, giving each subsystem explicit control over frame timing.
 */
export interface SceneSystemAdapter {
  /** React to a scene change event (reactive channel). */
  handleSceneEvent(scene: SceneState, event: SceneChangeEventWithError): void;
  /** Advance one frame tick (synchronous pipeline). */
  update?(scene: SceneState, dt: number): void;
  /** Release resources when the adapter is detached from the scene. */
  dispose?(): void;
}
