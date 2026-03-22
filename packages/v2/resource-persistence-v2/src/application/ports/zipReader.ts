export type ZipFileEntry = {
  name: string;
  data: Buffer;
};

/**
 * Reads a ZIP buffer into a map keyed by entry basename (web-core / editor convention).
 */
export interface ZipReader {
  readBasenameMap(buffer: Buffer): Map<string, ZipFileEntry>;
}

export function parseZipJson<T = unknown>(entry: ZipFileEntry, label: string): T {
  try {
    return JSON.parse(entry.data.toString('utf-8')) as T;
  } catch {
    throw new Error(`${label} must be valid JSON`);
  }
}
