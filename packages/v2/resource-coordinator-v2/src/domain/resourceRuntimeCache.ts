import type { ResourceCachePort } from '@duckengine/core-v2';
import type { ResourceRef, MeshGeometryFileData } from '@duckengine/core-v2';

function cacheKey(ref: ResourceRef<any>): string {
  return `${ref.key}@${ref.version ?? 'active'}`;
}

/**
 * Creates a ResourceCachePort: stores raw data only (JSON, Blob, string[], string).
 * No THREE.js. Rendering subsystem adapts Blob/string[] to THREE.Texture/CubeTexture.
 */
export function createResourceRuntimeCache(): ResourceCachePort {
  const meshCache = new Map<string, MeshGeometryFileData>();
  const textureCache = new Map<string, Blob | ImageBitmap>();
  const skyboxCache = new Map<string, string[]>();
  const scriptCache = new Map<string, string>();

  return {
    getMeshData(ref: ResourceRef<'mesh'>): MeshGeometryFileData | null {
      return meshCache.get(cacheKey(ref)) ?? null;
    },

    getTexture(ref: ResourceRef<'texture'>): Blob | ImageBitmap | null {
      return textureCache.get(cacheKey(ref)) ?? null;
    },

    getSkyboxTexture(ref: ResourceRef<'skybox'>): string[] | null {
      return skyboxCache.get(cacheKey(ref)) ?? null;
    },

    getScriptSource(ref: ResourceRef<'script'>): string | null {
      return scriptCache.get(cacheKey(ref)) ?? null;
    },

    storeMeshData(ref: ResourceRef<'mesh'>, data: MeshGeometryFileData): void {
      meshCache.set(cacheKey(ref), data);
    },

    async storeTextureFromBlob(ref: ResourceRef<'texture'>, blob: Blob): Promise<void> {
      textureCache.set(cacheKey(ref), blob);
    },

    storeTextureFromImageBitmap(ref: ResourceRef<'texture'>, bitmap: ImageBitmap): void {
      textureCache.set(cacheKey(ref), bitmap);
    },

    async storeSkyboxFromUrls(ref: ResourceRef<'skybox'>, urls: string[]): Promise<void> {
      skyboxCache.set(cacheKey(ref), urls);
    },

    storeScriptSource(ref: ResourceRef<'script'>, source: string): void {
      scriptCache.set(cacheKey(ref), source);
    },
  };
}
