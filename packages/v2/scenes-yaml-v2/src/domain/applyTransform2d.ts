/**
 * Domain: apply transform2d sugar by ensuring transform2d and setting locals.
 */
import {
  addComponent,
  createComponent,
  getTransform2dComponent,
} from '@duckengine/core-v2';
import type { EntityState } from '@duckengine/core-v2';
import type { Transform2dDefinition } from './sceneDefinition';

/**
 * Ensures transform2d on the entity and applies screen-box locals from YAML sugar.
 * Mutates the raw component when disabled (does not create a duplicate).
 */
export function applyTransform2dToEntity(
  entity: EntityState,
  transform2d: Transform2dDefinition,
): void {
  let state = getTransform2dComponent(entity);
  if (!state) {
    addComponent(
      entity,
      createComponent('transform2d', {
        position: transform2d.position,
        size: transform2d.size,
        rotation: transform2d.rotation,
        scale: transform2d.scale,
        anchor: transform2d.anchor,
        pivot: transform2d.pivot,
        zIndex: transform2d.zIndex,
        enabled: transform2d.enabled,
      }),
    );
    return;
  }

  if (transform2d.position) {
    state.localPosition.x = transform2d.position.x;
    state.localPosition.y = transform2d.position.y;
    state.dirty = true;
  }
  if (transform2d.size) {
    state.localSize.x = transform2d.size.x;
    state.localSize.y = transform2d.size.y;
    state.dirty = true;
  }
  if (transform2d.rotation !== undefined) {
    state.localRotation = transform2d.rotation;
    state.dirty = true;
  }
  if (transform2d.scale) {
    state.localScale.x = transform2d.scale.x;
    state.localScale.y = transform2d.scale.y;
    state.dirty = true;
  }
  if (transform2d.anchor) {
    state.anchor.x = transform2d.anchor.x;
    state.anchor.y = transform2d.anchor.y;
    state.dirty = true;
  }
  if (transform2d.pivot) {
    state.pivot.x = transform2d.pivot.x;
    state.pivot.y = transform2d.pivot.y;
    state.dirty = true;
  }
  if (transform2d.zIndex !== undefined) {
    state.zIndex = transform2d.zIndex;
    state.dirty = true;
  }
  if (transform2d.enabled !== undefined) {
    state.enabled = transform2d.enabled;
  }
}
