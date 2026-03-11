/**
 * Domain ports — contracts for engine I/O and capabilities.
 *
 * Structure:
 * - internal/  — Core implements by default (SceneEventBusProvider, UISlotOperations)
 * - external/  — Client implements (Physics, Gizmo, Input, Resource, Diagnostic, UI)
 * - enginePorts.ts — Aggregates all ports for setup injection
 */
export * from './internal';
export * from './external';
export type { EnginePorts } from './enginePorts';
export type { SceneEventBus } from '../events';
