import type { Result } from '../utils';
import type { EngineState } from '../engine';
import type { SceneState } from '../scene';
import type { ViewportState } from '../viewport';
import type { EntityState } from '../entities';
import type { ComponentBase } from '../components';

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

/**
 * A use case that operates on a ViewportState.
 * Tagged with `domain: 'viewport'` for runtime and compile-time discrimination.
 */
export interface ViewportUseCase<TParams = void, TOutput = void> extends UseCase<
    ViewportState,
    TParams,
    TOutput
> {
    readonly domain: 'viewport';
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
 * A use case that operates on an adapter's internal state.
 * Adapters (physics, scripting, rendering) encapsulate subsystem logic
 * and participate in the scene lifecycle via SceneSystemAdapter.
 *
 * Unlike domain use cases, adapter use cases:
 * - Do not require guards (isolated subsystem state)
 * - Are not composed into a public API (internal to the adapter)
 * - Are bound via `composeAdapter` builder
 *
 * @template TState  - The adapter's internal state (e.g. ScriptingSessionState).
 * @template TParams - Parameters accepted by the use case.
 * @template TOutput - Return type of the use case (typically void).
 *
 * @example
 * ```ts
 * const reconcileSlots: AdapterUseCase<ScriptingSessionState, ReconcileParams, void> = {
 *   name: 'reconcileSlots',
 *   execute: (session, params) => { ... },
 * };
 * ```
 */
export interface AdapterUseCase<TState, TParams = void, TOutput = void> {
    /** Unique name for logging, debugging, and introspection. */
    readonly name: string;
    /** Executes the use case against the adapter's state. */
    execute(state: TState, params: TParams): TOutput;
}
