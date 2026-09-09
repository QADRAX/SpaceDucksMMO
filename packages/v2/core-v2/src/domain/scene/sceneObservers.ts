import { emitSceneChange, findEntityWithComponent } from '.';
import type { SceneState } from '.';
import { addComponent, removeComponent } from '..';
import type { ComponentChangeListener, ComponentListener, ComponentType, EntityState } from '..';
import { validateHierarchyInSubtree } from '../entities';
import {
  getTransform3d,
  reconcileTransform3dSubtree,
} from '../entities/transform3dAccess';
import { reconcileTransform2dSubtree } from '../entities/transform2dAccess';
import { onTransformChange, removeTransformChange } from '../entities/transform';
import type { TransformState } from '../entities/types';

/**
 * Attaches entity-level observers that forward events to the scene.
 * Returns a cleanup function that detaches all observers.
 */
export function attachEntityObservers(scene: SceneState, entity: EntityState): () => void {
  let handling = false;
  let attachedState: TransformState | undefined;
  let transformCb: (() => void) | undefined;

  const detachTransformListener = () => {
    if (attachedState && transformCb) {
      removeTransformChange(attachedState, transformCb);
    }
    attachedState = undefined;
    transformCb = undefined;
  };

  const attachTransformListener = () => {
    const state = getTransform3d(entity);
    if (state === attachedState) return;
    detachTransformListener();
    if (!state) return;
    transformCb = () => {
      emitSceneChange(scene, { kind: 'transform-changed', entityId: entity.id });
    };
    attachedState = state;
    onTransformChange(state, transformCb);
  };

  /** After transform3d add/remove/enable toggle: listener + pose chain for subtree. */
  const onTransform3dParticipationChanged = () => {
    reconcileTransform3dSubtree(entity);
    attachTransformListener();
  };

  /** After transform2d add/remove/enable toggle: screen pose chain for subtree. */
  const onTransform2dParticipationChanged = () => {
    reconcileTransform2dSubtree(entity);
  };

  const componentListener: ComponentListener = (event) => {
    if (handling) return;
    handling = true;
    try {
      if (event.action === 'added') {
        const meta = event.component.metadata;
        if (meta.uniqueInScene) {
          const existing = findEntityWithComponent(
            scene,
            event.component.type as ComponentType,
            entity.id,
          );
          if (existing) {
            removeComponent(entity, event.component.type);
            emitSceneChange(scene, {
              kind: 'error',
              message: `Component '${event.component.type}' is unique in scene and already on '${existing.id}'.`,
            });
            return;
          }
        }
        if (event.component.type === 'transform3d') {
          onTransform3dParticipationChanged();
        }
        if (event.component.type === 'transform2d') {
          onTransform2dParticipationChanged();
        }
      } else if (event.action === 'removed') {
        const errors = validateHierarchyInSubtree(entity);
        if (errors.length > 0) {
          const result = addComponent(entity, event.component);
          if (!result.ok) {
            emitSceneChange(scene, {
              kind: 'error',
              message: `Hierarchy broken by removing '${event.component.type}' and rollback failed: ${result.error.message}`,
            });
            return;
          }
          emitSceneChange(scene, {
            kind: 'error',
            message: `Cannot remove '${event.component.type}': ${errors.join('; ')}`,
          });
          return;
        }
        if (event.component.type === 'transform3d') {
          detachTransformListener();
          for (const child of entity.children) {
            reconcileTransform3dSubtree(child);
          }
        }
        if (event.component.type === 'transform2d') {
          for (const child of entity.children) {
            reconcileTransform2dSubtree(child);
          }
        }
      }
      emitSceneChange(scene, {
        kind: 'component-changed',
        entityId: event.entityId,
        componentType: event.component.type,
      });
    } finally {
      handling = false;
    }
  };

  const changeListener: ComponentChangeListener = (entityId, type) => {
    if (type === 'transform3d') {
      onTransform3dParticipationChanged();
    }
    if (type === 'transform2d') {
      onTransform2dParticipationChanged();
    }
    emitSceneChange(scene, { kind: 'component-changed', entityId, componentType: type });
  };

  entity.observers.addComponentListener(componentListener);
  entity.observers.addChangeListener(changeListener);
  attachTransformListener();

  return () => {
    entity.observers.removeComponentListener(componentListener);
    entity.observers.removeChangeListener(changeListener);
    detachTransformListener();
  };
}
