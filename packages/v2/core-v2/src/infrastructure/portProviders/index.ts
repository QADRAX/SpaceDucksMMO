import { provideSceneEventBusProvider } from './provideSceneEventBusProvider';
import { provideUISlotOperations } from './provideUISlotOperations';

export { provideSceneEventBusProvider } from './provideSceneEventBusProvider';
export { provideUISlotOperations } from './provideUISlotOperations';

/** Default port providers (internal ports). Run first during setup. */
export const defaultPortProviders = [
  provideSceneEventBusProvider,
  provideUISlotOperations,
] as const;
