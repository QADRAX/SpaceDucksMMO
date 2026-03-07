import { defineViewportUseCase } from './viewportUseCase';

/** Disables the viewport so it will not be rendered. */
export const disableViewport = defineViewportUseCase<void, void>({
  name: 'disableViewport',
  execute(viewport) {
    viewport.enabled = false;
  },
});
