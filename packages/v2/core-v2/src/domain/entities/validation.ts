import type { ComponentType, ComponentDependency } from '../components';
import type { Result } from '../utils';
import { ok, err } from '../utils';
import type { ComponentBase } from '../components';
import type { EntityState } from './types';

/**
 * Checks whether `comp` can be added to `entity`, based on its metadata.
 * Rules: unique, requires, requiresInHierarchy, conflicts, custom validate.
 */
export function validateAddComponent<T extends ComponentBase>(
  entity: EntityState,
  comp: T,
): Result<void> {
  const meta = comp.metadata;

  if (meta.unique && entity.components.has(comp.type)) {
    return err('validation', `Component "${comp.type}" is unique and already present.`);
  }

  if (meta.uniqueInScene) {
    /* Scene-wide uniqueness needs a world context — deferred to application layer. */
  }

  if (meta.requires && meta.requires.length > 0) {
    for (const req of meta.requires) {
      const satisfied = satisfiesRequirement(entity, req);
      if (!satisfied) {
        return err('validation', `Missing required component "${req}".`);
      }
    }
  }

  if (meta.requiresInHierarchy && meta.requiresInHierarchy.length > 0) {
    for (const req of meta.requiresInHierarchy) {
      const satisfied = satisfiesHierarchyRequirement(entity, req);
      if (!satisfied) {
        return err('validation', `Required component "${req}" not found on entity or ancestors.`);
      }
    }
  }

  if (meta.conflicts) {
    for (const c of meta.conflicts) {
      if (satisfiesRequirement(entity, c)) {
        return err('validation', `Conflicts with existing component "${c}".`);
      }
    }
  }

  return ok(undefined);
}

/**
 * Checks whether `type` can be safely removed from `entity`.
 * Blocks removal if another component on the entity declares it as a dependency.
 */
export function validateRemoveComponent(entity: EntityState, type: ComponentType): Result<void> {
  for (const [, comp] of entity.components) {
    if (comp.type === type) continue;
    const reqs = comp.metadata.requires;
    if (reqs && reqs.includes(type)) {
      return err('validation', `Cannot remove "${type}" — required by "${comp.type}".`);
    }
  }
  return ok(undefined);
}

export const GEOMETRY_TYPES: ReadonlySet<string> = new Set([
  'boxGeometry',
  'sphereGeometry',
  'planeGeometry',
  'cylinderGeometry',
  'coneGeometry',
  'torusGeometry',
  'customGeometry',
  'fullMesh',
]);

/**
 * Checks if a requirement is satisfied on `entity`.
 * Handles the "geometry" wildcard: any geometry component satisfies `requires: ["geometry"]`.
 */
export function satisfiesRequirement(entity: EntityState, req: ComponentDependency): boolean {
  if (entity.components.has(req as ComponentType)) return true;
  if (req === 'geometry') {
    for (const [t] of entity.components) {
      if (GEOMETRY_TYPES.has(t)) return true;
    }
  }
  return false;
}

/**
 * Walks up the parent chain looking for a component of the required type.
 */
export function satisfiesHierarchyRequirement(
  entity: EntityState,
  req: ComponentDependency,
): boolean {
  let current: EntityState | undefined = entity;
  while (current) {
    if (satisfiesRequirement(current, req)) return true;
    current = current.parent;
  }
  return false;
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
        if (!satisfiesHierarchyRequirement(entity, req)) {
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
