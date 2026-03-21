import type {
  ResourceRef,
  MeshGeometryFileData,
  SkeletonData,
  AnimationClipFileData,
} from '../../resources';

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

  /** Sync lookup for skeleton joint order (data-only resource). */
  getSkeletonData?(ref: ResourceRef<'skeleton'>): SkeletonData | null;

  /** Sync lookup for decoded animation clip samples. */
  getAnimationClipData?(ref: ResourceRef<'animationClip'>): AnimationClipFileData | null;

  /** Sync lookup for texture. Returns Blob | ImageBitmap | null. Rendering adapts to THREE.Texture. */
  getTexture?(ref: ResourceRef<'texture'>): Blob | ImageBitmap | null;

  /** Sync lookup for skybox. Returns string[] | null (6 face URLs). Rendering adapts to THREE.CubeTexture. */
  getSkyboxTexture?(ref: ResourceRef<'skybox'>): string[] | null;

  /** Sync lookup for script source. Returns null if not yet loaded. */
  getScriptSource(ref: ResourceRef<'script'>): string | null;

  /** Coordinator-only: store mesh data. Called after loader.resolve + fetch (JSON or binary decode). */
  storeMeshData?(ref: ResourceRef<'mesh'>, data: MeshGeometryFileData): void;

  /** Coordinator-only: cache skeleton scalar data from resolve (no clip file). */
  storeSkeletonData?(ref: ResourceRef<'skeleton'>, data: SkeletonData): void;

  /** Coordinator-only: store decoded animation clip file payload. */
  storeAnimationClipData?(ref: ResourceRef<'animationClip'>, data: AnimationClipFileData): void;

  /** Coordinator-only: store texture blob (raw image data). Rendering parses to THREE.Texture. */
  storeTextureFromBlob?(ref: ResourceRef<'texture'>, blob: Blob): Promise<void>;

  /** Coordinator-only: store decoded ImageBitmap (browser, when loader provides fetchTextureDecoded). */
  storeTextureFromImageBitmap?(ref: ResourceRef<'texture'>, bitmap: ImageBitmap): void;

  /** Coordinator-only: store skybox URLs (6 face URLs). Rendering parses to THREE.CubeTexture. */
  storeSkyboxFromUrls?(ref: ResourceRef<'skybox'>, urls: string[]): Promise<void>;

  /** Coordinator-only: store script source. */
  storeScriptSource?(ref: ResourceRef<'script'>, source: string): void;
}
