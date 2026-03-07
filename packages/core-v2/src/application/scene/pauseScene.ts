import { defineSceneUseCase } from './sceneUseCase';

/** Pauses a scene. Only adapters with `updateWhenPaused` will tick. */
export const pauseScene = defineSceneUseCase({
  name: 'pauseScene',
  execute(scene) {
    scene.paused = true;
  },
});
