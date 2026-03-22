import type { ResourceVersionWithFiles, ResourceWithVersionHistory } from '../engineResource';

/**
 * Serializable JSON view of a version row (bindings use `fileAsset` for stable API field names).
 */
export function wireResourceVersionWithFiles(v: ResourceVersionWithFiles) {
  return {
    id: v.id,
    resourceId: v.resourceId,
    version: v.version,
    componentType: v.componentType,
    componentData: v.componentData,
    bindings: v.bindings.map((b) => ({
      slot: b.slot,
      fileAsset: {
        id: b.file.id,
        fileName: b.file.fileName,
        contentType: b.file.contentType,
        size: b.file.size,
        sha256: b.file.sha256,
        storagePath: b.file.storagePath,
      },
    })),
  };
}

/**
 * Serializable JSON view of a resource with nested versions.
 */
export function wireResourceWithVersionHistory(r: ResourceWithVersionHistory) {
  return {
    id: r.id,
    key: r.key,
    displayName: r.displayName,
    kind: r.kind,
    activeVersion: r.activeVersion,
    thumbnailFileAssetId: r.thumbnailFileAssetId,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    versions: r.versions.map(wireResourceVersionWithFiles),
  };
}
