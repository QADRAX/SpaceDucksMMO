import type { ComponentBase } from '../../domain/components';
import { defineComponentUseCase } from '../../domain/useCases';

/** Parameters for the updateComponentFields use case. */
export interface UpdateComponentFieldsParams {
    readonly updater: (comp: ComponentBase) => void;
}

/**
 * Mutates component fields via an updater callback.
 * The updater receives the mutable component reference.
 */
export const updateComponentFields = defineComponentUseCase<UpdateComponentFieldsParams, void>({
    name: 'updateComponentFields',
    execute(component, { updater }) {
        updater(component);
    },
});
