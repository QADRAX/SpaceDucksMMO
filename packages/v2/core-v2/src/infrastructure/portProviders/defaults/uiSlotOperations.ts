import type { EngineState } from '../../../domain/engine';
import type {
  UISlotOperationsPort,
  AddUISlotParams,
  UpdateUISlotParams,
} from '../../../domain/ports';
import type { SceneId, UISlotId } from '../../../domain/ids';
import { err } from '../../../domain/utils';
import { addUISlot } from '../../../application/scene/addUISlot';
import { removeUISlot } from '../../../application/scene/removeUISlot';
import { updateUISlot } from '../../../application/scene/updateUISlot';

/** Creates the default implementation of UISlotOperationsPort. Delegates to scene use cases. */
export function createDefaultUISlotOperationsPort(engine: EngineState): UISlotOperationsPort {
  return {
    addUISlot(sceneId: SceneId, params: AddUISlotParams) {
      const scene = engine.scenes.get(sceneId);
      if (!scene) return err('validation', `Scene '${sceneId}' not found`);
      return addUISlot.execute(scene, params);
    },

    removeUISlot(sceneId: SceneId, slotId: UISlotId) {
      const scene = engine.scenes.get(sceneId);
      if (!scene) return err('validation', `Scene '${sceneId}' not found`);
      return removeUISlot.execute(scene, { slotId });
    },

    updateUISlot(sceneId: SceneId, slotId: UISlotId, params: UpdateUISlotParams) {
      const scene = engine.scenes.get(sceneId);
      if (!scene) return err('validation', `Scene '${sceneId}' not found`);
      return updateUISlot.execute(scene, { slotId, ...params });
    },
  };
}
