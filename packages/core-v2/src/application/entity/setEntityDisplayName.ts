import { setDisplayName } from '../../domain/entities';
import { defineEntityUseCase } from '../../domain/useCases';

/** Parameters for the setEntityDisplayName use case. */
export interface SetEntityDisplayNameParams {
    readonly name: string;
}

/** Updates the entity's display name and fires a presentation event. */
export const setEntityDisplayName = defineEntityUseCase<SetEntityDisplayNameParams, void>({
    name: 'setEntityDisplayName',
    execute(entity, { name }) {
        setDisplayName(entity, name);
    },
});
