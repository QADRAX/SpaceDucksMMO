import { defineEngineUseCase } from './engineUseCase';

/** Resumes the engine after a pause. */
export const resumeEngine = defineEngineUseCase({
  name: 'resumeEngine',
  execute(engine) {
    engine.paused = false;
  },
});
