/**
 * @duckengine/ui-v2
 * Default Duck UI kit + scene subsystem that projects ECS UI roots onto host surfaces.
 */
export { createUISubsystem } from './infrastructure/composition/createUISubsystem';
export type { UISubsystemState } from './domain/uiSubsystem/types';
export { createUISubsystemState } from './domain/uiSubsystem/createUISubsystemState';
export { createRecordingUIViewRuntime } from './infrastructure/adapters/recordingUIViewRuntime';
export { createRecordingUISpaRuntime } from './infrastructure/adapters/recordingUISpaRuntime';
export { createMemoryUISurfaceHost } from './infrastructure/adapters/memoryUISurfaceHost';
