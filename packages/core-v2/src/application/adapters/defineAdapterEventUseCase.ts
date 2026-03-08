import type { SceneChangeEventWithError } from '../../domain/scene';
import type { AdapterUseCase, AdapterEventUseCase } from '../../domain/useCases';
import { defineAdapterUseCase } from '../../domain/useCases';

/**
 * Defines an adapter use case tied to a specific scene event.
 *
 * This allows the adapter builder to automatically route events to the
 * correct use case and apply event kind guards.
 */
export function defineAdapterEventUseCase<TState, TParams = void, TOutput = void>(
    definition: AdapterUseCase<TState, TParams, TOutput> & {
        readonly event: SceneChangeEventWithError['kind'];
    },
): AdapterEventUseCase<TState, TParams, TOutput> {
    return defineAdapterUseCase<TState, TParams, TOutput>(definition as any) as any;
}
