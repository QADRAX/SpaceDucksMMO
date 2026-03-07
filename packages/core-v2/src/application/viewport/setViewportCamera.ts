import { guardCameraInScene } from '../../domain/engine/engineGuards';
import { defineViewportUseCase } from '../../domain/useCases';

/** Parameters for setViewportCamera. */
export interface SetViewportCameraParams {
  readonly cameraEntityId: string;
}

/** Changes which camera entity this viewport uses for rendering. */
export const setViewportCamera = defineViewportUseCase<SetViewportCameraParams, void>({
  name: 'setViewportCamera',
  guards: [guardCameraInScene],
  execute(viewport, { cameraEntityId }) {
    viewport.cameraEntityId = cameraEntityId;
  },
});
