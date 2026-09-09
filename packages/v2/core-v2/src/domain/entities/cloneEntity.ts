import type { EntityState } from './types';
import type { EntityId } from '../ids';
import { createEntity } from './entity';
import { addComponent, addChild } from './entity';
import { cloneComponent } from '../components/cloneComponent';

/**
 * Recursively collects all entity IDs in the subtree (template first, then children).
 */
function collectIdsInOrder(entity: EntityState, out: EntityId[]): void {
  out.push(entity.id);
  for (const child of entity.children) {
    collectIdsInOrder(child, out);
  }
}

/**
 * Clones an entity subtree with new IDs. Does not add to any scene.
 * Parent-child relationships are restored. transform3d pose is deep-copied when present.
 *
 * @param template - The root entity to clone (including its entire subtree).
 * @param idGenerator - Function that returns a new unique EntityId for each call.
 * @returns The cloned root entity (with children attached).
 */
export function cloneEntitySubtree(
  template: EntityState,
  idGenerator: () => EntityId,
): EntityState {
  const idsInOrder: EntityId[] = [];
  collectIdsInOrder(template, idsInOrder);

  const idMap = new Map<EntityId, EntityId>();
  for (const oldId of idsInOrder) {
    idMap.set(oldId, idGenerator());
  }

  function cloneOne(src: EntityState): EntityState {
    const newId = idMap.get(src.id)!;
    const clone = createEntity(newId, src.displayName);
    clone.gizmoIcon = src.gizmoIcon;
    for (const [kind, enabled] of src.debugFlags) {
      clone.debugFlags.set(kind, enabled);
    }

    for (const comp of src.components.values()) {
      addComponent(clone, cloneComponent(comp));
    }

    return clone;
  }

  function cloneSubtree(src: EntityState): EntityState {
    const clone = cloneOne(src);
    for (const srcChild of src.children) {
      const cloneChild = cloneSubtree(srcChild);
      addChild(clone, cloneChild);
    }
    return clone;
  }

  return cloneSubtree(template);
}
