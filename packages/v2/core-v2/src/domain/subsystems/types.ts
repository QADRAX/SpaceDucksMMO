import type { EngineState } from '../engine';
import type { EngineChangeEvent } from '../engine/engineEvents';
import type { SceneChangeEventWithError, SceneState } from '../scene';
import type { SubsystemUseCase, SubsystemEventUseCase } from '../useCases';

/** Frame phases in execution order. */
export type FramePhase =
  | 'earlyUpdate'
  | 'physics'
  | 'update'
  | 'lateUpdate'
  | 'preRender'
  | 'render'
  | 'postRender';

/** Ordered frame phases. Scene subsystems use all except 'render'. */
export const FRAME_PHASES: readonly FramePhase[] = [
  'earlyUpdate',
  'physics',
  'update',
  'lateUpdate',
  'preRender',
  'render',
  'postRender',
] as const;

/** Phases available to scene subsystems (no render). */
export type SceneFramePhase = Exclude<FramePhase, 'render'>;

export const SCENE_FRAME_PHASES: readonly SceneFramePhase[] = [
  'earlyUpdate',
  'physics',
  'update',
  'lateUpdate',
  'preRender',
  'postRender',
] as const;

/**
 * A scene system subsystem reacts to scene change events and
 * participates in the frame-update pipeline via phase callbacks.
 */
export interface SceneSubsystem {
  /** React to a scene change event (reactive channel). */
  handleSceneEvent(scene: SceneState, event: SceneChangeEventWithError): void;
  /** Engine-level event handlers. Used by attachSceneSubsystem to register listeners. */
  engineEventHandlers?: Partial<
    Record<EngineChangeEvent['kind'], (engine: EngineState, event: EngineChangeEvent, scene: SceneState) => void>
  >;
  /** Phase callbacks (optional). Called in FRAME_PHASES order. */
  earlyUpdate?(scene: SceneState, dt: number): void;
  physics?(scene: SceneState, dt: number): void;
  update?(scene: SceneState, dt: number): void;
  lateUpdate?(scene: SceneState, dt: number): void;
  preRender?(scene: SceneState, dt: number): void;
  postRender?(scene: SceneState, dt: number): void;
  /** If true, phase callbacks are called even when the scene is paused. */
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
  /** Port providers run during setup before scene subsystems are instantiated. */
  readonly portProviders?: ReadonlyArray<SubsystemPortProvider>;
  /** Called when a scene is added, before scene subsystems are instantiated. */
  readonly onSceneAdded?: (engine: EngineState, scene: SceneState) => void;
  /** Engine-level event handlers (e.g. resource-loaded). Params omit scene. Used by setupEngine to register. */
  readonly engineEventHandlers?: Partial<
    Record<EngineChangeEvent['kind'], (engine: EngineState, event: EngineChangeEvent) => void>
  >;
  /** Scene event handlers. Receives events from ALL scenes (entity-added, component-changed, etc.). */
  readonly sceneEventHandlers?: Partial<
    Record<
      SceneChangeEventWithError['kind'],
      (engine: EngineState, scene: SceneState, event: SceneChangeEventWithError) => void
    >
  >;
  /** Phase callbacks (optional). Called in FRAME_PHASES order. */
  earlyUpdate?(engine: EngineState, dt: number): void;
  physics?(engine: EngineState, dt: number): void;
  update?(engine: EngineState, dt: number): void;
  lateUpdate?(engine: EngineState, dt: number): void;
  preRender?(engine: EngineState, dt: number): void;
  render?(engine: EngineState, dt: number): void;
  postRender?(engine: EngineState, dt: number): void;
  /** If true, phase callbacks are called even when the engine is paused. */
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

/**
 * Context given to a scene subsystem factory.
 * All scene subsystems (physics, scripting, rendering, etc.) resolve ports the same way:
 * ctx.ports.get(PortDef). Do not introduce a separate "registry" name; use ctx.ports.
 */
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

/**
 * Flat config for creating a SceneSubsystemFactory.
 * Composes domain models and typed use cases without fluent builder nesting.
 */
export interface SceneSubsystemConfig<TState> {
  /** Unique id for the subsystem (used in logging/debugging). */
  readonly id: string;
  /** Creates subsystem state from engine context. Resolve ports from ctx.ports. */
  readonly createState: (ctx: SceneSubsystemFactoryContext) => TState;
  /** Event handlers keyed by event kind. */
  readonly events?: Partial<
    Record<SceneChangeEventWithError['kind'], SubsystemUseCase<TState, SubsystemEventParams, void>>
  >;
  /** Engine-level event handlers (e.g. resource-loaded). Scene subsystems receive scene in params. */
  readonly engineEvents?: Partial<
    Record<EngineChangeEvent['kind'], SubsystemUseCase<TState, SubsystemEngineEventParams, void>>
  >;
  /** Phase handlers keyed by phase name. */
  readonly phases?: Partial<
    Record<SceneFramePhase, SubsystemUseCase<TState, SubsystemUpdateParams, void>>
  >;
  /** Disposal use case. */
  readonly dispose?: SubsystemUseCase<TState, void, void>;
  /** If true, phase callbacks run even when scene/engine is paused. */
  readonly updateWhenPaused?: boolean;
}

/** Context passed to port provider hooks. */
export interface SubsystemPortProviderContext {
  readonly engine: EngineState;
  readonly ports: SubsystemPortRegistry;
}

/** Hook that can provide or override ports during engine setup. */
export type SubsystemPortProvider = (context: SubsystemPortProviderContext) => void;

/** @deprecated Use SubsystemPortProvider instead. */
export type SubsystemPortDeriver = SubsystemPortProvider;

/** @deprecated Use SubsystemPortProviderContext instead. */
export type SubsystemPortDeriverContext = SubsystemPortProviderContext;

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

/** Params passed to subsystem use cases for engine-level events (e.g. resource-loaded). */
export interface SubsystemEngineEventParams {
  readonly engine: EngineState;
  readonly event: EngineChangeEvent;
  readonly scene?: SceneState;
}

/** Params passed to engine subsystem use cases for scene events (from any scene). */
export interface EngineSubsystemSceneEventParams {
  readonly engine: EngineState;
  readonly scene: SceneState;
  readonly event: SceneChangeEventWithError;
}

/** Params passed when a scene is added (onSceneAdded use case). */
export interface EngineSubsystemSceneAddedParams {
  readonly engine: EngineState;
  readonly scene: SceneState;
}

/** Engine update params (engine + dt + ports). */
export interface EngineSubsystemUpdateParams {
  readonly engine: EngineState;
  readonly dt: number;
  readonly ports: SubsystemPortRegistry;
}

/**
 * Flat config for creating an EngineSubsystem.
 * Composes state and use cases without fluent builder nesting.
 * Use this instead of defineEngineSubsystem for simpler, declarative definition.
 */
export interface EngineSubsystemConfig<TState> {
  /** Unique id for the subsystem (used in logging/debugging). */
  readonly id: string;
  /** Creates subsystem state. Receives engine. */
  readonly createState: (ctx: { engine: EngineState }) => TState;
  /** Engine-level event handlers (e.g. resource-loaded). */
  readonly engineEvents?: Partial<
    Record<EngineChangeEvent['kind'], SubsystemUseCase<TState, SubsystemEngineEventParams, void>>
  >;
  /** Scene event handlers. Receives events from ALL scenes. */
  readonly sceneEvents?: Partial<
    Record<
      SceneChangeEventWithError['kind'],
      SubsystemUseCase<TState, EngineSubsystemSceneEventParams, void>
    >
  >;
  /** Phase handlers keyed by phase name. */
  readonly phases?: Partial<
    Record<FramePhase, SubsystemUseCase<TState, EngineSubsystemUpdateParams, void>>
  >;
  /** Port providers run during engine setup. */
  readonly portProviders?: ReadonlyArray<SubsystemPortProvider>;
  /**
   * Called when a scene is added, before scene subsystems are instantiated.
   * Use to register per-scene ports (e.g. GizmoPort) so they are available when
   * scene subsystems run createState. Avoids "works after first tick" patterns.
   */
  readonly onSceneAdded?: SubsystemUseCase<TState, EngineSubsystemSceneAddedParams, void>;
  /** Disposal use case. */
  readonly dispose?: SubsystemUseCase<TState, void, void>;
  /** If true, phase callbacks run even when engine is paused. */
  readonly updateWhenPaused?: boolean;
}

/** Fluent builder for creating an EngineSubsystem. */
export interface EngineSubsystemBuilder<TState> {
  /** Initialize the subsystem's internal state. */
  withState(
    factory: (ctx: { engine: EngineState }) => TState,
  ): EngineSubsystemBuilder<TState>;

  /** Register use case for an engine-level event (e.g. resource-loaded). Params omit scene. */
  onEngineEvent<K extends EngineChangeEvent['kind']>(
    eventKind: K,
    useCase: SubsystemUseCase<TState, SubsystemEngineEventParams, void>,
  ): this;

  /** Register use case for a scene event. Receives events from ALL scenes (entity-added, component-changed, etc.). */
  onSceneEvent<K extends SceneChangeEventWithError['kind']>(
    eventKind: K,
    useCase: SubsystemUseCase<TState, EngineSubsystemSceneEventParams, void>,
  ): this;

  /** Register use case for each frame phase. */
  onEarlyUpdate(useCase: SubsystemUseCase<TState, EngineSubsystemUpdateParams, void>): this;
  onPhysics(useCase: SubsystemUseCase<TState, EngineSubsystemUpdateParams, void>): this;
  onUpdate(useCase: SubsystemUseCase<TState, EngineSubsystemUpdateParams, void>): this;
  onLateUpdate(useCase: SubsystemUseCase<TState, EngineSubsystemUpdateParams, void>): this;
  onPreRender(useCase: SubsystemUseCase<TState, EngineSubsystemUpdateParams, void>): this;
  onRender(useCase: SubsystemUseCase<TState, EngineSubsystemUpdateParams, void>): this;
  onPostRender(useCase: SubsystemUseCase<TState, EngineSubsystemUpdateParams, void>): this;

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

  /** Register use case for each frame phase (scene subsystems have no render phase). */
  onEarlyUpdate(useCase: SubsystemUseCase<TState, SubsystemUpdateParams, void>): this;
  onPhysics(useCase: SubsystemUseCase<TState, SubsystemUpdateParams, void>): this;
  onUpdate(useCase: SubsystemUseCase<TState, SubsystemUpdateParams, void>): this;
  onLateUpdate(useCase: SubsystemUseCase<TState, SubsystemUpdateParams, void>): this;
  onPreRender(useCase: SubsystemUseCase<TState, SubsystemUpdateParams, void>): this;
  onPostRender(useCase: SubsystemUseCase<TState, SubsystemUpdateParams, void>): this;

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
  onEngineEvent<K extends EngineChangeEvent['kind']>(
    eventKind: K,
    useCase: SubsystemUseCase<TState, SubsystemEngineEventParams, void>,
  ): this;
  onEarlyUpdate(useCase: SubsystemUseCase<TState, SubsystemUpdateParams, void>): this;
  onPhysics(useCase: SubsystemUseCase<TState, SubsystemUpdateParams, void>): this;
  onUpdate(useCase: SubsystemUseCase<TState, SubsystemUpdateParams, void>): this;
  onLateUpdate(useCase: SubsystemUseCase<TState, SubsystemUpdateParams, void>): this;
  onPreRender(useCase: SubsystemUseCase<TState, SubsystemUpdateParams, void>): this;
  onPostRender(useCase: SubsystemUseCase<TState, SubsystemUpdateParams, void>): this;
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
  readonly portProviders: SubsystemPortProvider[];
  readonly ports: Map<string, unknown>;
  readonly portDefinitions: Map<string, PortDefinition<any>>;
}
