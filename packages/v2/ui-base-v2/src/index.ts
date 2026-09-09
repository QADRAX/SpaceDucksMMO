/**
 * @duckengine/ui-base-v2
 * Host-agnostic UI projection: ECS roots → UI ports.
 */
export { createUISubsystem } from './infrastructure/composition/createUISubsystem';
export type { UISubsystemState, UIMountKey } from './domain/uiSubsystem/types';
export { uiMountKey } from './domain/uiSubsystem/types';
export {
  createUISubsystemState,
  type CreateUISubsystemStateOptions,
} from './domain/uiSubsystem/createUISubsystemState';
export { layoutFromTransform2d, isActiveUiContentRoot } from './domain/uiSubsystem/layoutFromTransform2d';
export { reconcileUiRoots, type ReconcileUiRootsParams } from './application/reconcileUiRoots';
export { unmountAllUiRoots } from './application/unmountAllUiRoots';
export { createMemoryUISurfaceHost } from './infrastructure/adapters/memoryUISurfaceHost';
export {
  createRecordingUIViewRuntime,
  type RecordingUIViewCall,
} from './infrastructure/adapters/recordingUIViewRuntime';
export {
  createRecordingUISpaRuntime,
  type RecordingUISpaCall,
} from './infrastructure/adapters/recordingUISpaRuntime';
