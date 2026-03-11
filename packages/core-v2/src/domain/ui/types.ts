import type { SceneId, UISlotId, ViewportId } from '../ids';
import type { ViewportRect } from '../viewport';

/**
 * Mutable UI slot state operated on by application-layer use cases.
 * Declares a region where the client adapter mounts a SPA (React, Preact, etc.).
 */
export interface UISlotState {
  readonly slotId: UISlotId;
  readonly sceneId: SceneId;
  /** null = all viewports of the scene. */
  readonly viewportId: ViewportId | null;
  rect: ViewportRect;
  zIndex: number;
  enabled: boolean;
  /** Opaque payload for the adapter (e.g. componentId, appUrl). */
  descriptor: unknown;
}

/**
 * Readonly snapshot of a UI slot for port consumers.
 */
export interface UISlotView {
  readonly slotId: UISlotId;
  readonly sceneId: SceneId;
  readonly viewportId: ViewportId | null;
  readonly rect: ViewportRect;
  readonly zIndex: number;
  readonly enabled: boolean;
  readonly descriptor: unknown;
}
