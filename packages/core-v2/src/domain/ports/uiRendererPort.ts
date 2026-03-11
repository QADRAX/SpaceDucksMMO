import type { UISlotId } from '../ids';
import type { UISlotView } from '../ui';

/**
 * Port for mounting and unmounting UI SPAs in DOM containers.
 * The client implements this (e.g. React.createRoot, Preact.render).
 * The engine never creates DOM elements; it delegates to this port.
 */
export interface UIRendererPort {
  /**
   * Mounts a UI application in the given container.
   * The adapter creates/mounts the SPA (React, Preact, etc.).
   */
  mount(slot: UISlotView, container: HTMLElement): void | Promise<void>;

  /**
   * Unmounts the UI from the slot.
   */
  unmount(slotId: UISlotId): void | Promise<void>;

  /**
   * Updates slot parameters (rect, zIndex, enabled).
   * Optional: adapter may re-mount if it does not support update.
   */
  updateSlot?(slotId: UISlotId, params: Partial<UISlotView>): void | Promise<void>;
}
