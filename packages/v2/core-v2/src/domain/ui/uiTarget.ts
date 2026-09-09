import type { EntityId, ViewportId } from '../ids';

/**
 * Viewport filter for UI roots (`uiView` / `uiSpa`).
 * Empty / default → all enabled viewports of the entity's scene.
 *
 * @see docs/v2-ui-system-contract.md §3.6
 */
export interface UiTarget {
  /** Explicit viewport ids. */
  readonly viewportIds?: ReadonlyArray<ViewportId>;
  /** Match viewports whose camera entity id is listed. */
  readonly cameraIds?: ReadonlyArray<EntityId>;
  /** Match viewports whose camera entity has any of these tags. */
  readonly cameraTags?: ReadonlyArray<string>;
}

/** Empty target — paints on all enabled viewports of the scene. */
export const EMPTY_UI_TARGET: UiTarget = {};
