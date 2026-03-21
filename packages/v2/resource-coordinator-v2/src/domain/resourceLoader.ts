import type {
  Result,
  ResourceKind,
  ResourceRef,
  ResolvedResource,
  MeshGeometryFileData,
  AnimationClipFileData,
} from '@duckengine/core-v2';

/**
 * Contract for runtime resource resolution.
 * Injected by consumer when creating the coordinator.
 * Implementations resolve from web-core, local files, bundled assets, etc.
 */
export interface ResourceLoader {
  /**
   * Resolve a resource by its reference.
   *
   * @param ref The resource reference (key + kind + optional version).
   * @returns A Result containing the resolved resource or an engine error.
   */
  resolve<K extends ResourceKind>(ref: ResourceRef<K>): Promise<Result<ResolvedResource<K>>>;

  /**
   * Fetch a raw file from a URL, with internal caching.
   *
   * @param url The download URL.
   * @param format The requested format ('text' for strings, 'blob' for binary).
   * @returns A Result containing the content or an engine error.
   */
  fetchFile<F extends 'text' | 'blob'>(
    url: string,
    format: F,
  ): Promise<Result<F extends 'text' ? string : Blob>>;

  /**
   * Optional: fetch and decode texture as ImageBitmap (off main thread when using workers).
   * When present, coordinator uses this for textures instead of fetchFile(..., 'blob').
   */
  fetchTextureDecoded?(url: string): Promise<Result<ImageBitmap>>;

  /**
   * Optional: decode mesh geometry from binary bytes (engine-specific layout).
   * When absent or returning null, coordinator falls back to UTF-8 JSON parse as {@link MeshGeometryFileData}.
   */
  decodeMeshGeometryBytes?(bytes: Uint8Array | ArrayBuffer): MeshGeometryFileData | null;

  /**
   * Optional: decode animation clip from binary bytes.
   * When absent or returning null, coordinator falls back to UTF-8 JSON parse as {@link AnimationClipFileData}.
   */
  decodeAnimationClipBytes?(bytes: Uint8Array | ArrayBuffer): AnimationClipFileData | null;
}
