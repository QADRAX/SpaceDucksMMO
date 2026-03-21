/**
 * External ports — client implements.
 * Inject via params.ports or customPorts at setup.
 */
export { PhysicsQueryPortDef, PHYSICS_QUERY_PORT_ID } from './physicsQueryPortDef';
export type { PhysicsQueryPort } from './physicsQueryPort';

export { GizmoPortDef, GIZMO_PORT_ID } from './gizmoPortDef';
export type { GizmoPort } from './gizmoPort';

export { GizmoPortProviderDef, GIZMO_PORT_PROVIDER_ID } from './gizmoPortProviderDef';
export type { GizmoPortProvider } from './gizmoPortProvider';

export { InputPortDef, INPUT_PORT_ID } from './inputPortDef';
export {
  INPUT_ACTION_NAMES,
  INPUT_ACTION_NAMES_LIST,
  isInputActionName,
} from './inputActionNames';
export type { InputActionName } from './inputActionNames';
export type {
  InputPort,
  InputMouseDelta,
  InputMouseButtons,
  InputMousePosition,
  InputWheelDelta,
  InputGamepadState,
  InputGamepadButton,
  InputGamepadAxis,
} from './inputPort';

export { ResourceCachePortDef } from './resourceCachePortDef';
export type { ResourceCachePort } from './resourceCachePort';

export { DiagnosticPortDef } from './diagnosticPortDef';
export type { DiagnosticPort, DiagnosticLevel, DiagnosticContext } from './diagnosticPort';

export { UIRendererPortDef } from './uiRendererPortDef';
export type { UIRendererPort } from './uiRendererPort';

export { ViewportOverlayProviderPortDef } from './viewportOverlayProviderPortDef';
export type { ViewportOverlayProviderPort } from './viewportOverlayProviderPort';

export { ViewportRectProviderPortDef } from './viewportRectProviderPortDef';
export type { ViewportRectProviderPort } from './viewportRectProviderPort';

export { PerformanceProfilingPortDef } from './performanceProfilingPortDef';
export type {
  PerformanceProfilingPort,
  SubsystemPhaseSlice,
  SubsystemProfilingScope,
} from './performanceProfilingPort';
