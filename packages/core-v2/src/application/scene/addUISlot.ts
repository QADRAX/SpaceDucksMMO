import type { Result } from '../../domain/utils';
import { ok, err } from '../../domain/utils';
import { defineSceneUseCase } from '../../domain/useCases';
import { emitSceneChange } from '../../domain/scene/emitSceneChange';
import { createUISlot } from '../../domain/ui';
import type { AddUISlotParams } from '../../domain/ports';

/**
 * Adds a UI slot to the scene.
 * Emits ui-slot-added. UISubsystem delegates mount to UIRendererPort.
 */
export const addUISlot = defineSceneUseCase<AddUISlotParams, Result<void>>({
  name: 'addUISlot',
  execute(scene, params) {
    if (scene.uiSlots.has(params.slotId)) {
      return err('validation', `UI slot '${params.slotId}' already exists in scene.`);
    }

    const slot = createUISlot({
      slotId: params.slotId,
      sceneId: scene.id,
      viewportId: params.viewportId,
      rect: params.rect,
      zIndex: params.zIndex,
      enabled: params.enabled,
      descriptor: params.descriptor,
    });

    scene.uiSlots.set(slot.slotId, slot);
    emitSceneChange(scene, { kind: 'ui-slot-added', slotId: slot.slotId });
    return ok(undefined);
  },
});
