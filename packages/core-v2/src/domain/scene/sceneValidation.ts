import type { SceneState } from './types';
import type { EntityState } from '../entities';
import type { ComponentType } from '../components';
import { hasComponent } from '../entities';

/**
 * Finds the first entity in a scene that owns a component of the given type.
 * Optionally excludes one entity (useful for uniqueInScene checks).
 */
export function findEntityWithComponent(
  scene: SceneState,
  type: ComponentType,
  excludeEntityId?: string,
): EntityState | undefined {
  for (const entity of scene.entities.values()) {
    if (excludeEntityId && entity.id === excludeEntityId) continue;
    if (hasComponent(entity, type)) return entity;
  }
  return undefined;
}

/**
 * Validates uniqueInScene constraints for every component in a subtree
 * against the entities already present in the scene.
 * Returns an array of human-readable error messages (empty = valid).
 */
export function validateUniqueInSceneSubtree(
  scene: SceneState,
  root: EntityState,
): string[] {
  const errors: string[] = [];
  const seenInSubtree = new Map<string, string>();

  const visit = (entity: EntityState) => {
    for (const comp of entity.components.values()) {
      if (!comp.metadata.uniqueInScene) continue;

      const alreadyInSubtree = seenInSubtree.get(comp.type);
      if (alreadyInSubtree && alreadyInSubtree !== entity.id) {
        errors.push(
          `Component '${comp.type}' is unique in scene but appears on '${alreadyInSubtree}' and '${entity.id}'.`,
        );
        continue;
      }
      seenInSubtree.set(comp.type, entity.id);

      const existing = findEntityWithComponent(scene, comp.type as ComponentType, entity.id);
      if (existing) {
        errors.push(
          `Component '${comp.type}' is unique in scene and already on '${existing.id}'.`,
        );
      }
    }
    for (const child of entity.children) visit(child);
  };

  visit(root);
  return errors;
}
