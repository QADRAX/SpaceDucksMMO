import type {  Result  } from '../types/../utils';

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
