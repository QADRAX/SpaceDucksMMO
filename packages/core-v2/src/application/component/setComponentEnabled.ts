import type { ComponentBase } from '../../domain/components';
import { defineComponentUseCase } from '../../domain/useCases';

/** Parameters for the setEnabled use case. */
export interface SetEnabledParams {
    readonly enabled: boolean;
}

/** Sets the enabled flag on a component. */
export const setEnabled = defineComponentUseCase<ComponentBase<any, any>, SetEnabledParams, void>({
    name: 'setEnabled',
    execute(component, { enabled }) {
        component.enabled = enabled;
    },
});
