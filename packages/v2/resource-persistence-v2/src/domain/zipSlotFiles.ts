import * as path from 'path';

export type ZipBasenameMapEntry = { name: string; data: Buffer };

export function stripExt(fileName: string): string {
  return path.posix.basename(fileName, path.posix.extname(fileName));
}

export function toZipBasename(fileName: string): string {
  const normalized = fileName.replace(/\\/g, '/');
  return path.posix.basename(normalized);
}

export type SlotFileFromZip = {
  slot: string;
  fileName: string;
  data: Buffer;
};

/**
 * Build slot files from a zip basename map and optional manifest `files[]` bindings.
 */
export function collectSlotFilesFromZip(
  files: Map<string, ZipBasenameMapEntry>,
  bindings?: Array<{ slot: string; file: string }>
): SlotFileFromZip[] {
  if (bindings && bindings.length) {
    const slotFiles: SlotFileFromZip[] = [];
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

  const slotFiles: SlotFileFromZip[] = [];
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
