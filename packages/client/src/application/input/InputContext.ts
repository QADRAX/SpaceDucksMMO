// Client facade for the DuckEngine ECS input context.
// ECS components (e.g. MouseLookComponent) read input via @duckengine/ecs InputContext,
// so the client must wire its concrete Mouse/Keyboard services into that global context.

export type {
  InputServices,
  MouseApi,
  KeyboardApi,
  MouseState,
} from '@duckengine/rendering-three/ecs';

export { setInputServices, getInputServices } from '@duckengine/rendering-three/ecs';
