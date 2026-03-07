// Minimal source entrypoint for @duckengine/core (build is deferred).

export * from './domain/ports/IScene';
export * from './domain/ports/IRenderingEngine';
export * from './domain/ports/IRenderSyncSystem';
export * from './domain/ports/IRendererRuntimeSceneAdapter';
export type { IResourceLoader } from './domain/ports/IResourceLoader';
export type { default as ISettingsService } from './domain/ports/ISettingsService';
export type { IGizmoRenderer } from './domain/ports/IGizmoRenderer';

export type { default as IPhysicsSystem } from './domain/physics/IPhysicsSystem';
export type * from './domain/physics/PhysicsTypes';
export type * from './domain/physics/PhysicsPerformanceProfile';
export * from './domain/physics/PhysicsProfiles';
export { default as CollisionEventsHub } from './domain/physics/CollisionEventsHub';

export { default as BaseScene } from './infrastructure/scenes/BaseScene';

export type { default as SceneChangeEvent } from './domain/scene/SceneChangeEvent';
export type {
	SceneChangeEvent as SceneChangeEventBase,
	SceneChangeErrorEvent,
	SceneChangeEventWithError,
} from './domain/scene/SceneChangeEvent';

export type {
	ResolvedResource,
	ResolvedFile,
	ResourceVersionSelector,
} from './domain/assets/ResourceTypes';
export type * from './domain/assets/TextureTypes';
export type { GameSettings } from './domain/settings/GameSettings';

export { default as LoadingTracker } from './domain/runtime/LoadingTracker';
export {
	WebCoreResourceLoader,
	createWebCoreResourceLoader,
} from './infrastructure/assets/WebCoreResourceLoader';
export type { WebCoreResourceLoaderOptions } from './infrastructure/assets/WebCoreResourceLoader';

// ── Editor Plugin contracts ─────────────────────────────────────────────────
// Moved to @duckengine/editor-core

export { EditorScripts } from './domain/scripting/generated/ScriptAssets';

// ── Logging ───────────────────────────────────────────────────────────────
export { CoreLogger, type LogMessage, type LogListener, type LogSeverity } from './domain/logging/CoreLogger';

// ── ECS (Merged from @duckengine/core) ───────────────────────────────────────
export * from './domain/ecs';
export { EngineError } from './domain/errors/EngineError';
