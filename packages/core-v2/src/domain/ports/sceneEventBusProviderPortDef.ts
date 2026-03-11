import { definePort } from '../subsystems/definePort';
import type { SceneEventBusProviderPort } from './sceneEventBusProviderPort';

/** Port definition for SceneEventBusProviderPort. */
export const SceneEventBusProviderPortDef = definePort<SceneEventBusProviderPort>(
  'sceneEventBusProvider',
)
  .addMethod('registerSceneBus')
  .addMethod('unregisterSceneBus')
  .addMethod('getEventBus')
  .build();
