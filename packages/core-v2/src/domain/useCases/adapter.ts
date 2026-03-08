import type { AdapterUseCase } from './types';

/**
 * Defines an adapter use case, ensuring it conforms to the AdapterUseCase contract.
 *
 * Adapters (physics, scripting, rendering) use this to declare operations
 * that participate in the scene lifecycle (event handling, frame updates, disposal).
 *
 * @example
 * ```ts
 * export const reconcileSlots = defineAdapterUseCase<
 *   ScriptingSessionState,
 *   ReconcileParams,
 *   void
 * >({
 *   name: 'reconcileSlots',
 *   execute: (session, params) => {
 *     // ... reconcile script slots
 *   },
 * });
 * ```
 */
export function defineAdapterUseCase<TState, TParams = void, TOutput = void>(
  definition: AdapterUseCase<TState, TParams, TOutput>,
): AdapterUseCase<TState, TParams, TOutput> {
  return definition;
}
