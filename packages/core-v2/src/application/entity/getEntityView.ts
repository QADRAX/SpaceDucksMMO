import type { EntityView } from '../../domain/entities';
import { createEntityView } from '../../domain/entities/entityView';
import { defineEntityUseCase } from '../../domain/useCases';

/**
 * Returns a frozen, readonly EntityView snapshot of the entity.
 * Includes id, displayName, transform, components, debug flags,
 * child ids, and parent id.
 */
export const getEntityView = defineEntityUseCase<void, EntityView>({
    name: 'getEntityView',
    execute(entity) {
        return createEntityView(entity);
    },
});
