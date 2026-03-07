import type { SceneState } from '../../domain/types/sceneState';
import type { EntityState } from '../../domain/ecs/entity';
import type { ComponentType } from '../../domain/types/componentType';
import type { ComponentDependency } from '../../domain/types/componentMetadata';
import { hasComponent } from '../../domain/ecs/entity';
import { GEOMETRY_TYPES } from '../../domain/ecs/validation';

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

/**
 * Validates hierarchy requirements for all components in a subtree.
 * Returns an array of human-readable error messages (empty = valid).
 */
export function validateHierarchyInSubtree(root: EntityState): string[] {
  const errors: string[] = [];

  const visit = (entity: EntityState) => {
    for (const comp of entity.components.values()) {
      const reqs = comp.metadata.requiresInHierarchy;
      if (!reqs || reqs.length === 0) continue;
      for (const req of reqs) {
        if (!hasInSelfOrAncestors(entity, req)) {
          errors.push(
            `Component '${comp.type}' on '${entity.id}' requires '${req}' on this entity or an ancestor.`,
          );
        }
      }
    }
    for (const child of entity.children) visit(child);
  };

  visit(root);
  return errors;
}

/**
 * Returns true if attaching `child` under `candidateParent` would create a cycle.
 */
export function wouldCreateCycle(child: EntityState, candidateParent: EntityState): boolean {
  let current: EntityState | undefined = candidateParent;
  while (current) {
    if (current.id === child.id) return true;
    current = current.parent;
  }
  return false;
}

/**
 * Checks if a dependency (including the 'geometry' wildcard) is satisfied on an entity.
 */
function entityHasDependency(entity: EntityState, dep: ComponentDependency): boolean {
  if (dep === 'geometry') {
    for (const [t] of entity.components) {
      if (GEOMETRY_TYPES.has(t)) return true;
    }
    return false;
  }
  return hasComponent(entity, dep);
}

/** Walks up the parent chain looking for a dependency on self or any ancestor. */
function hasInSelfOrAncestors(entity: EntityState, dep: ComponentDependency): boolean {
  let current: EntityState | undefined = entity;
  while (current) {
    if (entityHasDependency(current, dep)) return true;
    current = current.parent;
  }
  return false;
}
