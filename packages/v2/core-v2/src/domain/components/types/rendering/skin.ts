import type { ComponentBase } from '../core';
import type { EntityId } from '../../../ids';

/**
 * Skinned mesh binding: geometry and weights live on the mesh resource; joint palette order
 * is defined by entities with {@link JointComponent} under {@link rigRootEntityId}.
 */
export interface SkinComponent extends ComponentBase<'skin', SkinComponent> {
  /**
   * Root entity of the bone hierarchy. Descendants with `joint` + `jointIndex` define
   * the joint order matched by vertex `jointIndices` on the mesh.
   */
  rigRootEntityId: EntityId;
}
