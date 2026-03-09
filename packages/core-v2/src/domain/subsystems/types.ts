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
  /** Retrieves a strongly-typed port by its definition. */
  get<T>(def: PortDefinition<T>): T | undefined;

  /** Retrieves a port by its string ID, returning unknown. Useful for dynamic lookup. */
  getById<T = unknown>(id: string): T | undefined;

  /** Registers a port implementation conforming to its definition. */
  register<T>(def: PortDefinition<T>, implementation: T): void;

  /** Checks if a port definition is registered. */
  has<T>(def: PortDefinition<T>): boolean;

  /** Get all registered port definitions and their implementations for introspection. */
  entries(): ReadonlyArray<readonly [PortDefinition<any>, unknown]>;
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

/** Params passed to subsystem use cases during `handleSceneEvent`. */
export interface SubsystemEventParams {
  readonly scene: SceneState;
  readonly event: SceneChangeEventWithError;
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

/** Fluent builder for composing a SceneSubsystem from subsystem use cases. */
export interface SubsystemComposer<TState> {
  on<K extends SceneChangeEventWithError['kind']>(
    eventKind: K,
    useCase: SubsystemUseCase<TState, SubsystemEventParams, void>,
  ): this;
  onUpdate(useCase: SubsystemUseCase<TState, SubsystemUpdateParams, void>): this;
  onDispose(useCase: SubsystemUseCase<TState, void, void>): this;
  updateWhenPaused(enabled: boolean): this;
  build(): SceneSubsystem;
}

export interface PortMethodDefinition {
  readonly name: string;
  readonly async: boolean;
}

export interface PortDefinition<T> {
  readonly id: string;
  readonly methods: ReadonlyArray<PortMethodDefinition>;
  readonly _phantom?: T; // For type inference
  /** Creates a PortBinding for this definition */
  bind(implementation: T): PortBinding<T>;
}

export interface PortMethodOptions {
  /** If true, the method returns a Promise and should be treated as async by scripting languages. */
  async?: boolean;
}

export interface PortBuilder<T> {
  /**
   * Declares a method on this port.
   *
   * @param name The name of the method. Must be a key on the port interface.
   * @param options Additional options, such as whether the method is asynchronous.
   */
  addMethod(name: keyof T & string, options?: PortMethodOptions): PortBuilder<T>;

  /**
   * Produces the final, strongly-typed port definition.
   */
  build(): PortDefinition<T>;
}

/**
 * Associates a full port implementation with its definition schema.
 * This is meant to be passed to engine setup use-cases to properly register the port.
 */
export interface PortBinding<T> {
  readonly definition: PortDefinition<T>;
  readonly implementation: T;
}

/** Internal mutable subsystem runtime bag stored on EngineState. */
export interface SubsystemRuntimeState {
  readonly sceneSubsystemFactories: SceneSubsystemFactory[];
  readonly portDerivers: SubsystemPortDeriver[];
  readonly ports: Map<string, unknown>;
  readonly portDefinitions: Map<string, PortDefinition<any>>;
}
