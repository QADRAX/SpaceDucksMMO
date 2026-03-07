// Public entrypoint for @duckengine/rendering-three

// Re-export core + ecs so consumers only need this package.
export * from '@duckengine/core';
export * from '@duckengine/core';

// Make commonly-used texture types explicit for downstream type re-exports.
export type {
	TextureQuality,
	TextureVariant,
	TextureCatalog,
	TextureCatalogService,
} from '@duckengine/core';

export { default } from './infrastructure/rendering/ThreeRenderer';
export { ThreeRenderer } from './infrastructure/rendering/ThreeRenderer';

export { ThreeMultiRenderer } from './infrastructure/rendering/ThreeMultiRenderer';
export { default as ThreeMultiRendererDefault } from './infrastructure/rendering/ThreeMultiRenderer';
export type { ViewId, ViewOptions, ViewDebugOptions } from './infrastructure/rendering/ThreeMultiRenderer';

// Re-export core multi-view port types so consumers can type against the engine interface.
export type { RenderViewId, RenderViewOptions, RenderViewDebugOptions } from '@duckengine/core';

export type { IFpsController } from './infrastructure/ui/dev/FpsController';
export { NoopFpsController } from './infrastructure/ui/dev/FpsController';

export type {
	EngineResourceResolver,
	EngineResolvedResource,
	EngineResolvedFile,
	EngineResourceVersionSelector,
} from './infrastructure/resources/EngineResourceResolver';

export { createWebCoreResourceLoader } from './infrastructure/resources/EngineResourceResolver';
