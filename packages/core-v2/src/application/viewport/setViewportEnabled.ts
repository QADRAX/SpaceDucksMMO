import { defineViewportUseCase } from '../../domain/useCases';

/** Parameters for the setViewportEnabled use case. */
export interface SetViewportEnabledParams {
    readonly enabled: boolean;
}

/** Sets whether the viewport is rendered. */
export const setViewportEnabled = defineViewportUseCase<SetViewportEnabledParams, void>({
    name: 'setViewportEnabled',
    execute(viewport, { enabled }) {
        viewport.enabled = enabled;
    },
});
