import type { ComponentType } from '../components';
import type { DebugKind } from './types';
import type { Result } from '../utils';
import { ok, err } from '../utils';
import type { EntityState } from './types';
import type { ComponentBase } from '../components';
import { createEntityObservers } from './observers';
import { createTransform, setTransformParent } from './transform';
import { validateAddComponent, validateRemoveComponent } from './validation';
import type { EntityId } from '../ids';

/** Creates a new entity state with a fresh transform and empty component map. */
export function createEntity(id: EntityId, displayName?: string): EntityState {
  return {
    id,
    transform: createTransform(),
    components: new Map(),
    observers: createEntityObservers(),
    debugFlags: new Map(),
    children: [],
    displayName: displayName ?? id,
    gizmoIcon: undefined,
    parent: undefined,
  };
}

/** Adds a component after validation. Returns a Result to avoid throwing. */
export function addComponent(entity: EntityState, comp: ComponentBase): Result<void> {
  const v = validateAddComponent(entity, comp);
  if (!v.ok) return v;

  entity.components.set(comp.type, comp);
  entity.observers.fireComponentAdded(entity.id, comp);
  return ok(undefined);
}

/** Removes a component after validation. Returns a Result to avoid throwing. */
export function removeComponent(entity: EntityState, type: ComponentType): Result<void> {
  const comp = entity.components.get(type);
  if (!comp) return err('not-found', `Component "${type}" not found.`);

  const v = validateRemoveComponent(entity, type);
  if (!v.ok) return v;

  entity.components.delete(type);
  entity.observers.fireComponentRemoved(entity.id, comp);
  return ok(undefined);
}

/** Retrieves a component by type. Returns `undefined` when absent. */
export function getComponent<T extends ComponentBase>(
  entity: EntityState,
  type: ComponentType,
): T | undefined {
  return entity.components.get(type) as T | undefined;
}

/** Checks whether the entity owns a component of the given type. */
export function hasComponent(entity: EntityState, type: ComponentType): boolean {
  return entity.components.has(type);
}

/** Returns a snapshot array of all components currently on the entity. */
export function getAllComponents(entity: EntityState): ComponentBase[] {
  return [...entity.components.values()];
}

/**
 * Mutates component fields via an updater callback, then fires a change event.
 * Returns err when the component is not present.
 */
export function updateComponent<T extends ComponentBase>(
  entity: EntityState,
  type: ComponentType,
  updater: (comp: T) => void,
): Result<void> {
  const comp = entity.components.get(type) as T | undefined;
  if (!comp) return err('not-found', `Component "${type}" not found.`);
  updater(comp);
  entity.observers.fireComponentChanged(entity.id, type);
  return ok(undefined);
}

/** Sets or unsets the enabled flag on a component. */
export function setComponentEnabled(
  entity: EntityState,
  type: ComponentType,
  enabled: boolean,
): Result<void> {
  return updateComponent(entity, type, (c) => {
    c.enabled = enabled;
  });
}

/** Updates the display name and fires a presentation event. */
export function setDisplayName(entity: EntityState, name: string): void {
  entity.displayName = name;
  entity.observers.firePresentationChanged(entity.id);
}

/** Updates the gizmo icon and fires a presentation event. */
export function setGizmoIcon(entity: EntityState, icon: string | undefined): void {
  entity.gizmoIcon = icon;
  entity.observers.firePresentationChanged(entity.id);
}

/** Sets a debug visualisation flag. */
export function setDebugEnabled(entity: EntityState, kind: DebugKind, enabled: boolean): void {
  entity.debugFlags.set(kind, enabled);
  entity.observers.fireDebugChanged(entity.id, kind, enabled);
}

/** Reads a debug flag. Defaults to `false` when not explicitly set. */
export function isDebugEnabled(entity: EntityState, kind: DebugKind): boolean {
  return entity.debugFlags.get(kind) ?? false;
}

/** Returns all debug kinds currently enabled on the entity. */
export function getEnabledDebugs(entity: EntityState): DebugKind[] {
  const out: DebugKind[] = [];
  for (const [kind, on] of entity.debugFlags) {
    if (on) out.push(kind);
  }
  return out;
}

/** Adds a child entity, setting up parent refs and transform parenting. */
export function addChild(parent: EntityState, child: EntityState): void {
  if (child.parent === parent) return;
  if (child.parent) {
    removeChildById(child.parent, child.id);
  }
  child.parent = parent;
  parent.children.push(child);
  setTransformParent(child.transform, parent.transform);
}

/** Removes a child by id, clearing parent refs and transform parenting. */
export function removeChildById(parent: EntityState, childId: EntityId): void {
  const idx = parent.children.findIndex((c) => c.id === childId);
  if (idx < 0) return;
  const child = parent.children[idx];
  parent.children.splice(idx, 1);
  child.parent = undefined;
  setTransformParent(child.transform, undefined);
}

/** Finds a direct child by id. */
export function getChild(parent: EntityState, childId: EntityId): EntityState | undefined {
  return parent.children.find((c) => c.id === childId);
}

/** Returns a readonly copy of the children array. */
export function getChildren(parent: EntityState): ReadonlyArray<EntityState> {
  return parent.children;
}
