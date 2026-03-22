import * as crypto from 'crypto';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import * as path from 'path';
import type { Readable } from 'stream';

import type { BlobStorage, SavedBlob } from '../../application/ports/blobStorage';

const defaultRoot =
  process.env.RESOURCE_PERSISTENCE_STORAGE_PATH ||
  process.env.WEB_CORE_STORAGE_PATH ||
  process.env.ASSET_STORAGE_PATH ||
  '/data/web-core';

/**
 * Filesystem-backed {@link BlobStorage} (same layout as legacy web-core `StorageService`).
 */
export class LocalBlobStorage implements BlobStorage {
  private readonly storageRootPath: string;

  private readonly filesDir: string;

  constructor(storageRootPath: string = defaultRoot) {
    this.storageRootPath = storageRootPath;
    this.filesDir = path.join(this.storageRootPath, 'files');
  }

  async put(
    buffer: Buffer,
    fileName: string,
    opts?: { fileId?: string; contentType?: string }
  ): Promise<SavedBlob> {
    const fileId = opts?.fileId || crypto.randomUUID();
    const targetDir = path.join(this.filesDir, fileId);
    const safeName = path.basename(fileName);
    const targetPath = path.join(targetDir, safeName);
    const storagePath = path.relative(this.storageRootPath, targetPath).split(path.sep).join('/');

    await fsPromises.mkdir(targetDir, { recursive: true });
    await fsPromises.writeFile(targetPath, buffer);

    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const contentType = opts?.contentType || 'application/octet-stream';

    return {
      fileName: safeName,
      size: buffer.length,
      sha256,
      contentType,
      storagePath,
    };
  }

  getAbsolutePath(storagePath: string): string {
    const normalized = storagePath.replace(/\\/g, '/');
    return path.join(this.storageRootPath, normalized);
  }

  async exists(storagePath: string): Promise<boolean> {
    try {
      await fsPromises.access(this.getAbsolutePath(storagePath));
      return true;
    } catch {
      return false;
    }
  }

  openReadStream(storagePath: string): Readable {
    return fs.createReadStream(this.getAbsolutePath(storagePath));
  }

  async delete(storagePath: string): Promise<void> {
    try {
      const filePath = this.getAbsolutePath(storagePath);
      await fsPromises.rm(filePath, { force: true });
      try {
        const dirPath = path.dirname(filePath);
        await fsPromises.rmdir(dirPath);
      } catch {
        // ignore
      }
    } catch {
      // ignore
    }
  }

  getContentTypeFromExtension(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.txt': 'text/plain',
      '.glsl': 'text/plain',
      '.wgsl': 'text/plain',
      '.tsl': 'text/plain',
      '.js': 'application/javascript',
      '.ts': 'application/typescript',
    };
    return contentTypes[ext] || 'application/octet-stream';
  }
}
