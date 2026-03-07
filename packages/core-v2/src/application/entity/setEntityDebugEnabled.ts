import type { DebugKind } from '../../domain/entities';
import { setDebugEnabled } from '../../domain/entities';
import { defineEntityUseCase } from '../../domain/useCases';

/** Parameters for the setEntityDebugEnabled use case. */
export interface SetEntityDebugEnabledParams {
    readonly kind: DebugKind;
    readonly enabled: boolean;
}

/** Sets a debug visualisation flag on the entity. */
export const setEntityDebugEnabled = defineEntityUseCase<SetEntityDebugEnabledParams, void>({
    name: 'setEntityDebugEnabled',
    execute(entity, { kind, enabled }) {
        setDebugEnabled(entity, kind, enabled);
    },
});
