import type { SubsystemPortProvider } from '../../domain/subsystems';
import {
  SceneEventBusProviderPortDef,
  createDefaultSceneEventBusProvider,
} from '../../domain/ports';

/**
 * Port provider that registers the default SceneEventBusProvider if not already present.
 * Internal port: core provides it; consumer can override via params.ports.
 */
export const provideSceneEventBusProvider: SubsystemPortProvider = ({ ports }) => {
  if (!ports.has(SceneEventBusProviderPortDef)) {
    ports.register(SceneEventBusProviderPortDef, createDefaultSceneEventBusProvider());
  }
};
