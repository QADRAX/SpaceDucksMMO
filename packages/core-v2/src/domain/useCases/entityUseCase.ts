import type { EntityState } from '../entities';
import type { EntityUseCase, BoundUseCase } from './types';
import { bindUseCase } from './bind';

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

/** Binds an EntityUseCase to a concrete EntityState. */
export function bindEntityUseCase<TParams, TOutput>(
    entity: EntityState,
    useCase: EntityUseCase<TParams, TOutput>,
): BoundUseCase<TParams, TOutput> {
    return bindUseCase(entity, useCase);
}
