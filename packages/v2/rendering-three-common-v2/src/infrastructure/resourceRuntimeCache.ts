import * as THREE from 'three';
import type { ResourceLoaderPort, ResourceCachePort } from '@duckengine/core-v2';
import type {
  ResourceRef,
  MeshGeometryFileData,
  ResolvedResource,
} from '@duckengine/core-v2';

function cacheKey(ref: ResourceRef<any>): string {
  return `${ref.key}@${ref.version ?? 'active'}`;
}

/**
 * Creates a ResourceCachePort implementation that uses ResourceLoaderPort
 * to resolve and fetch resources, then caches parsed/runtime objects for sync lookup.
 */
export function createResourceRuntimeCache(
  resourceLoader: ResourceLoaderPort,
): ResourceCachePort {
  const meshCache = new Map<string, MeshGeometryFileData>();
  const textureCache = new Map<string, THREE.Texture>();
  const skyboxCache = new Map<string, THREE.CubeTexture>();
  const scriptCache = new Map<string, string>();
  const scriptInFlight = new Map<string, Promise<void>>();

  const textureLoader = new THREE.TextureLoader();
  const cubeTextureLoader = new THREE.CubeTextureLoader();

  async function preloadMesh(ref: ResourceRef<'mesh'>): Promise<void> {
    const key = cacheKey(ref);
    if (meshCache.has(key)) return;

    const result = await resourceLoader.resolve(ref);
    if (result.ok === false) return;

    const resolved = result.value as ResolvedResource<'mesh'>;
    const geometryFile = resolved.files.geometry;
    if (!geometryFile?.url) return;

    const fetchResult = await resourceLoader.fetchFile(geometryFile.url, 'text');
    if (fetchResult.ok === false) return;

    const data = JSON.parse(fetchResult.value as string) as MeshGeometryFileData;
    meshCache.set(key, data);
  }

  async function preloadTexture(ref: ResourceRef<'texture'>): Promise<void> {
    const key = cacheKey(ref);
    if (textureCache.has(key)) return;

    const result = await resourceLoader.resolve(ref);
    if (result.ok === false) return;

    const resolved = result.value as ResolvedResource<'texture'>;
    const imageFile = resolved.files.image;
    if (!imageFile?.url) return;

    const fetchResult = await resourceLoader.fetchFile(imageFile.url, 'blob');
    if (fetchResult.ok === false) return;

    const blob = fetchResult.value as Blob;
    const url = URL.createObjectURL(blob);
    try {
      const texture = await new Promise<THREE.Texture>((resolve, reject) => {
        textureLoader.load(
          url,
          (t) => resolve(t),
          undefined,
          (e) => reject(e),
        );
      });
      textureCache.set(key, texture);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function preloadSkybox(ref: ResourceRef<'skybox'>): Promise<void> {
    const key = cacheKey(ref);
    if (skyboxCache.has(key)) return;

    const result = await resourceLoader.resolve(ref);
    if (result.ok === false) return;

    const resolved = result.value as ResolvedResource<'skybox'>;
    const { px, nx, py, ny, pz } = resolved.files;
    if (!px?.url || !nx?.url || !py?.url || !ny?.url || !pz?.url) return;

    // CubeTextureLoader requires 6 faces [px, nx, py, ny, pz, nz]. API provides 5 (no bottom);
    // use py as fallback for nz when not provided.
    const urls = [px.url, nx.url, py.url, ny.url, pz.url, py.url];
    const cubeTexture = cubeTextureLoader.load(urls);
    skyboxCache.set(key, cubeTexture);
  }

  async function preloadScript(ref: ResourceRef<'script'>): Promise<void> {
    const key = cacheKey(ref);
    if (scriptCache.has(key)) return;

    const existing = scriptInFlight.get(key);
    if (existing) {
      await existing;
      return;
    }

    const load = (async () => {
      const result = await resourceLoader.resolve(ref);
      if (result.ok === false) return;

      const resolved = result.value as ResolvedResource<'script'>;
      const sourceFile = resolved.files.source;
      if (!sourceFile?.url) return;

      const fetchResult = await resourceLoader.fetchFile(sourceFile.url, 'text');
      if (fetchResult.ok === false) return;

      scriptCache.set(key, fetchResult.value as string);
    })();
    scriptInFlight.set(key, load);
    await load;
    scriptInFlight.delete(key);
  }

  return {
    getMeshData(ref: ResourceRef<'mesh'>): MeshGeometryFileData | null {
      return meshCache.get(cacheKey(ref)) ?? null;
    },

    getTexture(ref: ResourceRef<'texture'>): THREE.Texture | null {
      return textureCache.get(cacheKey(ref)) ?? null;
    },

    getSkyboxTexture(ref: ResourceRef<'skybox'>): THREE.CubeTexture | null {
      return skyboxCache.get(cacheKey(ref)) ?? null;
    },

    getScriptSource(ref: ResourceRef<'script'>): string | null {
      return scriptCache.get(cacheKey(ref)) ?? null;
    },

    preloadMesh,
    preloadTexture,
    preloadSkybox,
    preloadScript,
  };
}
