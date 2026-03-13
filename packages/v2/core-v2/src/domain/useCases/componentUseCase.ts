import type { ComponentBase } from '../components';
import type { ComponentUseCase } from './types';

/**
 * Defines a component use case, automatically tagging it with `domain: 'component'`.
 *
 * @template TComponent - The concrete component type the use case operates on.
 *                        Defaults to `ComponentBase` for generic use cases.
 * @template TParams    - Parameters accepted by the use case.
 * @template TOutput    - Return type of the use case.
 */
export function defineComponentUseCase<
    TComponent extends ComponentBase = ComponentBase,
    TParams = void,
    TOutput = void,
>(
    definition: Omit<ComponentUseCase<TComponent, TParams, TOutput>, 'domain' | 'guards'> & {
        readonly guards?: ComponentUseCase<TComponent, TParams, TOutput>['guards'];
    },
): ComponentUseCase<TComponent, TParams, TOutput> {
    return { ...definition, guards: definition.guards ?? [], domain: 'component' };
}
