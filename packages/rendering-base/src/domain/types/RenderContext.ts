import type { ITextureResolver, TextureCatalogService, LoadingTracker } from '@duckengine/core';

/**
 * Context provided to RenderFeatures during their lifecycle.
 *
 * Encapsulates the global state required for rendering synchronization and feature operation.
 * Framework-agnostic: types are kept abstract to avoid circular dependencies.
 *
 * Note: registry, textureCache, and engineResourceResolver are NOT imported as types here
 * to avoid circular imports. They should be instantiated in the application coordinator
 * and passed as `unknown` if their concrete types are not needed in features.
 */
export interface RenderContext {
  /**
   * The underlying scene object (THREE.Scene, WebGL context, etc).
   */
  readonly scene: unknown;

  /**
   * Registry maintaining the mapping between entity IDs and render objects.
   * Type: RenderObjectRegistry (but kept as unknown to avoid circular imports)
   */
  readonly registry: unknown;

  /**
   * Texture cache for managing loaded textures.
   * Type: TextureCache (but kept as unknown to avoid circular imports)
   */
  readonly textureCache: unknown;

  /**
   * Texture resolver for resolving texture references.
   */
  readonly textureResolver?: ITextureResolver;

  /**
   * Texture catalog service.
   */
  readonly textureCatalog?: TextureCatalogService;

  /**
   * Engine resource resolver for asset loading.
   * Type: EngineResourceResolver (but kept as unknown to avoid circular imports)
   */
  readonly engineResourceResolver?: unknown;

  /**
   * All entities currently being rendered.
   */
  readonly entities: Map<string, any>;

  /**
   * Debug visualization flags.
   */
  readonly debugFlags: Record<string, boolean>;

  /**
   * Currently active camera entity ID (if any).
   */
  activeCameraEntityId: string | null;

  /**
   * Whether the scene is in initial loading phase.
   */
  isInitialLoading: boolean;

  /**
   * Loading tracker for asset loading progress.
   */
  readonly loadingTracker?: LoadingTracker;
}
