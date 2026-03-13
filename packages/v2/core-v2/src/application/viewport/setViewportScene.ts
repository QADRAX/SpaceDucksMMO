import { guardSceneExists } from '../../domain/engine/engineGuards';
import { defineViewportUseCase } from '../../domain/useCases';
import type { SceneId } from '../../domain/ids';

/** Parameters for setViewportScene. */
export interface SetViewportSceneParams {
  readonly sceneId: SceneId;
}

/** Changes which scene this viewport renders. */
export const setViewportScene = defineViewportUseCase<SetViewportSceneParams, void>({
  name: 'setViewportScene',
  guards: [guardSceneExists],
  execute(viewport, { sceneId }) {
    viewport.sceneId = sceneId;
  },
});
