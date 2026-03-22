import type {
  ResourceCatalogListItem,
  ResourceCatalogRow,
  ResourceKeySummary,
  ResourceSlotBinding,
  ResourceVersionRow,
  ResourceVersionWithFiles,
  ResourceWithVersionHistory,
  StoredFileBlob,
} from '../../domain/engineResource';

export function mapStoredFileBlob(f: {
  id: string;
  fileName: string;
  contentType: string;
  size: number;
  sha256: string;
  storagePath: string;
}): StoredFileBlob {
  return {
    id: f.id,
    fileName: f.fileName,
    contentType: f.contentType,
    size: f.size,
    sha256: f.sha256,
    storagePath: f.storagePath,
  };
}

export function mapVersionWithFiles(
  v: {
    id: string;
    resourceId: string;
    version: number;
    componentType: string;
    componentData: string;
    bindings: Array<{ slot: string; fileAsset: Parameters<typeof mapStoredFileBlob>[0] }>;
  }
): ResourceVersionWithFiles {
  return {
    id: v.id,
    resourceId: v.resourceId,
    version: v.version,
    componentType: v.componentType,
    componentData: v.componentData,
    bindings: v.bindings.map(
      (b): ResourceSlotBinding => ({
        slot: b.slot,
        file: mapStoredFileBlob(b.fileAsset),
      })
    ),
  };
}

export function mapResourceCatalogRow(r: {
  id: string;
  key: string;
  displayName: string;
  kind: string;
  activeVersion: number;
}): ResourceCatalogRow {
  return {
    id: r.id,
    key: r.key,
    displayName: r.displayName,
    kind: r.kind,
    activeVersion: r.activeVersion,
  };
}

export function mapResourceKeySummary(r: {
  id: string;
  key: string;
  activeVersion: number;
}): ResourceKeySummary {
  return { id: r.id, key: r.key, activeVersion: r.activeVersion };
}

export function mapResourceVersionRow(v: {
  id: string;
  resourceId: string;
  version: number;
  componentType: string;
  componentData: string;
}): ResourceVersionRow {
  return {
    id: v.id,
    resourceId: v.resourceId,
    version: v.version,
    componentType: v.componentType,
    componentData: v.componentData,
  };
}

export function mapResourceCatalogListItem(
  r: {
    id: string;
    key: string;
    displayName: string;
    kind: string;
    activeVersion: number;
    createdAt: Date;
    updatedAt: Date;
    _count: { versions: number };
  }
): ResourceCatalogListItem {
  return {
    id: r.id,
    key: r.key,
    displayName: r.displayName,
    kind: r.kind,
    activeVersion: r.activeVersion,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    versionCount: r._count.versions,
  };
}

export function mapResourceWithVersionHistory(r: {
  id: string;
  key: string;
  displayName: string;
  kind: string;
  activeVersion: number;
  thumbnailFileAssetId: string | null;
  createdAt: Date;
  updatedAt: Date;
  versions: Array<Parameters<typeof mapVersionWithFiles>[0]>;
}): ResourceWithVersionHistory {
  return {
    id: r.id,
    key: r.key,
    displayName: r.displayName,
    kind: r.kind,
    activeVersion: r.activeVersion,
    thumbnailFileAssetId: r.thumbnailFileAssetId,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    versions: r.versions.map(mapVersionWithFiles),
  };
}
