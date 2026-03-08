import { guardCameraInScene } from '../../domain/engine/engineGuards';
import { defineViewportUseCase } from '../../domain/useCases';
import type { EntityId } from '../../domain/ids';

/** Parameters for setViewportCamera. */
export interface SetViewportCameraParams {
  readonly cameraEntityId: EntityId;
}

/** Changes which camera entity this viewport uses for rendering. */
export const setViewportCamera = defineViewportUseCase<SetViewportCameraParams, void>({
  name: 'setViewportCamera',
  guards: [guardCameraInScene],
  execute(viewport, { cameraEntityId }) {
    viewport.cameraEntityId = cameraEntityId;
  },
});
