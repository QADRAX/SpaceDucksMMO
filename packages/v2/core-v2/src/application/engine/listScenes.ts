import type { SceneView } from '../../domain/scene';
import { createSceneView } from '../../domain/scene';
import { defineEngineUseCase } from '../../domain/useCases';

/**
 * Returns a list of all registered scene snapshots.
 */
export const listScenes = defineEngineUseCase<void, SceneView[]>({
    name: 'listScenes',
    execute(engine) {
        return [...engine.scenes.values()].map((scene) => createSceneView(scene));
    },
});
