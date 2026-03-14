import type { SubsystemPortProvider } from '../../domain/subsystems';
import { UISlotOperationsPortDef } from '../../domain/ports';
import { createDefaultUISlotOperationsPort } from './defaults/uiSlotOperations';

/**
 * Port provider that registers the default UISlotOperationsPort if not already present.
 * Internal port: core provides it; consumer can override via params.ports.
 */
export const provideUISlotOperations: SubsystemPortProvider = ({ engine, ports }) => {
  if (!ports.has(UISlotOperationsPortDef)) {
    ports.register(UISlotOperationsPortDef, createDefaultUISlotOperationsPort(engine));
  }
};
