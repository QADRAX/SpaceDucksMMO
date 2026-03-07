import type { ComponentBase } from '../components';
import type { ComponentUseCase, BoundUseCase } from './types';
import { bindUseCase } from './bind';

/**
 * Defines a component use case, automatically tagging it with `domain: 'component'`.
 */
export function defineComponentUseCase<TParams = void, TOutput = void>(
    definition: Omit<ComponentUseCase<TParams, TOutput>, 'domain' | 'guards'> & {
        readonly guards?: ComponentUseCase<TParams, TOutput>['guards'];
    },
): ComponentUseCase<TParams, TOutput> {
    return { ...definition, guards: definition.guards ?? [], domain: 'component' };
}

/** Binds a ComponentUseCase to a concrete ComponentBase. */
export function bindComponentUseCase<TParams, TOutput>(
    component: ComponentBase,
    useCase: ComponentUseCase<TParams, TOutput>,
): BoundUseCase<TParams, TOutput> {
    return bindUseCase(component, useCase);
}
