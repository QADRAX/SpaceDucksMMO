import type { EntityState } from './types';
import type { Transform3dComponent } from '../components/types/transform';
import { getComponent, hasComponent } from './entity';
import { setTransformParent } from './transform';

/** True when the entity has a `transform3d` component (even if disabled). */
export function hasTransform3d(entity: EntityState): boolean {
  return hasComponent(entity, 'transform3d');
}

/**
 * Returns the **active** `transform3d` pose, or `undefined` when missing **or disabled**.
 * Runtime consumers should use this (null-logic): no separate `.enabled` checks.
 * For authoring/inspector access to a disabled pose, use {@link getComponent}(`'transform3d'`).
 */
export function getTransform3d(entity: EntityState): Transform3dComponent | undefined {
  const t = getComponent<Transform3dComponent>(entity, 'transform3d');
  if (!t || t.enabled === false) return undefined;
  return t;
}

/**
 * Raw pose component including when disabled. Prefer {@link getTransform3d} at runtime.
 */
export function getTransform3dComponent(
  entity: EntityState,
): Transform3dComponent | undefined {
  return getComponent<Transform3dComponent>(entity, 'transform3d');
}

/**
 * Returns the active pose component or throws.
 * Prefer optional {@link getTransform3d} at call sites that can no-op without pose.
 */
export function requireTransform3d(entity: EntityState): Transform3dComponent {
  const t = getTransform3d(entity);
  if (!t) {
    throw new Error(`Entity "${entity.id}" has no active transform3d component`);
  }
  return t;
}

/** Walks ancestors and returns the nearest **active** pose component, if any. */
export function findNearestAncestorTransform3d(
  entity: EntityState,
): Transform3dComponent | undefined {
  let current = entity.parent;
  while (current) {
    const t = getTransform3d(current);
    if (t) return t;
    current = current.parent;
  }
  return undefined;
}

/**
 * Links this entity's pose parent to the nearest ancestor with an active `transform3d`.
 * Uses the raw component (including when self is disabled) so re-enable keeps a valid chain.
 */
export function reconcileTransform3dParent(entity: EntityState): void {
  const t = getTransform3dComponent(entity);
  if (!t) return;
  setTransformParent(t, findNearestAncestorTransform3d(entity));
}

/**
 * Reconciles pose-parent links for `entity` and every descendant.
 * Call after enable/disable/add/remove of `transform3d` or hierarchy changes.
 */
export function reconcileTransform3dSubtree(entity: EntityState): void {
  reconcileTransform3dParent(entity);
  for (const child of entity.children) {
    reconcileTransform3dSubtree(child);
  }
}
