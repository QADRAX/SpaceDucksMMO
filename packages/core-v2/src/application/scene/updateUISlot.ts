import type { UISlotId } from '../../domain/ids';
import type { Result } from '../../domain/utils';
import { ok, err } from '../../domain/utils';
import { defineSceneUseCase } from '../../domain/useCases';
import { emitSceneChange } from '../../domain/scene/emitSceneChange';
import { DEFAULT_RECT } from '../../domain/viewport/constants';

/** Parameters for the updateUISlot use case. */
export interface UpdateUISlotParamsWithId {
  readonly slotId: UISlotId;
  readonly rect?: Partial<{ x: number; y: number; w: number; h: number }>;
  readonly zIndex?: number;
  readonly enabled?: boolean;
  readonly descriptor?: unknown;
}

/**
 * Updates a UI slot in the scene.
 * Emits ui-slot-updated. UISubsystem delegates updateSlot to UIRendererPort.
 */
export const updateUISlot = defineSceneUseCase<UpdateUISlotParamsWithId, Result<void>>({
  name: 'updateUISlot',
  execute(scene, { slotId, rect, zIndex, enabled, descriptor }) {
    const slot = scene.uiSlots.get(slotId);
    if (!slot) {
      return err('not-found', `UI slot '${slotId}' not found in scene.`);
    }

    if (rect !== undefined) {
      slot.rect = { ...DEFAULT_RECT, ...slot.rect, ...rect };
    }
    if (zIndex !== undefined) {
      slot.zIndex = zIndex;
    }
    if (enabled !== undefined) {
      slot.enabled = enabled;
    }
    if (descriptor !== undefined) {
      slot.descriptor = descriptor;
    }

    emitSceneChange(scene, { kind: 'ui-slot-updated', slotId });
    return ok(undefined);
  },
});
