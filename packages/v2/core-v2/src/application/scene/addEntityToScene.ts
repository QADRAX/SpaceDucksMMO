import type { SceneState } from '../../domain/scene';
import type { EntityState, EntityView } from '../../domain/entities';
import type { Result } from '../../domain/utils';
import { ok, err } from '../../domain/utils';
import { defineSceneUseCase } from '../../domain/useCases';
import { attachEntityObservers } from '../../domain/scene/sceneObservers';
import { validateUniqueInSceneSubtree } from '../../domain/scene/sceneValidation';
import { validateHierarchyInSubtree } from '../../domain/entities/validation';
import { emitSceneChange } from '../../domain/scene/emitSceneChange';
import { createEntityView } from '../../domain/entities/entityView';

/** Parameters for the addEntityToScene use case (scene is provided separately). */
export interface AddEntityParams {
  readonly entity: EntityState;
}

/**
 * Adds an entity (and its entire subtree) to a scene.
 * Validates uniqueInScene and hierarchy constraints before adding.
 * Returns an EntityView snapshot of the added entity on success.
 */
export const addEntityToScene = defineSceneUseCase<AddEntityParams, Result<EntityView>>({
  name: 'addEntityToScene',
  execute(scene, { entity }) {
    if (scene.entities.has(entity.id)) {
      return err('validation', `Entity '${entity.id}' already in scene.`);
    }

    const uniqueErrors = validateUniqueInSceneSubtree(scene, entity);
    if (uniqueErrors.length > 0) {
      return err('validation', uniqueErrors.join('\n'));
    }

    const hierarchyErrors = validateHierarchyInSubtree(entity);
    if (hierarchyErrors.length > 0) {
      return err('validation', hierarchyErrors.join('\n'));
    }

    addEntityRecursive(scene, entity);

    if (!entity.parent || !scene.entities.has(entity.parent.id)) {
      scene.rootEntityIds.push(entity.id);
    }

    return ok(createEntityView(entity));
  },
});

function addEntityRecursive(scene: SceneState, entity: EntityState): void {
  scene.entities.set(entity.id, entity);

  const cleanup = attachEntityObservers(scene, entity);
  scene.entityCleanups.set(entity.id, cleanup);

  emitSceneChange(scene, { kind: 'entity-added', entityId: entity.id });

  for (const child of entity.children) {
    addEntityRecursive(scene, child);
  }
}
