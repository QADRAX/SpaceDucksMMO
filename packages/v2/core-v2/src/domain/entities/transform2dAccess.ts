import type { EntityState } from './types';
import type { Transform2dComponent } from '../components/types/ui';
import { getComponent, hasComponent } from './entity';

/** True when the entity has a `transform2d` component (even if disabled). */
export function hasTransform2d(entity: EntityState): boolean {
  return hasComponent(entity, 'transform2d');
}

/**
 * Returns the **active** `transform2d` box, or `undefined` when missing **or disabled**.
 * Runtime consumers should use this (null-logic).
 * For authoring/inspector access while disabled, use {@link getComponent}(`'transform2d'`).
 */
export function getTransform2d(entity: EntityState): Transform2dComponent | undefined {
  const t = getComponent<Transform2dComponent>(entity, 'transform2d');
  if (!t || t.enabled === false) return undefined;
  return t;
}

/**
 * Raw transform2d including when disabled. Prefer {@link getTransform2d} at runtime.
 */
export function getTransform2dComponent(
  entity: EntityState,
): Transform2dComponent | undefined {
  return getComponent<Transform2dComponent>(entity, 'transform2d');
}

/** Returns the active transform2d or throws. */
export function requireTransform2d(entity: EntityState): Transform2dComponent {
  const t = getTransform2d(entity);
  if (!t) {
    throw new Error(`Entity "${entity.id}" has no active transform2d component`);
  }
  return t;
}

/** Walks ancestors and returns the nearest **active** transform2d, if any. */
export function findNearestAncestorTransform2d(
  entity: EntityState,
): Transform2dComponent | undefined {
  let current = entity.parent;
  while (current) {
    const t = getTransform2d(current);
    if (t) return t;
    current = current.parent;
  }
  return undefined;
}

/**
 * Links this entity's transform2d parent to the nearest ancestor with an active transform2d.
 * Uses the raw component (including when self is disabled) so re-enable keeps a valid chain.
 */
export function reconcileTransform2dParent(entity: EntityState): void {
  const t = getTransform2dComponent(entity);
  if (!t) return;
  t.parent = findNearestAncestorTransform2d(entity) ?? null;
  t.dirty = true;
}

/**
 * Reconciles transform2d parent links for `entity` and every descendant.
 * Call after enable/disable/add/remove of `transform2d` or hierarchy changes.
 */
export function reconcileTransform2dSubtree(entity: EntityState): void {
  reconcileTransform2dParent(entity);
  for (const child of entity.children) {
    reconcileTransform2dSubtree(child);
  }
}
