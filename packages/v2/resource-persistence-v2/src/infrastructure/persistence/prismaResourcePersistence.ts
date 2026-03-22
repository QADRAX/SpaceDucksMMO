import type { Prisma, PrismaClient } from '../../generated/prisma';

import type {
  PatchResourceInput,
  ResourcePersistencePort,
  ResourcePersistenceTransaction,
} from '../../application/ports/resourcePersistence';
import type {
  CommitFileBlobParams,
  CommitResourceBindingParams,
  CommitResourceParams,
  CommitResourceVersionParams,
  ResourceCatalogListItem,
  ResourceCatalogRow,
  ResourceKeySummary,
  ResourceVersionRow,
  ResourceVersionWithFiles,
  ResourceWithVersionHistory,
  StoredFileBlob,
} from '../../domain/engineResource';
import {
  mapResourceCatalogListItem,
  mapResourceCatalogRow,
  mapResourceKeySummary,
  mapResourceVersionRow,
  mapResourceWithVersionHistory,
  mapStoredFileBlob,
  mapVersionWithFiles,
} from './prismaMappers';

type Tx = Prisma.TransactionClient;

function createTransactionAdapter(tx: Tx): ResourcePersistenceTransaction {
  return {
    async createResource(input: CommitResourceParams): Promise<ResourceCatalogRow> {
      const r = await tx.resource.create({
        data: {
          key: input.key,
          displayName: input.displayName,
          kind: input.kind,
          activeVersion: input.activeVersion,
        },
      });
      return mapResourceCatalogRow(r);
    },

    async createResourceVersion(input: CommitResourceVersionParams): Promise<ResourceVersionRow> {
      const v = await tx.resourceVersion.create({
        data: {
          resourceId: input.resourceId,
          version: input.version,
          componentType: input.componentType,
          componentData: input.componentData,
        },
      });
      return mapResourceVersionRow(v);
    },

    async createFileAsset(input: CommitFileBlobParams): Promise<StoredFileBlob> {
      const f = await tx.fileAsset.create({
        data: {
          id: input.id,
          fileName: input.fileName,
          contentType: input.contentType,
          size: input.size,
          sha256: input.sha256,
          storagePath: input.storagePath,
        },
      });
      return mapStoredFileBlob(f);
    },

    async createResourceBinding(input: CommitResourceBindingParams): Promise<void> {
      await tx.resourceBinding.create({
        data: {
          resourceVersionId: input.resourceVersionId,
          slot: input.slot,
          fileAssetId: input.fileAssetId,
        },
      });
    },

    async updateResourceVersion(versionId: string, data: { componentData: string }): Promise<ResourceVersionRow> {
      const v = await tx.resourceVersion.update({
        where: { id: versionId },
        data: { componentData: data.componentData },
      });
      return mapResourceVersionRow(v);
    },

    async updateResource(resourceId: string, data: { activeVersion?: number }): Promise<void> {
      await tx.resource.update({
        where: { id: resourceId },
        data: { ...(data.activeVersion !== undefined ? { activeVersion: data.activeVersion } : {}) },
      });
    },

    async findLastResourceVersionNumber(resourceId: string): Promise<number | null> {
      const last = await tx.resourceVersion.findFirst({
        where: { resourceId },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      return last?.version ?? null;
    },

    async findResourceVersionBare(
      resourceId: string,
      version: number
    ): Promise<ResourceVersionRow | null> {
      const v = await tx.resourceVersion.findUnique({
        where: { resourceId_version: { resourceId, version } },
      });
      return v ? mapResourceVersionRow(v) : null;
    },

    async upsertResourceBinding(
      resourceVersionId: string,
      slot: string,
      fileAssetId: string
    ): Promise<void> {
      await tx.resourceBinding.upsert({
        where: { resourceVersionId_slot: { resourceVersionId, slot } },
        create: { resourceVersionId, slot, fileAssetId },
        update: { fileAssetId },
      });
    },

    async findResourceBinding(
      resourceVersionId: string,
      slot: string
    ): Promise<{ fileAssetId: string } | null> {
      const b = await tx.resourceBinding.findUnique({
        where: { resourceVersionId_slot: { resourceVersionId, slot } },
        select: { fileAssetId: true },
      });
      return b;
    },

    async findOrphanFileAssets(fileIds: string[]): Promise<StoredFileBlob[]> {
      if (fileIds.length === 0) return [];
      const orphans = await tx.fileAsset.findMany({
        where: {
          id: { in: fileIds },
          bindings: { none: {} },
          thumbnailForResources: { none: {} },
        },
        select: {
          id: true,
          fileName: true,
          contentType: true,
          size: true,
          sha256: true,
          storagePath: true,
        },
      });
      return orphans.map(mapStoredFileBlob);
    },

    async deleteFileAsset(id: string): Promise<void> {
      await tx.fileAsset.delete({ where: { id } });
    },

    async deleteResourceVersionById(versionId: string): Promise<void> {
      await tx.resourceVersion.delete({ where: { id: versionId } });
    },

    async findFileAssetsForVersion(versionId: string): Promise<StoredFileBlob[]> {
      const candidates = await tx.fileAsset.findMany({
        where: {
          bindings: {
            some: { resourceVersionId: versionId },
          },
        },
        select: {
          id: true,
          fileName: true,
          contentType: true,
          size: true,
          sha256: true,
          storagePath: true,
        },
      });
      return candidates.map(mapStoredFileBlob);
    },
  };
}

export function createPrismaResourcePersistence(prisma: PrismaClient): ResourcePersistencePort {
  const port: ResourcePersistencePort = {
    transaction<T>(fn: (tx: ResourcePersistenceTransaction) => Promise<T>): Promise<T> {
      return prisma.$transaction(async (tx) => fn(createTransactionAdapter(tx)));
    },

    async findResourceSummaryByKey(key: string): Promise<ResourceKeySummary | null> {
      const r = await prisma.resource.findFirst({
        where: { key },
        select: { id: true, key: true, activeVersion: true },
      });
      return r ? mapResourceKeySummary(r) : null;
    },

    async findResourceVersionWithBindings(
      resourceId: string,
      version: number
    ): Promise<ResourceVersionWithFiles | null> {
      const v = await prisma.resourceVersion.findUnique({
        where: { resourceId_version: { resourceId, version } },
        include: { bindings: { include: { fileAsset: true } } },
      });
      return v ? mapVersionWithFiles(v) : null;
    },

    async findLatestResourceVersion(resourceId: string): Promise<ResourceVersionWithFiles | null> {
      const v = await prisma.resourceVersion.findFirst({
        where: { resourceId },
        orderBy: { version: 'desc' },
        include: { bindings: { include: { fileAsset: true } } },
      });
      return v ? mapVersionWithFiles(v) : null;
    },

    async findFileAssetById(id: string): Promise<StoredFileBlob | null> {
      const f = await prisma.fileAsset.findUnique({
        where: { id },
        select: {
          id: true,
          fileName: true,
          contentType: true,
          size: true,
          sha256: true,
          storagePath: true,
        },
      });
      return f ? mapStoredFileBlob(f) : null;
    },

    async listResourcesForCatalog(filter: { kind?: string }): Promise<ResourceCatalogListItem[]> {
      const data = await prisma.resource.findMany({
        where: {
          ...(filter.kind ? { kind: filter.kind } : {}),
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: { select: { versions: true } },
        },
      });
      return data.map(mapResourceCatalogListItem);
    },

    async findResourceByIdWithVersions(id: string): Promise<ResourceWithVersionHistory | null> {
      const r = await prisma.resource.findFirst({
        where: { id },
        include: {
          versions: {
            orderBy: { version: 'desc' },
            include: { bindings: { include: { fileAsset: true } } },
          },
        },
      });
      return r ? mapResourceWithVersionHistory(r) : null;
    },

    async findResourceVersionId(
      resourceId: string,
      version: number
    ): Promise<{ id: string } | null> {
      return prisma.resourceVersion.findUnique({
        where: { resourceId_version: { resourceId, version } },
        select: { id: true },
      });
    },

    async updateResource(resourceId: string, data: PatchResourceInput): Promise<ResourceCatalogRow> {
      const updated = await prisma.resource.update({
        where: { id: resourceId },
        data: {
          ...(data.displayName !== undefined ? { displayName: data.displayName } : {}),
          ...(data.key !== undefined ? { key: data.key } : {}),
          ...(data.activeVersion !== undefined ? { activeVersion: data.activeVersion } : {}),
        },
      });
      return mapResourceCatalogRow(updated);
    },

    async findResourceThumbnailId(resourceId: string): Promise<string | null> {
      const r = await prisma.resource.findUnique({
        where: { id: resourceId },
        select: { thumbnailFileAssetId: true },
      });
      return r?.thumbnailFileAssetId ?? null;
    },

    async findFileAssetsBoundToResource(resourceId: string): Promise<StoredFileBlob[]> {
      const candidates = await prisma.fileAsset.findMany({
        where: {
          bindings: {
            some: {
              resourceVersion: {
                resourceId,
              },
            },
          },
        },
        select: {
          id: true,
          fileName: true,
          contentType: true,
          size: true,
          sha256: true,
          storagePath: true,
        },
      });
      return candidates.map(mapStoredFileBlob);
    },

    async deleteResource(resourceId: string): Promise<ResourceCatalogRow> {
      const d = await prisma.resource.delete({ where: { id: resourceId } });
      return mapResourceCatalogRow(d);
    },

    async findOrphanFileAssets(fileIds: string[]): Promise<StoredFileBlob[]> {
      if (fileIds.length === 0) return [];
      const orphans = await prisma.fileAsset.findMany({
        where: {
          id: { in: fileIds },
          bindings: { none: {} },
          thumbnailForResources: { none: {} },
        },
        select: {
          id: true,
          fileName: true,
          contentType: true,
          size: true,
          sha256: true,
          storagePath: true,
        },
      });
      return orphans.map(mapStoredFileBlob);
    },

    async deleteFileAsset(id: string): Promise<void> {
      await prisma.fileAsset.delete({ where: { id } });
    },

    async findResourceSummaryById(resourceId: string): Promise<ResourceKeySummary | null> {
      const r = await prisma.resource.findUnique({
        where: { id: resourceId },
        select: { id: true, key: true, activeVersion: true },
      });
      return r ? mapResourceKeySummary(r) : null;
    },

    async updateResourceActiveVersion(resourceId: string, version: number): Promise<void> {
      await prisma.resource.update({
        where: { id: resourceId },
        data: { activeVersion: version },
      });
    },

    async findResourceById(resourceId: string): Promise<ResourceCatalogRow | null> {
      const r = await prisma.resource.findUnique({ where: { id: resourceId } });
      return r ? mapResourceCatalogRow(r) : null;
    },

    async findLastResourceVersionNumber(resourceId: string): Promise<number | null> {
      const last = await prisma.resourceVersion.findFirst({
        where: { resourceId },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      return last?.version ?? null;
    },

    async findResourceVersionBare(
      resourceId: string,
      version: number
    ): Promise<ResourceVersionRow | null> {
      const v = await prisma.resourceVersion.findUnique({
        where: { resourceId_version: { resourceId, version } },
      });
      return v ? mapResourceVersionRow(v) : null;
    },

    async findResourceSelectKind(
      resourceId: string
    ): Promise<{ id: string; kind: string } | null> {
      return prisma.resource.findUnique({
        where: { id: resourceId },
        select: { id: true, kind: true },
      });
    },

    async countResourceVersions(resourceId: string): Promise<number> {
      return prisma.resourceVersion.count({ where: { resourceId } });
    },
  };

  return port;
}
