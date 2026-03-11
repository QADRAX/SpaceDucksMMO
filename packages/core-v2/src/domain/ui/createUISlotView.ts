import type { UISlotState, UISlotView } from './types';

/** Creates a readonly snapshot of a UI slot for port consumers. */
export function createUISlotView(slot: UISlotState): UISlotView {
  return {
    slotId: slot.slotId,
    sceneId: slot.sceneId,
    viewportId: slot.viewportId,
    rect: { ...slot.rect },
    zIndex: slot.zIndex,
    enabled: slot.enabled,
    descriptor: slot.descriptor,
  };
}
