import type { ResourceRef, MeshGeometryFileData } from '../../resources';

/**
 * Sync cache for resolved resources. Populated by ResourceCoordinator (the only
 * subsystem that calls the loader). Other subsystems read sync via get*.
 *
 * Coordinator stores raw data: getTexture returns Blob | null, getSkyboxTexture returns string[] | null.
 * Rendering subsystem adapts Blob/string[] to THREE.Texture/CubeTexture.
 */
export interface ResourceCachePort {
  /** Sync lookup for mesh geometry. Returns null if not yet loaded. */
  getMeshData(ref: ResourceRef<'mesh'>): MeshGeometryFileData | null;

  /** Sync lookup for texture. Returns Blob | null. Rendering adapts to THREE.Texture. */
  getTexture?(ref: ResourceRef<'texture'>): Blob | null;

  /** Sync lookup for skybox. Returns string[] | null (6 face URLs). Rendering adapts to THREE.CubeTexture. */
  getSkyboxTexture?(ref: ResourceRef<'skybox'>): string[] | null;

  /** Sync lookup for script source. Returns null if not yet loaded. */
  getScriptSource(ref: ResourceRef<'script'>): string | null;

  /** Coordinator-only: store mesh data. Called after loader.resolve + fetchFile. */
  storeMeshData?(ref: ResourceRef<'mesh'>, data: MeshGeometryFileData): void;

  /** Coordinator-only: store texture blob (raw image data). Rendering parses to THREE.Texture. */
  storeTextureFromBlob?(ref: ResourceRef<'texture'>, blob: Blob): Promise<void>;

  /** Coordinator-only: store skybox URLs (6 face URLs). Rendering parses to THREE.CubeTexture. */
  storeSkyboxFromUrls?(ref: ResourceRef<'skybox'>, urls: string[]): Promise<void>;

  /** Coordinator-only: store script source. */
  storeScriptSource?(ref: ResourceRef<'script'>, source: string): void;
}
