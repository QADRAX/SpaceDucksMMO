// Public entrypoint for @duckengine/rendering-three

// Re-export core + ecs so consumers only need this package.
export * from '@duckengine/core';
export * from '@duckengine/ecs';

// Make commonly-used texture types explicit for downstream type re-exports.
export type {
	TextureQuality,
	TextureVariant,
	TextureCatalog,
	TextureCatalogService,
} from '@duckengine/core';

export { default } from './infrastructure/rendering/ThreeRenderer';
export { ThreeRenderer } from './infrastructure/rendering/ThreeRenderer';

export type { IFpsController } from './infrastructure/ui/dev/FpsController';
export { NoopFpsController } from './infrastructure/ui/dev/FpsController';
