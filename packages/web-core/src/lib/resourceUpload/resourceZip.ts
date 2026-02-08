import * as crypto from 'crypto';
import * as path from 'path';

import type { PrismaClient } from '@prisma/client';

import { StorageService } from '@/lib/storage';
import {
  MaterialComponentSchema,
  MaterialComponentTypeSchema,
  ResourceKindSchema,
  ResourceZipManifestSchema,
  ResourceVersionZipManifestSchema,
} from '@/lib/types';
import { parseZipJson, readZipBasenameMap } from '@/lib/zip';

function stripExt(fileName: string): string {
  return path.posix.basename(fileName, path.posix.extname(fileName));
}

function toZipBasename(fileName: string): string {
  const normalized = fileName.replace(/\\/g, '/');
  return path.posix.basename(normalized);
}

function coerceComponentData(raw: unknown): Record<string, unknown> {
  if (raw === undefined || raw === null) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  throw new Error('componentData must be an object (or omitted)');
}

function validateComponentDataForKind(kind: string, rawComponentData: unknown) {
  // Currently only material kinds are supported.
  const materialKind = MaterialComponentTypeSchema.safeParse(kind);
  if (!materialKind.success) {
    throw new Error(`Unsupported resource kind: ${kind}`);
  }

  const componentDataObj = coerceComponentData(rawComponentData);
  const parsed = MaterialComponentSchema.safeParse({
    componentType: materialKind.data,
    componentData: componentDataObj,
  });
  if (!parsed.success) {
    throw new Error('Invalid componentData for resource kind');
  }

  return {
    componentType: parsed.data.componentType,
    componentData: parsed.data.componentData ?? {},
  };
}

type SlotFile = { slot: string; fileName: string; data: Buffer };

function collectSlotFilesFromZip(
  files: Map<string, { name: string; data: Buffer }>,
  bindings?: Array<{ slot: string; file: string }>
): SlotFile[] {
  if (bindings && bindings.length) {
    const slotFiles: SlotFile[] = [];
    const seenSlots = new Set<string>();

    for (const b of bindings) {
      const slot = String(b.slot || '').trim();
      const fileBase = toZipBasename(String(b.file || ''));

      if (!slot) throw new Error('Invalid manifest: files[].slot must be a non-empty string');
      if (!fileBase) throw new Error('Invalid manifest: files[].file must be a non-empty string');

      if (seenSlots.has(slot)) {
        throw new Error(`Duplicate slot in manifest: ${slot}`);
      }
      seenSlots.add(slot);

      const entry = files.get(fileBase);
      if (!entry) {
        throw new Error(`Missing file in zip referenced by manifest: ${fileBase}`);
      }
      if (entry.name === 'resource.json' || entry.name === 'version.json') {
        throw new Error(`Invalid manifest file reference: ${fileBase}`);
      }

      slotFiles.push({ slot, fileName: entry.name, data: entry.data });
    }

    return slotFiles;
  }

  // Legacy behavior: infer slot name from filename (basename without extension).
  const slotFiles: SlotFile[] = [];
  const seenSlots = new Set<string>();

  for (const entry of files.values()) {
    if (entry.name === 'resource.json' || entry.name === 'version.json') continue;

    const slotName = stripExt(entry.name);
    if (!slotName) continue;

    if (seenSlots.has(slotName)) {
      throw new Error(`Duplicate file for slot: ${slotName}`);
    }
    seenSlots.add(slotName);

    slotFiles.push({ slot: slotName, fileName: entry.name, data: entry.data });
  }

  return slotFiles;
}

export async function createResourceFromZip(prisma: PrismaClient, zipFile: File) {
  const files = await readZipBasenameMap(zipFile);
  const manifestEntry = files.get('resource.json');
  if (!manifestEntry) {
    throw new Error('Missing resource.json in zip');
  }

  const manifestRaw = parseZipJson(manifestEntry, 'resource.json');
  const parsed = ResourceZipManifestSchema.safeParse(manifestRaw);
  if (!parsed.success) {
    throw new Error('Invalid resource.json manifest');
  }

  const kind = ResourceKindSchema.parse(parsed.data.kind);
  const versionPayload = parsed.data.version;

  // Creating a resource always creates its first version as version 1 and default.
  // If the manifest explicitly sets a different version number, reject it to avoid confusion.
  if (versionPayload.version !== undefined && versionPayload.version !== 1) {
    throw new Error('Initial resource version must be 1');
  }

  // Optional legacy componentType field must match kind.
  if (versionPayload.componentType && versionPayload.componentType !== kind) {
    throw new Error('componentType must match resource kind');
  }

  const component = validateComponentDataForKind(kind, versionPayload.componentData);

  const componentDataToStore: Record<string, unknown> = {
    ...(component.componentData ?? {}),
  };

  const slotFiles = collectSlotFilesFromZip(files, versionPayload.files);

  const created = await prisma.$transaction(async (tx) => {
    const resource = await tx.resource.create({
      data: {
        key: parsed.data.key,
        displayName: parsed.data.displayName,
        kind,
        activeVersion: 1,
      },
    });

    const version = await tx.resourceVersion.create({
      data: {
        resourceId: resource.id,
        version: 1,
        componentType: component.componentType,
        componentData: JSON.stringify(componentDataToStore),
      },
    });

    for (const slot of slotFiles) {
      const fileId = crypto.randomUUID();
      const contentType = StorageService.getContentTypeFromExtension(slot.fileName);

      const saved = await StorageService.saveFile(slot.data, slot.fileName, {
        fileId,
        contentType,
      });

      const fileAsset = await tx.fileAsset.create({
        data: {
          id: fileId,
          fileName: saved.fileName,
          contentType: saved.contentType,
          size: saved.size,
          sha256: saved.sha256,
          storagePath: saved.storagePath,
        },
      });

      await tx.resourceBinding.create({
        data: {
          resourceVersionId: version.id,
          slot: slot.slot,
          fileAssetId: fileAsset.id,
        },
      });

      const supportedTextureFields = new Set([
        'texture',
        'normalMap',
        'envMap',
        'aoMap',
        'roughnessMap',
        'metalnessMap',
        'specularMap',
        'bumpMap',
        'baseColor',
        'albedo',
      ]);

      if (supportedTextureFields.has(slot.slot)) {
        const url = `/api/files/${fileId}`;
        if (slot.slot === 'baseColor' || slot.slot === 'albedo') {
          componentDataToStore.texture = url;
        } else {
          componentDataToStore[slot.slot] = url;
        }
      }
    }

    await tx.resourceVersion.update({
      where: { id: version.id },
      data: { componentData: JSON.stringify(componentDataToStore) },
    });

    return { resource, version };
  });

  return created;
}

export async function createResourceVersionFromZip(
  prisma: PrismaClient,
  resourceId: string,
  resourceKind: string,
  zipFile: File
) {
  const files = await readZipBasenameMap(zipFile);

  const manifestEntry = files.get('version.json') ?? files.get('resource.json');
  if (!manifestEntry) {
    throw new Error('Missing version.json in zip');
  }

  const manifestRaw = parseZipJson(manifestEntry, 'version.json');
  const parsed = ResourceVersionZipManifestSchema.safeParse(
    (typeof manifestRaw === 'object' && manifestRaw && 'version' in (manifestRaw as any))
      ? (manifestRaw as any).version
      : manifestRaw
  );

  if (!parsed.success) {
    throw new Error('Invalid version.json manifest');
  }

  // Optional legacy componentType field must match kind.
  if (parsed.data.componentType && parsed.data.componentType !== resourceKind) {
    throw new Error('componentType must match resource kind');
  }

  const component = validateComponentDataForKind(resourceKind, parsed.data.componentData);

  const componentDataToStore: Record<string, unknown> = {
    ...(component.componentData ?? {}),
  };

  const slotFiles = collectSlotFilesFromZip(files, parsed.data.files);

  const created = await prisma.$transaction(async (tx) => {
    const nextVersion = await (async () => {
      const last = await tx.resourceVersion.findFirst({
        where: { resourceId },
        orderBy: { version: 'desc' },
        select: { version: true },
      });

      const expected = (last?.version || 0) + 1;

      if (parsed.data.version !== undefined) {
        if (parsed.data.version !== expected) {
          throw new Error(`version must be next incremental value (${expected})`);
        }
        return parsed.data.version;
      }

      return expected;
    })();

    const existing = await tx.resourceVersion.findUnique({
      where: { resourceId_version: { resourceId, version: nextVersion } },
    });
    if (existing) {
      throw new Error(`Version ${nextVersion} already exists`);
    }

    const version = await tx.resourceVersion.create({
      data: {
        resourceId,
        version: nextVersion,
        componentType: component.componentType,
        componentData: JSON.stringify(componentDataToStore),
      },
    });

    await tx.resource.update({
      where: { id: resourceId },
      data: { activeVersion: nextVersion },
    });

    for (const slot of slotFiles) {
      const fileId = crypto.randomUUID();
      const contentType = StorageService.getContentTypeFromExtension(slot.fileName);

      const saved = await StorageService.saveFile(slot.data, slot.fileName, {
        fileId,
        contentType,
      });

      const fileAsset = await tx.fileAsset.create({
        data: {
          id: fileId,
          fileName: saved.fileName,
          contentType: saved.contentType,
          size: saved.size,
          sha256: saved.sha256,
          storagePath: saved.storagePath,
        },
      });

      await tx.resourceBinding.create({
        data: {
          resourceVersionId: version.id,
          slot: slot.slot,
          fileAssetId: fileAsset.id,
        },
      });

      const supportedTextureFields = new Set([
        'texture',
        'normalMap',
        'envMap',
        'aoMap',
        'roughnessMap',
        'metalnessMap',
        'specularMap',
        'bumpMap',
        'baseColor',
        'albedo',
      ]);

      if (supportedTextureFields.has(slot.slot)) {
        const url = `/api/files/${fileId}`;
        if (slot.slot === 'baseColor' || slot.slot === 'albedo') {
          componentDataToStore.texture = url;
        } else {
          componentDataToStore[slot.slot] = url;
        }
      }
    }

    await tx.resourceVersion.update({
      where: { id: version.id },
      data: { componentData: JSON.stringify(componentDataToStore) },
    });

    return version;
  });

  return created;
}
