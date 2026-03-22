import * as path from 'path';

import AdmZip from 'adm-zip';

import type { ZipFileEntry, ZipReader } from '../../application/ports/zipReader';

function toBasename(entryName: string): string {
  const normalized = entryName.replace(/\\/g, '/');
  return path.posix.basename(normalized);
}

export class AdmZipReader implements ZipReader {
  readBasenameMap(buffer: Buffer): Map<string, ZipFileEntry> {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    const map = new Map<string, ZipFileEntry>();

    for (const entry of entries) {
      if (entry.isDirectory) continue;

      const base = toBasename(entry.entryName);
      if (!base) continue;
      if (base.includes('..') || base.includes('/') || base.includes('\\')) {
        continue;
      }
      if (map.has(base)) {
        throw new Error(`Duplicate filename in zip: ${base}`);
      }

      map.set(base, {
        name: base,
        data: entry.getData(),
      });
    }

    return map;
  }
}
