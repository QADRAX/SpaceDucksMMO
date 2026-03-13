import type { EntityUseCase } from './types';

/**
 * Defines an entity use case, automatically tagging it with `domain: 'entity'`.
 */
export function defineEntityUseCase<TParams = void, TOutput = void>(
    definition: Omit<EntityUseCase<TParams, TOutput>, 'domain' | 'guards'> & {
        readonly guards?: EntityUseCase<TParams, TOutput>['guards'];
    },
): EntityUseCase<TParams, TOutput> {
    return { ...definition, guards: definition.guards ?? [], domain: 'entity' };
}
