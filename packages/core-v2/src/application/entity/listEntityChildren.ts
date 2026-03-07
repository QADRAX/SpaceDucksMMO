import type { EntityView } from '../../domain/entities';
import { createEntityView } from '../../domain/entities/entityView';
import { defineEntityUseCase } from '../../domain/useCases';

/**
 * Returns EntityView snapshots for all direct children of the entity.
 */
export const listEntityChildren = defineEntityUseCase<void, EntityView[]>({
    name: 'listEntityChildren',
    execute(entity) {
        return entity.children.map((child) => createEntityView(child));
    },
});
