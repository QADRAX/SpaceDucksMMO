/**
 * Internal ports — core implements by default.
 * Consumer can override via params.ports.
 */
export { SceneEventBusProviderPortDef } from './sceneEventBusProviderPortDef';
export type { SceneEventBusProviderPort } from './sceneEventBusProviderPort';
export { createDefaultSceneEventBusProvider } from './defaults/sceneEventBusProvider';

export { UISlotOperationsPortDef } from './uiSlotOperationsPortDef';
export type {
  UISlotOperationsPort,
  AddUISlotParams,
  UpdateUISlotParams,
} from './uiSlotOperationsPort';
