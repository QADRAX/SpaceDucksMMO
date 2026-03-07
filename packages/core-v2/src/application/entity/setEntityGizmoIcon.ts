import { setGizmoIcon } from '../../domain/entities';
import { defineEntityUseCase } from '../../domain/useCases';

/** Parameters for the setEntityGizmoIcon use case. */
export interface SetEntityGizmoIconParams {
    readonly icon: string | undefined;
}

/** Updates the entity's gizmo icon and fires a presentation event. */
export const setEntityGizmoIcon = defineEntityUseCase<SetEntityGizmoIconParams, void>({
    name: 'setEntityGizmoIcon',
    execute(entity, { icon }) {
        setGizmoIcon(entity, icon);
    },
});
