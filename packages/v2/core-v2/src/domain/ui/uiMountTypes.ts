import type { EntityId, SceneId, ViewportId } from '../ids';
import type { ViewportRect } from '../viewport';

/**
 * Opaque host surface handle (DOM element, canvas layer id, native view, …).
 * Core never inspects the payload; adapters own the interpretation.
 */
export type UISurfaceHandle = Readonly<{
  readonly viewportId: ViewportId;
  /** Host-specific attachment point. */
  readonly hostRef: unknown;
}>;

/** Layout box projected from active `transform2d` into a viewport surface. */
export interface UIRootLayout {
  readonly rect: ViewportRect;
  readonly zIndex: number;
  readonly rotation: number;
}

/** Shared identity for a mounted UI root on one viewport surface. */
export interface UIRootMountKey {
  readonly entityId: EntityId;
  readonly sceneId: SceneId;
  readonly viewportId: ViewportId;
}
