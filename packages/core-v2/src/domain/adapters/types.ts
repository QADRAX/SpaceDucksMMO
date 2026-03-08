import type { EngineState } from '../engine';
import type { SceneChangeEventWithError, SceneState } from '../scene';

/**
 * A scene system adapter reacts to scene change events and
 * participates in the frame-update pipeline.
 */
export interface SceneSystemAdapter {
  /** React to a scene change event (reactive channel). */
  handleSceneEvent(scene: SceneState, event: SceneChangeEventWithError): void;
  /** Advance one frame tick (synchronous pipeline). */
  update?(scene: SceneState, dt: number): void;
  /** If true, `update()` is called even when the scene is paused. */
  updateWhenPaused?: boolean;
  /** Release resources when the adapter is detached from the scene. */
  dispose?(): void;
}

/**
 * An engine-level system adapter for cross-scene subsystems.
 *
 * Render and audio are typical engine adapters because they need
 * full-engine visibility (all scenes/viewports), not a single scene.
 */
export interface EngineSystemAdapter {
  /** Advance one frame tick. */
  update?(engine: EngineState, dt: number): void;
  /** If true, `update()` is called even when the engine is paused. */
  updateWhenPaused?: boolean;
  /** Release resources. */
  dispose?(): void;
}

/** String key used to identify an adapter-provided I/O port. */
export type AdapterPortKey = string;

/**
 * Mutable registry shared across adapters.
 *
 * Ports may be injected by infrastructure or derived from other
 * adapters/engine state during setup.
 */
export interface AdapterPortRegistry {
  get<T = unknown>(key: AdapterPortKey): T | undefined;
  set<T = unknown>(key: AdapterPortKey, value: T): void;
  has(key: AdapterPortKey): boolean;
  entries(): ReadonlyArray<readonly [AdapterPortKey, unknown]>;
}

/** Context given to a scene adapter factory. */
export interface SceneAdapterFactoryContext {
  readonly engine: EngineState;
  readonly scene: SceneState;
  readonly ports: AdapterPortRegistry;
}

/**
 * Factory used to instantiate a scene adapter for a concrete scene.
 *
 * This allows engine-level setup to declare adapter definitions once,
 * while each scene gets its own adapter instance.
 */
export type SceneAdapterFactory = (context: SceneAdapterFactoryContext) => SceneSystemAdapter;

/** Context passed to port derivation hooks. */
export interface AdapterPortDeriverContext {
  readonly engine: EngineState;
  readonly ports: AdapterPortRegistry;
}

/** Hook that can derive or override ports during engine setup. */
export type AdapterPortDeriver = (context: AdapterPortDeriverContext) => void;
