import { definePort } from '../../subsystems/definePort';
import type { UISlotOperationsPort } from './uiSlotOperationsPort';

/** Port definition for UISlotOperationsPort. Used by scripting-lua sceneBridge. */
export const UISlotOperationsPortDef = definePort<UISlotOperationsPort>('uiSlotOperations')
  .addMethod('addUISlot')
  .addMethod('removeUISlot')
  .addMethod('updateUISlot')
  .build();
