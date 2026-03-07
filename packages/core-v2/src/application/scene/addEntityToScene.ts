import type { SceneState } from '../../domain/types/sceneState';
import type { EntityState } from '../../domain/ecs/entity';
import type { Result } from '../../domain/types/result';
import { ok, err } from '../../domain/types/result';
import { defineSceneUseCase } from './sceneUseCase';
import { attachEntityObservers } from './sceneObservers';
import { validateUniqueInSceneSubtree, validateHierarchyInSubtree } from './sceneValidation';
import { emitSceneChange } from './emitSceneChange';

/** Parameters for the addEntityToScene use case (scene is provided separately). */
export interface AddEntityParams {
  readonly entity: EntityState;
}

/**
 * Adds an entity (and its entire subtree) to a scene.
 * Validates uniqueInScene and hierarchy constraints before adding.
 */
export const addEntityToScene = defineSceneUseCase<AddEntityParams, Result<void>>({
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

    return ok(undefined);
  },
});

function addEntityRecursive(scene: SceneState, entity: EntityState): void {
  scene.entities.set(entity.id, entity);

  const cleanup = attachEntityObservers(scene, entity);
  scene.entityCleanups.set(entity.id, cleanup);

  scene.ports.renderSync?.addEntity(entity);
  scene.ports.physics?.addEntity(entity);

  emitSceneChange(scene, { kind: 'entity-added', entityId: entity.id });

  for (const child of entity.children) {
    addEntityRecursive(scene, child);
  }
}
