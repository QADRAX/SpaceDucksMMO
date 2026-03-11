import type { UISlotId } from '../../domain/ids';
import type { Result } from '../../domain/utils';
import { ok, err } from '../../domain/utils';
import { defineSceneUseCase } from '../../domain/useCases';
import { emitSceneChange } from '../../domain/scene/emitSceneChange';

/** Parameters for the removeUISlot use case. */
export interface RemoveUISlotParams {
  readonly slotId: UISlotId;
}

/**
 * Removes a UI slot from the scene.
 * Emits ui-slot-removed. UISubsystem delegates unmount to UIRendererPort.
 */
export const removeUISlot = defineSceneUseCase<RemoveUISlotParams, Result<void>>({
  name: 'removeUISlot',
  execute(scene, { slotId }) {
    if (!scene.uiSlots.has(slotId)) {
      return err('not-found', `UI slot '${slotId}' not found in scene.`);
    }

    scene.uiSlots.delete(slotId);
    emitSceneChange(scene, { kind: 'ui-slot-removed', slotId });
    return ok(undefined);
  },
});
