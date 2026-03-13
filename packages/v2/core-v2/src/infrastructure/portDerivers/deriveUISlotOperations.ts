import type { SubsystemPortDeriver } from '../../domain/subsystems';
import { UISlotOperationsPortDef } from '../../domain/ports';
import { createDefaultUISlotOperationsPort } from './defaults/uiSlotOperations';

/**
 * Port deriver that registers the default UISlotOperationsPort if not already present.
 * Internal port: core provides it; consumer can override via params.ports.
 */
export const deriveUISlotOperations: SubsystemPortDeriver = ({ engine, ports }) => {
  if (!ports.has(UISlotOperationsPortDef)) {
    ports.register(UISlotOperationsPortDef, createDefaultUISlotOperationsPort(engine));
  }
};
