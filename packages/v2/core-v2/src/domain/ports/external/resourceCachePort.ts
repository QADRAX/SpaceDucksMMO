import type { ResourceRef, MeshGeometryFileData } from '../../resources';

/**
 * Sync cache for resolved resources, populated by async preload.
 * Converts ResourceLoaderPort (async) into sync lookups for rendering and physics.
 *
 * Core defines getMeshData only (no Three.js coupling). Rendering implementation
 * adds getTexture and getSkyboxTexture (return unknown; impl returns THREE types).
 */
export interface ResourceCachePort {
  /** Sync lookup for mesh geometry. Returns null if not yet loaded. */
  getMeshData(ref: ResourceRef<'mesh'>): MeshGeometryFileData | null;

  /** Sync lookup for texture. Returns null if not yet loaded. (Rendering impl returns THREE.Texture) */
  getTexture?(ref: ResourceRef<'texture'>): unknown | null;

  /** Sync lookup for skybox. Returns null if not yet loaded. (Rendering impl returns THREE.CubeTexture) */
  getSkyboxTexture?(ref: ResourceRef<'skybox'>): unknown | null;

  /** Preload mesh resource into cache. */
  preloadMesh(ref: ResourceRef<'mesh'>): Promise<void>;

  /** Preload texture resource into cache. */
  preloadTexture(ref: ResourceRef<'texture'>): Promise<void>;

  /** Preload skybox resource into cache. */
  preloadSkybox(ref: ResourceRef<'skybox'>): Promise<void>;

  /** Preload script resource into cache (Lua source). */
  preloadScript(ref: ResourceRef<'script'>): Promise<void>;

  /** Sync lookup for script source. Returns null if not yet loaded. */
  getScriptSource(ref: ResourceRef<'script'>): string | null;
}
