import type { ComponentBase } from '../core';
import type { TransformState } from '../../../entities/types';
import type { EulerLike, Vec3Like } from '../../../math';

/**
 * Optional 3D pose component. Entities without this have no world transform.
 * The component itself is the pose (local/world TRS, dirty, parent-pose link).
 * Uses {@link ComponentBase.enabled}: runtime consumers should go through
 * {@link getTransform3d}, which returns `undefined` when disabled.
 */
export type Transform3dComponent = ComponentBase<'transform3d', Transform3dComponent> &
  TransformState;

/** Optional overrides when creating a transform3d component. */
export interface Transform3dCreateOverride {
  readonly enabled?: boolean;
  readonly position?: Vec3Like;
  readonly rotation?: EulerLike;
  readonly scale?: Vec3Like;
}
