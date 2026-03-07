/**
 * A typed, named, domain-tagged use case.
 *
 * Use cases are the primary entry points for business operations.
 * Each use case encapsulates a single action that operates on a `TState`,
 * receives `TParams`, and returns `TOutput`.
 *
 * @example
 * ```ts
 * const addEntity: UseCase<SceneState, AddEntityParams, Result<void>> = {
 *   name: 'addEntityToScene',
 *   domain: 'scene',
 *   execute(scene, { entity }) { ... },
 * };
 * ```
 */
export interface UseCase<TState, TParams, TOutput> {
  /** Unique name for logging, debugging, and introspection. */
  readonly name: string;
  /** Domain tag for runtime discrimination (e.g. 'scene', 'engine'). */
  readonly domain: string;
  /** Executes the use case against the given state. */
  execute(state: TState, params: TParams): TOutput;
}

/** Extracts the state type of a UseCase. */
export type UseCaseState<T> = T extends UseCase<infer S, unknown, unknown> ? S : never;

/** Extracts the params type of a UseCase. */
export type UseCaseParams<T> = T extends UseCase<unknown, infer P, unknown> ? P : never;

/** Extracts the output type of a UseCase. */
export type UseCaseOutput<T> = T extends UseCase<unknown, unknown, infer O> ? O : never;
