import type { SceneId, UISlotId, ViewportId } from '../ids';
import type { ViewportRect } from '../viewport';
import type { UISlotState } from './types';
import { DEFAULT_RECT } from '../viewport/constants';

/** Parameters for creating a UI slot. */
export interface CreateUISlotParams {
  readonly slotId: UISlotId;
  readonly sceneId: SceneId;
  readonly viewportId?: ViewportId | null;
  readonly rect?: Partial<ViewportRect>;
  readonly zIndex?: number;
  readonly enabled?: boolean;
  readonly descriptor?: unknown;
}

/** Creates a mutable UI slot state with sensible defaults. Pure factory. */
export function createUISlot(params: CreateUISlotParams): UISlotState {
  return {
    slotId: params.slotId,
    sceneId: params.sceneId,
    viewportId: params.viewportId ?? null,
    rect: { ...DEFAULT_RECT, ...params.rect },
    zIndex: params.zIndex ?? 0,
    enabled: params.enabled ?? true,
    descriptor: params.descriptor ?? {},
  };
}
