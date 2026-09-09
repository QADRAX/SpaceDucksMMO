import type { ComponentBase } from '../core';

/** 2D vector (screen-space UI). */
export interface Vec2Like {
  readonly x: number;
  readonly y: number;
}

/**
 * Optional screen-space root box for UI entities.
 * The component itself is the 2D pose/box (no nested state bag).
 *
 * {@link ComponentBase.enabled} means **screen participation**:
 * - `false` → out of screen (`getTransform2d` is undefined): no UI projection;
 *   children re-link to the next active ancestor.
 * - Authoring still uses {@link getComponent}(`'transform2d'`) while disabled.
 */
export type Transform2dComponent = ComponentBase<'transform2d', Transform2dComponent> & {
  /** Local position in parent (or viewport) space, normalized 0–1 by default. */
  localPosition: { x: number; y: number };
  /** Local size (width, height) in parent/viewport space. */
  localSize: { x: number; y: number };
  /** Local rotation around Z in radians. */
  localRotation: number;
  /** Local non-uniform scale. */
  localScale: { x: number; y: number };
  /**
   * Anchor in parent space (0–1). `(0,0)` = parent top-left (viewport convention TBD by runtime).
   */
  anchor: { x: number; y: number };
  /**
   * Pivot in self space (0–1) used when applying rotation/scale.
   */
  pivot: { x: number; y: number };
  /** Stacking order among sibling UI roots (higher draws above). */
  zIndex: number;
  /** Dirty flag for layout / projection consumers. */
  dirty: boolean;
  /** Pose parent: nearest ancestor with an active transform2d (runtime link). */
  parent: Transform2dComponent | null;
};

/** Optional overrides when creating a transform2d component. */
export interface Transform2dCreateOverride {
  readonly enabled?: boolean;
  readonly position?: Vec2Like;
  readonly size?: Vec2Like;
  readonly rotation?: number;
  readonly scale?: Vec2Like;
  readonly anchor?: Vec2Like;
  readonly pivot?: Vec2Like;
  readonly zIndex?: number;
}
