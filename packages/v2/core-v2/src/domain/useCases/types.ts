import type { Result } from '../utils';
import type { PortBinding } from '../subsystems/types';
import type { EngineState } from '../engine';
import type { SceneState } from '../scene';
import type { ViewportState } from '../viewport';
import type { EntityState } from '../entities';
import type { ComponentBase } from '../components';
import type { SceneChangeEventWithError } from '../scene';


/**
 * A typed, named, domain-tagged use case.
 *
 * Use cases are the primary entry points for business operations.
 * Each use case encapsulates a single action that operates on a `TState`,
 * receives `TParams`, and returns `TOutput`.
 */
export interface UseCase<TState, TParams, TOutput> {
    /** Unique name for logging, debugging, and introspection. */
    readonly name: string;
    /** Domain tag for runtime discrimination (e.g. 'scene', 'engine'). */
    readonly domain: string;
    /**
     * Pre-execution guards for cross-domain validation.
     * Each guard receives the root state (engine), the resolved domain
     * state, and the use case params. A failing guard short-circuits
     * execution.
     */
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- any in root position
         allows guards typed with concrete root (EngineState) to be stored generically. */
    readonly guards: ReadonlyArray<UseCaseGuard<any, TState, TParams>>;
    /** Executes the use case against the given state. */
    execute(state: TState, params: TParams): TOutput;
}

/** Extracts the state type of a UseCase. */
export type UseCaseState<T> = T extends UseCase<infer S, unknown, unknown> ? S : never;

/** Extracts the params type of a UseCase. */
export type UseCaseParams<T> = T extends UseCase<unknown, infer P, unknown> ? P : never;

/** Extracts the output type of a UseCase. */
export type UseCaseOutput<T> = T extends UseCase<unknown, unknown, infer O> ? O : never;

/**
 * A guard that runs before a use case executes.
 *
 * @template TRootState - The root state for cross-domain lookups (typically EngineState).
 * @template TState     - The resolved domain state (SceneState, ViewportState …).
 * @template TParams    - The use case params.
 */
export type UseCaseGuard<TRootState, TState, TParams> = (
    root: TRootState,
    state: TState,
    params: TParams,
) => Result<void>;

/**
 * A use case whose state has been pre-bound.
 * Created by `bindUseCase` — callers only supply params.
 */
export interface BoundUseCase<TParams, TOutput> {
    readonly name: string;
    readonly domain: string;
    execute(params: TParams): TOutput;
}

/** Context passed to viewport use cases that need engine access (e.g. resizeViewport). */
export interface ViewportUseCaseContext {
  readonly engine: EngineState;
}

/**
 * A use case that operates on a ViewportState.
 * Tagged with `domain: 'viewport'` for runtime and compile-time discrimination.
 * Execute may receive optional context with engine for port access.
 */
export interface ViewportUseCase<TParams = void, TOutput = void> extends Omit<
    UseCase<ViewportState, TParams, TOutput>,
    'execute'
> {
    readonly domain: 'viewport';
    execute(
        state: ViewportState,
        params: TParams,
        context?: ViewportUseCaseContext,
    ): TOutput;
}

/** Concrete guard type for viewport use cases. */
export type ViewportGuard<TParams> = UseCaseGuard<EngineState, ViewportState, TParams>;

/**
 * A use case that operates on a SceneState.
 * Tagged with `domain: 'scene'` for runtime and compile-time discrimination.
 */
export interface SceneUseCase<TParams = void, TOutput = void> extends UseCase<
    SceneState,
    TParams,
    TOutput
> {
    readonly domain: 'scene';
}

/**
 * A use case that operates on an EngineState.
 * Tagged with `domain: 'engine'` for runtime and compile-time discrimination.
 */
export interface EngineUseCase<TParams = void, TOutput = void> extends UseCase<
    EngineState,
    TParams,
    TOutput
> {
    readonly domain: 'engine';
}

/**
 * A use case that operates on an EntityState within a scene.
 * Tagged with `domain: 'entity'` for runtime and compile-time discrimination.
 * Guards receive SceneState as root for cross-entity validations.
 */
export interface EntityUseCase<TParams = void, TOutput = void> extends UseCase<
    EntityState,
    TParams,
    TOutput
> {
    readonly domain: 'entity';
}

/** Concrete guard type for entity use cases (root = SceneState). */
export type EntityGuard<TParams> = UseCaseGuard<SceneState, EntityState, TParams>;

/**
 * A use case that operates on a ComponentBase within an entity.
 * Tagged with `domain: 'component'` for runtime and compile-time discrimination.
 *
 * @template TComponent - The concrete component type (defaults to ComponentBase).
 *                        Specialised use cases can narrow to e.g. `RigidBodyComponent`.
 * @template TParams    - Parameters accepted by the use case.
 * @template TOutput    - Return type of the use case.
 *
 * Guards receive EntityState as root for cross-component validations.
 */
export interface ComponentUseCase<
    TComponent extends ComponentBase<any, any> = ComponentBase<any, any>,
    TParams = void,
    TOutput = void,
> extends UseCase<TComponent, TParams, TOutput> {
    readonly domain: 'component';
}

/** Concrete guard type for component use cases (root = EntityState). */
export type ComponentGuard<TComponent extends ComponentBase, TParams> =
    UseCaseGuard<EntityState, TComponent, TParams>;

/**
 * A use case that operates on a subsystem's internal state.
 * Subsystems (physics, scripting, rendering) encapsulate subsystem logic
 * and participate in the scene lifecycle via SceneSubsystem.
 *
 * Unlike domain use cases, subsystem use cases:
 * - Do not require guards (isolated subsystem state)
 * - Are not composed into a public API (internal to the subsystem)
 * - Are bound via `composeSceneSubsystem` builder
 *
 * @template TState  - The subsystem's internal state (e.g. ScriptingSessionState).
 * @template TParams - Parameters accepted by the use case.
 * @template TOutput - Return type of the use case (typically void).
 *
 * @example
 * ```ts
 * const reconcileSlots: SubsystemUseCase<ScriptingSessionState, ReconcileParams, void> = {
 *   name: 'reconcileSlots',
 *   execute: (session, params) => { ... },
 * };
 * ```
 */
export interface SubsystemUseCase<TState, TParams = void, TOutput = void> {
    /** Unique name for logging, debugging, and introspection. */
    readonly name: string;
    /** Executes the use case against the subsystem's state. */
    execute(state: TState, params: TParams): TOutput;
}

/**
 * A subsystem use case that is tied to a specific scene event.
 */
export type SubsystemEventUseCase<TState, TParams = void, TOutput = void> =
    SubsystemUseCase<TState, TParams, TOutput> & {
        /** The scene event kind this use case handles. */
        readonly event: SceneChangeEventWithError['kind'];
    };

/**
 * A use case that operates on a Port implementation's internal state.
 * Like SubsystemUseCase, it does not require guards and is not exposed in the API.
 * 
 * Note: TParams is an array (tuple) of the arguments the Port method accepts,
 * allowing it to perfectly mirror the method's parameter signature.
 */
export interface PortUseCase<TState, TParams extends readonly any[] = [], TOutput = void> {
    /** Unique name for logging, debugging, and introspection. */
    readonly name: string;
    /** Executes the use case against the port's internal state, receiving arguments as a tuple array. */
    execute(state: TState, params: TParams): TOutput;
}
/**
 * A fluent builder to define a Port Implementation Factory.
 *
 * This pattern allows defining the operations of a Port as isolated Use Cases,
 * ensuring symmetry with the rest of the engine's UseCase-driven architecture.
 *
 * @template TState - The internal closure state format of the port.
 * @template TPort - The interface contract the port implements.
 * @template TContext - The optional parameters required to construct the state.
 */
export interface PortImplementationBuilder<TState, TPort, TContext = void> {
    /**
     * Declares the factory function that creates the state for this port implementation.
     */
    withState(factory: (ctx: TContext) => TState): PortImplementationBuilder<TState, TPort, TContext>;

    /**
     * Binds a PortUseCase to a specific method of the port.
     * The UseCase's `TParams` is automatically inferred as the tuple of arguments the method expects.
     *
     * @example
     * ```ts
     * const logCase: PortUseCase<State, [string, number], void> = {
     *   name: 'log',
     *   execute: (state, [msg, level]) => console.log(msg, level)
     * };
     * builder.withMethod('log', logCase);
     * ```
     */
    withMethod<K extends Extract<keyof TPort, string>>(
        name: K,
        useCase: PortUseCase<
            TState,
            TPort[K] extends (...args: any[]) => any ? Parameters<TPort[K]> : [],
            TPort[K] extends (...args: any[]) => any ? ReturnType<TPort[K]> : void
        >
    ): PortImplementationBuilder<TState, TPort, TContext>;

    /**
     * Instantiates the internal state and produces the final port binding.
     * @param args The context required to initialize the state (if TContext is not void).
     */
    build(...args: TContext extends void ? [] : [context: TContext]): PortBinding<TPort>;
}
