import type { ComponentType } from '../../domain/components';
import type { Result } from '../../domain/utils';
import { removeComponent } from '../../domain/entities';
import { defineEntityUseCase } from '../../domain/useCases';

/** Parameters for the removeComponentFromEntity use case. */
export interface RemoveComponentFromEntityParams {
    readonly componentType: ComponentType;
}

/**
 * Removes a component from the entity by type.
 * Delegates to the domain `removeComponent` function which performs
 * validation before removal.
 */
export const removeComponentFromEntity = defineEntityUseCase<
    RemoveComponentFromEntityParams,
    Result<void>
>({
    name: 'removeComponentFromEntity',
    execute(entity, { componentType }) {
        return removeComponent(entity, componentType);
    },
});
