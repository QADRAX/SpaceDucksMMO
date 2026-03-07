import { guardSceneExists } from '../../domain/engine/engineGuards';
import { defineViewportUseCase } from './viewportUseCase';

/** Parameters for setViewportScene. */
export interface SetViewportSceneParams {
  readonly sceneId: string;
}

/** Changes which scene this viewport renders. */
export const setViewportScene = defineViewportUseCase<SetViewportSceneParams, void>({
  name: 'setViewportScene',
  guards: [guardSceneExists],
  execute(viewport, { sceneId }) {
    viewport.sceneId = sceneId;
  },
});
