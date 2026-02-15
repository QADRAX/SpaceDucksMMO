import { Entity } from '@duckengine/ecs';

export type ValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateReparent(child: Entity, newParent?: Entity): ValidationResult {
  if (!newParent) return { ok: true };

  if (newParent.id === child.id) {
    return { ok: false, error: 'Cannot parent an entity to itself' };
  }

  let cur: Entity | undefined = newParent;
  while (cur) {
    if (cur.id === child.id) {
      return { ok: false, error: 'Cannot parent an entity to its descendant' };
    }
    cur = cur.parent;
  }

  return { ok: true };
}
