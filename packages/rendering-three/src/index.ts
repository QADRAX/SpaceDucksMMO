// Public entrypoint for @duckengine/rendering-three

export { default } from './infrastructure/rendering/ThreeRenderer';
export { ThreeRenderer } from './infrastructure/rendering/ThreeRenderer';

export type { IFpsController } from './infrastructure/ui/dev/FpsController';
export { NoopFpsController } from './infrastructure/ui/dev/FpsController';
