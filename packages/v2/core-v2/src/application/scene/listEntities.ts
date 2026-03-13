import type { EntityView } from '../../domain/entities';
import { createEntityView } from '../../domain/entities/entityView';
import { defineSceneUseCase } from '../../domain/useCases';

/**
 * Returns EntityView snapshots for all root entities in the scene.
 */
export const listEntities = defineSceneUseCase<void, EntityView[]>({
    name: 'listEntities',
    execute(scene) {
        const views: EntityView[] = [];
        for (const rootId of scene.rootEntityIds) {
            const entity = scene.entities.get(rootId);
            if (entity) views.push(createEntityView(entity));
        }
        return views;
    },
});
