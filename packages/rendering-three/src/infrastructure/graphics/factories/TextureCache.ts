import * as THREE from 'three';

export class TextureCache {
  private cache = new Map<string, THREE.Texture>();
  private loader = new THREE.TextureLoader();
  private pendingLoads = new Map<string, Promise<THREE.Texture>>();

  load(url: string): Promise<THREE.Texture> {
    const cached = this.cache.get(url);
    if (cached) return Promise.resolve(cached);

    const pending = this.pendingLoads.get(url);
    if (pending) return pending;

    const promise = new Promise<THREE.Texture>((resolve, reject) => {
      this.loader.load(
        url,
        (texture) => {
          this.cache.set(url, texture);
          this.pendingLoads.delete(url);
          resolve(texture);
        },
        undefined,
        (error) => {
          this.pendingLoads.delete(url);
          reject(error);
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
}
