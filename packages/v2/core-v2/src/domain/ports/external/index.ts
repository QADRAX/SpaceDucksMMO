/**
 * External ports — client implements.
 * Inject via params.ports or customPorts at setup.
 */
export { PhysicsQueryPortDef } from './physicsQueryPortDef';
export type { PhysicsQueryPort } from './physicsQueryPort';

export { GizmoPortDef } from './gizmoPortDef';
export type { GizmoPort } from './gizmoPort';

export type { InputPort, InputMouseDelta, InputMouseButtons } from './inputPort';

export { ResourceLoaderPortDef } from './resourceLoaderPortDef';
export type { ResourceLoaderPort } from './resourceLoaderPort';

export { DiagnosticPortDef } from './diagnosticPortDef';
export type { DiagnosticPort, DiagnosticLevel, DiagnosticContext } from './diagnosticPort';

export { UIRendererPortDef } from './uiRendererPortDef';
export type { UIRendererPort } from './uiRendererPort';

export { ViewportOverlayProviderPortDef } from './viewportOverlayProviderPortDef';
export type { ViewportOverlayProviderPort } from './viewportOverlayProviderPort';
