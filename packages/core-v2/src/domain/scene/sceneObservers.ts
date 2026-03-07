import type { SceneState } from './types';
import type { ComponentType } from '../components';
import type { ComponentListener, ComponentChangeListener } from '../components';
import type { EntityState } from '../entities';
import { addComponent, removeComponent } from '../entities';
import { onTransformChange, removeTransformChange } from '../entities';
import { emitSceneChange } from './emitSceneChange';
import { findEntityWithComponent } from './sceneValidation';
import { validateHierarchyInSubtree } from '../entities/validation';

/**
 * Attaches entity-level observers that forward events to the scene.
 * Returns a cleanup function that detaches all observers.
 */
export function attachEntityObservers(scene: SceneState, entity: EntityState): () => void {
  let handling = false;

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
    emitSceneChange(scene, { kind: 'component-changed', entityId, componentType: type });
  };

  const transformCb = () => {
    emitSceneChange(scene, { kind: 'transform-changed', entityId: entity.id });
  };

  entity.observers.addComponentListener(componentListener);
  entity.observers.addChangeListener(changeListener);
  onTransformChange(entity.transform, transformCb);

  return () => {
    entity.observers.removeComponentListener(componentListener);
    entity.observers.removeChangeListener(changeListener);
    removeTransformChange(entity.transform, transformCb);
  };
}
