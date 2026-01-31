// Minimal source entrypoint for @duckengine/core (build is deferred).

export type { default as IScene } from './domain/ports/IScene';
export type { default as IRenderingEngine } from './domain/ports/IRenderingEngine';
export type { default as IRenderSyncSystem } from './domain/ports/IRenderSyncSystem';
export type { ITextureResolver } from './domain/ports/ITextureResolver';
export type { default as ISettingsService } from './domain/ports/ISettingsService';

export { default as BaseScene } from './infrastructure/scenes/BaseScene';

export type { default as SceneChangeEvent } from './domain/scene/SceneChangeEvent';

export type {
	TextureCatalogService,
	TextureCatalog,
	TextureVariant,
} from './domain/assets/TextureCatalog';
export type * from './domain/assets/TextureTypes';
export type { GameSettings } from './domain/settings/GameSettings';

export { default as TextureResolverService } from './application/TextureResolverService';
