import type { SceneChangeEventWithError } from '../../domain/scene';
import type { SubsystemUseCase, SubsystemEventUseCase } from '../../domain/useCases';
import { defineSubsystemUseCase } from '../../domain/useCases';

/**
 * Defines a subsystem use case tied to a specific scene event.
 *
 * This allows the subsystem builder to automatically route events to the
 * correct use case and apply event kind guards.
 */
export function defineSubsystemEventUseCase<TState, TParams = void, TOutput = void>(
    definition: SubsystemUseCase<TState, TParams, TOutput> & {
        readonly event: SceneChangeEventWithError['kind'];
    },
): SubsystemEventUseCase<TState, TParams, TOutput> {
    return defineSubsystemUseCase<TState, TParams, TOutput>(definition as any) as any;
}
