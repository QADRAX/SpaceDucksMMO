/**
 * External ports — client implements.
 * Inject via params.ports or customPorts at setup.
 */
export { PhysicsQueryPortDef, PHYSICS_QUERY_PORT_ID } from './physicsQueryPortDef';
export type { PhysicsQueryPort } from './physicsQueryPort';

export { GizmoPortDef } from './gizmoPortDef';
export type { GizmoPort } from './gizmoPort';

export type { InputPort, InputMouseDelta, InputMouseButtons } from './inputPort';

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
