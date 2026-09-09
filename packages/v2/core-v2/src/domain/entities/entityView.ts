import type { ComponentType } from '../components';
import type { DebugKind } from './types';
import type { ComponentBase } from '../components';
import type { EntityState } from './types';
import type { TransformView } from './transformView';
import { createTransformView } from './transformView';
import { getTransform3d } from './transform3dAccess';

/** Readonly snapshot of an entity, created at API boundaries. */
export interface EntityView {
  readonly id: string;
  readonly displayName: string;
  readonly gizmoIcon: string | undefined;
  /** Present only when the entity has a transform3d component. */
  readonly transform: TransformView | undefined;
  readonly components: ReadonlyMap<ComponentType, Readonly<ComponentBase>>;
  readonly debugFlags: ReadonlyMap<DebugKind, boolean>;
  readonly childIds: ReadonlyArray<string>;
  readonly parentId: string | undefined;
}

/** Creates a frozen snapshot of the entity for external consumers. */
export function createEntityView(entity: EntityState): EntityView {
  const compSnapshot = new Map<ComponentType, Readonly<ComponentBase>>();
  for (const [type, comp] of entity.components) {
    if (type === 'transform3d') {
      // Avoid freezing runtime pose callbacks into the view bag.
      compSnapshot.set(
        type,
        Object.freeze({
          type: comp.type,
          enabled: comp.enabled,
          metadata: comp.metadata,
        }) as Readonly<ComponentBase>,
      );
      continue;
    }
    compSnapshot.set(type, Object.freeze({ ...comp }));
  }

  const state = getTransform3d(entity);

  return Object.freeze({
    id: entity.id,
    displayName: entity.displayName,
    gizmoIcon: entity.gizmoIcon,
    transform: state ? createTransformView(state) : undefined,
    components: compSnapshot,
    debugFlags: new Map(entity.debugFlags),
    childIds: Object.freeze(entity.children.map((c) => c.id)),
    parentId: entity.parent?.id,
  });
}
