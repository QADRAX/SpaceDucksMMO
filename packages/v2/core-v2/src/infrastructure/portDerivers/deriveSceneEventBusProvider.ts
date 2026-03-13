import type { SubsystemPortDeriver } from '../../domain/subsystems';
import {
  SceneEventBusProviderPortDef,
  createDefaultSceneEventBusProvider,
} from '../../domain/ports';

/**
 * Port deriver that registers the default SceneEventBusProvider if not already present.
 * Internal port: core provides it; consumer can override via params.ports.
 */
export const deriveSceneEventBusProvider: SubsystemPortDeriver = ({ ports }) => {
  if (!ports.has(SceneEventBusProviderPortDef)) {
    ports.register(SceneEventBusProviderPortDef, createDefaultSceneEventBusProvider());
  }
};
