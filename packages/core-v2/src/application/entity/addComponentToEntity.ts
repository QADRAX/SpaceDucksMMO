import type { ComponentBase } from '../../domain/components';
import type { Result } from '../../domain/utils';
import { addComponent } from '../../domain/entities';
import { defineEntityUseCase } from '../../domain/useCases';

/** Parameters for the addComponentToEntity use case. */
export interface AddComponentToEntityParams<
    TComponent extends ComponentBase<any, any> = ComponentBase<any, any>
> {
    readonly component: TComponent;
}

/**
 * Adds a component to the entity after domain-level validation.
 * Delegates to the domain `addComponent` function which checks
 * uniqueness, conflicts, and hierarchy requirements.
 */
export const addComponentToEntity = defineEntityUseCase<
    AddComponentToEntityParams<ComponentBase<any, any>>,
    Result<void>
>({
    name: 'addComponentToEntity',
    execute(entity, { component }) {
        return addComponent(entity, component);
    },
});
