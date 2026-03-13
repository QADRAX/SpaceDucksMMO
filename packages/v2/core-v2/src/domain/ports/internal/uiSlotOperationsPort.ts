import type { Result } from '../../utils';
import type { SceneId, UISlotId, ViewportId } from '../../ids';
import type { ViewportRect } from '../../viewport';

/** Parameters for adding a UI slot. */
export interface AddUISlotParams {
  readonly slotId: UISlotId;
  readonly viewportId?: ViewportId | null;
  readonly rect?: Partial<ViewportRect>;
  readonly zIndex?: number;
  readonly enabled?: boolean;
  readonly descriptor?: unknown;
}

/** Parameters for updating a UI slot. */
export interface UpdateUISlotParams {
  readonly rect?: Partial<ViewportRect>;
  readonly zIndex?: number;
  readonly enabled?: boolean;
  readonly descriptor?: unknown;
}

/**
 * Port that wraps scene UI slot use cases for scripting bridges.
 * Internal port: core implements it. Consumer can override via params.ports.
 */
export interface UISlotOperationsPort {
  addUISlot(sceneId: SceneId, params: AddUISlotParams): Result<void>;
  removeUISlot(sceneId: SceneId, slotId: UISlotId): Result<void>;
  updateUISlot(sceneId: SceneId, slotId: UISlotId, params: UpdateUISlotParams): Result<void>;
}
