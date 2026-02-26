// Minimal source entrypoint for @duckengine/core (build is deferred).

export * from './domain/ports/IScene';
export * from './domain/ports/IRenderingEngine';
export * from './domain/ports/IRenderSyncSystem';
export type { ITextureResolver } from './domain/ports/ITextureResolver';
export type { default as ISettingsService } from './domain/ports/ISettingsService';
export type { IGizmoRenderer } from './domain/ports/IGizmoRenderer';

export type { default as IPhysicsSystem } from './domain/physics/IPhysicsSystem';
export type * from './domain/physics/PhysicsTypes';
export { default as CollisionEventsHub } from './domain/physics/CollisionEventsHub';

export { default as BaseScene } from './infrastructure/scenes/BaseScene';

export type { default as SceneChangeEvent } from './domain/scene/SceneChangeEvent';
export type {
	SceneChangeEvent as SceneChangeEventBase,
	SceneChangeErrorEvent,
	SceneChangeEventWithError,
} from './domain/scene/SceneChangeEvent';

export type {
	TextureCatalogService,
	TextureCatalog,
	TextureVariant,
} from './domain/assets/TextureCatalog';
export type * from './domain/assets/TextureTypes';
export type { GameSettings } from './domain/settings/GameSettings';

export { default as TextureResolverService } from './application/TextureResolverService';
export { default as LoadingTracker } from './domain/runtime/LoadingTracker';
export { default as WebCoreTextureCatalogService } from './infrastructure/assets/WebCoreTextureCatalogService';

// ── Editor Plugin contracts ─────────────────────────────────────────────────
export type {
	EditorPluginConfigValue,
	EditorPluginConfigField,
	EditorPluginCategory,
	EditorPluginSource,
	EditorPluginMeta,
	EditorPluginContext,
	IEditorPlugin,
	IEditorPluginRegistry,
	IEditorPluginLoader,
} from './domain/editor/IEditorPlugin';

export { EditorScripts } from './domain/scripting/generated/ScriptAssets';
export { LuaSandbox } from './domain/scripting/LuaSandbox';

// ── Logging ───────────────────────────────────────────────────────────────
export { CoreLogger, type LogMessage, type LogListener, type LogSeverity } from './domain/logging/CoreLogger';

// ── ECS (Merged from @duckengine/core) ───────────────────────────────────────
export * from './domain/ecs';
export { EngineError } from './domain/errors/EngineError';
