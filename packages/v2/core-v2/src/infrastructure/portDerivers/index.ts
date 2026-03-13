import { deriveSceneEventBusProvider } from './deriveSceneEventBusProvider';
import { deriveUISlotOperations } from './deriveUISlotOperations';

export { deriveSceneEventBusProvider } from './deriveSceneEventBusProvider';
export { deriveUISlotOperations } from './deriveUISlotOperations';

/** Default port derivers (internal ports). Run first during setup. */
export const defaultPortDerivers = [
  deriveSceneEventBusProvider,
  deriveUISlotOperations,
] as const;
