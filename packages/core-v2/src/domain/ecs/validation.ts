import type { ComponentType } from '../types/componentType';
import type { Result } from '../types/result';
import { ok, err } from '../types/result';
import type { ComponentBase } from './component';
import type { EntityState } from './entity';

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

  if (meta.requires) {
    for (const req of meta.requires) {
      if (!satisfiesRequirement(entity, req)) {
        return err('validation', `Missing required component "${req}".`);
      }
    }
  }

  if (meta.requiresInHierarchy) {
    for (const req of meta.requiresInHierarchy) {
      if (!satisfiesHierarchyRequirement(entity, req)) {
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
function satisfiesRequirement(entity: EntityState, req: string): boolean {
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
function satisfiesHierarchyRequirement(entity: EntityState, req: string): boolean {
  let current: EntityState | undefined = entity;
  while (current) {
    if (satisfiesRequirement(current, req)) return true;
    current = current.parent;
  }
  return false;
}
