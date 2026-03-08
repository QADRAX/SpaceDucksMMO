import type { EngineState } from '../engine';
import type { SceneChangeEventWithError, SceneState } from '../scene';
import type { SubsystemUseCase, SubsystemEventUseCase } from '../useCases';

/**
 * A scene system subsystem reacts to scene change events and
 * participates in the frame-update pipeline.
 */
export interface SceneSubsystem {
  /** React to a scene change event (reactive channel). */
  handleSceneEvent(scene: SceneState, event: SceneChangeEventWithError): void;
  /** Advance one frame tick (synchronous pipeline). */
  update?(scene: SceneState, dt: number): void;
  /** If true, `update()` is called even when the scene is paused. */
  updateWhenPaused?: boolean;
  /** Release resources when the subsystem is detached from the scene. */
  dispose?(): void;
}

/**
 * An engine-level system subsystem for cross-scene subsystems.
 *
 * Render and audio are typical engine subsystems because they need
 * full-engine visibility (all scenes/viewports), not a single scene.
 */
export interface EngineSubsystem {
  /** Advance one frame tick. */
  update?(engine: EngineState, dt: number): void;
  /** If true, `update()` is called even when the engine is paused. */
  updateWhenPaused?: boolean;
  /** Release resources. */
  dispose?(): void;
}

/** String key used to identify a subsystem-provided I/O port. */
export type SubsystemPortKey = string;

/**
 * Mutable registry shared across subsystems.
 *
 * Ports may be injected by infrastructure or derived from other
 * subsystems/engine state during setup.
 */
export interface SubsystemPortRegistry {
  get<T = unknown>(key: SubsystemPortKey): T | undefined;
  set<T = unknown>(key: SubsystemPortKey, value: T): void;
  has(key: SubsystemPortKey): boolean;
  entries(): ReadonlyArray<readonly [SubsystemPortKey, unknown]>;
}

/** Context given to a scene subsystem factory. */
export interface SceneSubsystemFactoryContext {
  readonly engine: EngineState;
  readonly scene: SceneState;
  readonly ports: SubsystemPortRegistry;
}

/**
 * Factory used to instantiate a scene subsystem for a concrete scene.
 *
 * This allows engine-level setup to declare subsystem definitions once,
 * while each scene gets its own subsystem instance.
 */
export type SceneSubsystemFactory = (context: SceneSubsystemFactoryContext) => SceneSubsystem;

/** Context passed to port derivation hooks. */
export interface SubsystemPortDeriverContext {
  readonly engine: EngineState;
  readonly ports: SubsystemPortRegistry;
}

/** Hook that can derive or override ports during engine setup. */
export type SubsystemPortDeriver = (context: SubsystemPortDeriverContext) => void;

/** Parameters for the subsystem update tick. */
export interface SubsystemUpdateParams {
  readonly scene: SceneState;
  readonly dt: number;
}

/** Fluent builder for creating an EngineSubsystem. */
export interface EngineSubsystemBuilder<TState> {
  /** Initialize the subsystem's internal state. */
  withState(
    factory: (ctx: { engine: EngineState }) => TState,
  ): EngineSubsystemBuilder<TState>;

  /** Register a use case for the engine frame update tick. */
  onUpdate(useCase: SubsystemUseCase<TState, { engine: EngineState; dt: number }, void>): this;

  /** Register a use case for subsystem disposal. */
  onDispose(useCase: SubsystemUseCase<TState, void, void>): this;

  /** Enable updates even when the engine is paused. */
  updateWhenPaused(enabled?: boolean): this;

  /** Produces the final EngineSubsystem. */
  build(): EngineSubsystem;
}

/** Fluent builder for creating a SceneSubsystemFactory. */
export interface SceneSubsystemBuilder<TState, TPorts = void> {
  /** Declare which ports this subsystem consumes from the registry. */
  withPorts<TNewPorts>(
    resolver: (registry: SubsystemPortRegistry) => TNewPorts,
  ): SceneSubsystemBuilder<TState, TNewPorts>;

  /** Initialize the subsystem's internal state (per scene). */
  withState(
    factory: (ctx: { ports: TPorts; scene: SceneState; engine: EngineState }) => TState,
  ): SceneSubsystemBuilder<TState, TPorts>;

  /** Register a use case tied to a specific scene event. */
  onEvent<TParams>(useCase: SubsystemEventUseCase<TState, TParams, void>): this;

  /** Register a use case for the frame update tick. */
  onUpdate(useCase: SubsystemUseCase<TState, SubsystemUpdateParams, void>): this;

  /** Register a use case for subsystem disposal. */
  onDispose(useCase: SubsystemUseCase<TState, void, void>): this;

  /** Enable updates even when the scene/engine is paused. */
  updateWhenPaused(enabled?: boolean): this;

  /** Produces the final SceneSubsystemFactory. */
  build(): SceneSubsystemFactory;
}
