import { defineEngineUseCase } from './engineUseCase';

/** Pauses the engine. Scene and engine adapters with `updateWhenPaused` still tick. */
export const pauseEngine = defineEngineUseCase({
  name: 'pauseEngine',
  execute(engine) {
    engine.paused = true;
  },
});
