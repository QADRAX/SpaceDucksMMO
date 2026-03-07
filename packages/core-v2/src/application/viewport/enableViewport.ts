import { defineViewportUseCase } from './viewportUseCase';

/** Enables the viewport so it will be rendered. */
export const enableViewport = defineViewportUseCase<void, void>({
  name: 'enableViewport',
  execute(viewport) {
    viewport.enabled = true;
  },
});
