import type { Result } from '../../domain/utils';
import { ok, err } from '../../domain/utils';
import { addChild, removeChildById } from '../../domain/entities';
import { wouldCreateCycle, validateHierarchyInSubtree } from '../../domain/entities/validation';
import { defineSceneUseCase } from '../../domain/useCases';
import { emitSceneChange } from '../../domain/scene/emitSceneChange';

import type { EntityId } from '../../domain/ids';

/** Parameters for the reparentEntityInScene use case. */
export interface ReparentEntityParams {
  readonly childId: EntityId;
  readonly newParentId: EntityId | null;
}

/**
 * Moves an entity to a new parent within the scene.
 * Pass null as `newParentId` to promote the entity to a root.
 * Validates cycle detection and hierarchy requirements, rolling back on failure.
 */
export const reparentEntityInScene = defineSceneUseCase<ReparentEntityParams, Result<void>>({
  name: 'reparentEntityInScene',
  execute(scene, { childId, newParentId }) {
    const child = scene.entities.get(childId);
    if (!child) return err('not-found', `Entity '${childId}' not found.`);

    const oldParent = child.parent;

    if (newParentId === null) {
      if (oldParent) removeChildById(oldParent, childId);
      if (!scene.rootEntityIds.includes(childId)) {
        scene.rootEntityIds.push(childId);
      }
      emitSceneChange(scene, { kind: 'hierarchy-changed', childId, newParentId: null });
      return ok(undefined);
    }

    const newParent = scene.entities.get(newParentId);
    if (!newParent) return err('not-found', `Parent '${newParentId}' not found.`);

    if (wouldCreateCycle(child, newParent)) {
      return err(
        'invalid-reparent',
        `Reparenting '${childId}' under '${newParentId}' would create a cycle.`,
      );
    }

    if (oldParent) removeChildById(oldParent, childId);
    addChild(newParent, child);

    const errors = validateHierarchyInSubtree(child);
    if (errors.length > 0) {
      removeChildById(newParent, childId);
      if (oldParent) addChild(oldParent, child);
      return err('validation', errors.join('\n'));
    }

    const rootIdx = scene.rootEntityIds.indexOf(childId);
    if (rootIdx >= 0) {
      scene.rootEntityIds.splice(rootIdx, 1);
    }

    emitSceneChange(scene, { kind: 'hierarchy-changed', childId, newParentId });
    return ok(undefined);
  },
});
