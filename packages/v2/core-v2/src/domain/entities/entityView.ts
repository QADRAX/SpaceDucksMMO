import type { ComponentType } from '../components';
import type { DebugKind } from './types';
import type { ComponentBase } from '../components';
import type { EntityState } from './types';
import type { TransformView } from './transformView';
import { createTransformView } from './transformView';

/** Readonly snapshot of an entity, created at API boundaries. */
export interface EntityView {
  readonly id: string;
  readonly displayName: string;
  readonly gizmoIcon: string | undefined;
  readonly transform: TransformView;
  readonly components: ReadonlyMap<ComponentType, Readonly<ComponentBase>>;
  readonly debugFlags: ReadonlyMap<DebugKind, boolean>;
  readonly childIds: ReadonlyArray<string>;
  readonly parentId: string | undefined;
}

/** Creates a frozen snapshot of the entity for external consumers. */
export function createEntityView(entity: EntityState): EntityView {
  const compSnapshot = new Map<ComponentType, Readonly<ComponentBase>>();
  for (const [type, comp] of entity.components) {
    compSnapshot.set(type, Object.freeze({ ...comp }));
  }

  return Object.freeze({
    id: entity.id,
    displayName: entity.displayName,
    gizmoIcon: entity.gizmoIcon,
    transform: createTransformView(entity.transform),
    components: compSnapshot,
    debugFlags: new Map(entity.debugFlags),
    childIds: Object.freeze(entity.children.map((c) => c.id)),
    parentId: entity.parent?.id,
  });
}
