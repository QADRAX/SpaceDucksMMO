import type { ComponentBase } from '../../domain/components';
import { defineComponentUseCase } from '../../domain/useCases';

/**
 * Returns a frozen, readonly snapshot of the component.
 */
export const getComponentSnapshot = defineComponentUseCase<void, Readonly<ComponentBase>>({
    name: 'getComponentSnapshot',
    execute(component) {
        return Object.freeze({ ...component });
    },
});
