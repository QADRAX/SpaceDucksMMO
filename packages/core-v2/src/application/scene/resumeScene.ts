import { defineSceneUseCase } from '../../domain/useCases';

/** Resumes a paused scene. */
export const resumeScene = defineSceneUseCase({
  name: 'resumeScene',
  execute(scene) {
    scene.paused = false;
  },
});
