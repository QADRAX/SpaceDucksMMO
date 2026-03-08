import type { SubsystemUseCase } from './types';

/**
 * Defines a subsystem use case, ensuring it conforms to the SubsystemUseCase contract.
 *
 * Subsystems (physics, scripting, rendering) use this to declare operations
 * that participate in the scene lifecycle (event handling, frame updates, disposal).
 *
 * @example
 * ```ts
 * export const reconcileSlots = defineSubsystemUseCase<
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
export function defineSubsystemUseCase<TState, TParams = void, TOutput = void>(
  definition: SubsystemUseCase<TState, TParams, TOutput>,
): SubsystemUseCase<TState, TParams, TOutput> {
  return definition;
}
