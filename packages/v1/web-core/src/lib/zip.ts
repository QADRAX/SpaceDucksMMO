import * as path from 'path';

import AdmZip from 'adm-zip';

export type ZipFileEntry = {
  name: string;
  data: Buffer;
};

function toBasename(entryName: string): string {
  const normalized = entryName.replace(/\\/g, '/');
  const base = path.posix.basename(normalized);
  return base;
}

export async function readZipBasenameMap(zipFile: File): Promise<Map<string, ZipFileEntry>> {
  const arrayBuffer = await zipFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();

  const map = new Map<string, ZipFileEntry>();

  for (const entry of entries) {
    if (entry.isDirectory) continue;

    const base = toBasename(entry.entryName);
    if (!base) continue;

    // Reject suspicious names (we never write to disk, but keep strict anyway)
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

export function parseZipJson<T = unknown>(entry: ZipFileEntry, label: string): T {
  try {
    return JSON.parse(entry.data.toString('utf-8')) as T;
  } catch {
    throw new Error(`${label} must be valid JSON`);
  }
}
