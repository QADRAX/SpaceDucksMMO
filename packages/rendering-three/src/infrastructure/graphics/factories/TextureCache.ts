import * as THREE from 'three';

export class TextureCache {
  private cache = new Map<string, THREE.Texture>();
  private loader = new THREE.ImageBitmapLoader();
  private pendingLoads = new Map<string, Promise<THREE.Texture>>();
  private loadingTracker: any | null = null;
  private isInitialLoading = false;

  constructor() {
    this.loader.setOptions({ imageOrientation: 'flipY' });
  }

  load(url: string): Promise<THREE.Texture> {
    const cached = this.cache.get(url);
    if (cached) return Promise.resolve(cached);

    const pending = this.pendingLoads.get(url);
    if (pending) return pending;

    const useTracker = this.isInitialLoading && this.loadingTracker;
    const taskName = `texture:${url}`;
    if (useTracker) this.loadingTracker.startTask(taskName);

    const promise = new Promise<THREE.Texture>((resolve, reject) => {
      this.loader.load(
        url,
        (bitmap) => {
          const texture = new THREE.Texture(bitmap);
          texture.flipY = false; // Bitmap is already flipped by loader option
          texture.needsUpdate = true;
          this.cache.set(url, texture);
          this.pendingLoads.delete(url);
          resolve(texture);
          if (useTracker) this.loadingTracker.endTask(taskName);
        },
        undefined,
        (error) => {
          this.pendingLoads.delete(url);
          // Fallback or reject? Rejecting is cleaner for now.
          console.warn(`[TextureCache] Failed to load texture: ${url}`, error);
          reject(error);
          if (useTracker) this.loadingTracker.endTask(taskName);
        }
      );
    });

    this.pendingLoads.set(url, promise);
    return promise;
  }

  get(url: string): THREE.Texture | undefined {
    return this.cache.get(url);
  }

  clear(): void {
    for (const tex of this.cache.values()) tex.dispose();
    this.cache.clear();
    this.pendingLoads.clear();
  }

  setLoadingTracker(tracker: any): void {
    this.loadingTracker = tracker;
  }

  setIsInitialLoading(loading: boolean): void {
    this.isInitialLoading = loading;
  }
}
