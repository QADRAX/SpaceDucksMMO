/**
 * Generic use-case definition (same idea as {@link defineComponentUseCase} in `@duckengine/core-v2`).
 * `TDeps` is the injectable slice (ports) each use case needs; composition passes a full deps object or subset.
 */
export interface ResourceUseCase<TDeps, TIn, TOut> {
  readonly name: string;
  readonly run: (deps: TDeps, input: TIn) => Promise<TOut>;
}

export function defineResourceUseCase<TDeps, TIn, TOut>(
  definition: ResourceUseCase<TDeps, TIn, TOut>
): ResourceUseCase<TDeps, TIn, TOut> {
  return definition;
}
