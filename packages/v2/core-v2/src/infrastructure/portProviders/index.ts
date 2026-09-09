import { provideSceneEventBusProvider } from './provideSceneEventBusProvider';

export { provideSceneEventBusProvider } from './provideSceneEventBusProvider';

/** Default port providers (internal ports). Run first during setup. */
export const defaultPortProviders = [provideSceneEventBusProvider] as const;
