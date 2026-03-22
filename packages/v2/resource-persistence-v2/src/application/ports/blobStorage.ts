import type { Readable } from 'stream';

/**
 * Stored blob metadata (relative `storagePath` is implementation-defined).
 */
export type SavedBlob = {
  fileName: string;
  size: number;
  sha256: string;
  contentType: string;
  storagePath: string;
};

/**
 * Agnostic blob storage (local FS, S3, Azure, etc.).
 */
export interface BlobStorage {
  /** Write bytes and return metadata including a stable relative storage key. */
  put(
    buffer: Buffer,
    fileName: string,
    opts?: { fileId?: string; contentType?: string }
  ): Promise<SavedBlob>;

  exists(storagePath: string): Promise<boolean>;

  openReadStream(storagePath: string): Readable;

  delete(storagePath: string): Promise<void>;

  getContentTypeFromExtension(fileName: string): string;
}
