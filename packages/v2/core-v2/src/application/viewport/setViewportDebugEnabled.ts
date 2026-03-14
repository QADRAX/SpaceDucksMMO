import type { DebugKind } from '../../domain/entities';
import { defineViewportUseCase } from '../../domain/useCases';

/** Parameters for the setViewportDebugEnabled use case. */
export interface SetViewportDebugEnabledParams {
  readonly kind: DebugKind;
  readonly enabled: boolean;
}

/** Sets a debug visualization flag for this viewport (e.g. collider, mesh). */
export const setViewportDebugEnabled = defineViewportUseCase<
  SetViewportDebugEnabledParams,
  void
>({
  name: 'setViewportDebugEnabled',
  execute(viewport, { kind, enabled }) {
    viewport.debugFlags.set(kind, enabled);
  },
});
