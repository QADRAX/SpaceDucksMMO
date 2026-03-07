import type { TextureSpec } from '../../domain/entities/TextureSpec';
import { CoreLogger, type LoadingTracker } from '@duckengine/core';

/**
 * Cache for managing loaded textures.
 *
 * Handles texture lifecycle: loading, caching, and disposal.
 */
export class TextureCache {
  private readonly cache = new Map<string, unknown>();
  private readonly pendingLoads = new Map<string, Promise<unknown>>();
  private loadingTracker?: LoadingTracker;
  private isInitialLoading = false;

  /**
   * Set the loading tracker for progress reporting
   */
  setLoadingTracker(tracker?: LoadingTracker): void {
    this.loadingTracker = tracker;
  }

  /**
   * Set initial loading state
   */
  setIsInitialLoading(loading: boolean): void {
    this.isInitialLoading = loading;
  }

  /**
   * Get cached texture
   */
  get(id: string): unknown | undefined {
    return this.cache.get(id);
  }

  /**
   * Set cached texture
   */
  set(id: string, texture: unknown): void {
    this.cache.set(id, texture);
  }

  /**
   * Check if texture is cached
   */
  has(id: string): boolean {
    return this.cache.has(id);
  }

  /**
   * Get or load texture
   */
  async getOrLoad(
    spec: TextureSpec,
    loader: () => Promise<unknown>
  ): Promise<unknown> {
    if (this.cache.has(spec.id)) {
      return this.cache.get(spec.id);
    }

    // Check if already loading
    if (this.pendingLoads.has(spec.id)) {
      return this.pendingLoads.get(spec.id)!;
    }

    // Create new load promise
    const loadPromise = loader()
      .then((texture) => {
        this.cache.set(spec.id, texture);
        this.pendingLoads.delete(spec.id);
        return texture;
      })
      .catch((err) => {
        this.pendingLoads.delete(spec.id);
        CoreLogger.error('TextureCache', `Failed to load texture ${spec.id}:`, err);
        throw err;
      });

    this.pendingLoads.set(spec.id, loadPromise);

    if (this.isInitialLoading && this.loadingTracker) {
      this.loadingTracker.startTask(spec.id);
    }

    return loadPromise;
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    this.pendingLoads.clear();
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    this.cache.clear();
    this.pendingLoads.clear();
  }
}
