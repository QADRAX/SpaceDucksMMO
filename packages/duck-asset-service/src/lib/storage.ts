import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { logger } from './logger';
import { Readable } from 'stream';

/**
 * Filesystem storage service for FileAsset blobs
 */

const STORAGE_ROOT_PATH =
  process.env.WEB_CORE_STORAGE_PATH ||
  process.env.ASSET_STORAGE_PATH ||
  '/data/web-core';

const STORAGE_FILES_PATH = path.join(STORAGE_ROOT_PATH, 'files');

export interface FileMetadata {
  fileName: string;
  size: number;
  sha256: string;
  contentType: string;
  storagePath: string;
  absolutePath: string;
}

export class StorageService {
  /**
   * Save a file to the storage directory
   */
  static async saveFile(
    file: File | Buffer,
    fileName: string,
    opts?: {
      fileId?: string;
      contentType?: string;
    }
  ): Promise<FileMetadata> {
    try {
      const fileId = opts?.fileId || crypto.randomUUID();
      const targetDir = path.join(STORAGE_FILES_PATH, fileId);
      const safeName = path.basename(fileName);
      const targetPath = path.join(targetDir, safeName);

      const storagePath = path.relative(STORAGE_ROOT_PATH, targetPath).split(path.sep).join('/');

      // Ensure directory exists
      await fs.mkdir(targetDir, { recursive: true });

      let buffer: Buffer;
      let contentType: string;

      if (file instanceof File) {
        const arrayBuffer = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
        contentType = opts?.contentType || file.type || 'application/octet-stream';
      } else {
        buffer = file;
        contentType = opts?.contentType || 'application/octet-stream';
      }

      // Write file
      await fs.writeFile(targetPath, buffer);

      // Calculate hash
      const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

      logger.info('File saved successfully', {
        fileId,
        fileName: safeName,
        size: buffer.length,
        sha256,
        storagePath,
      });

      return {
        fileName: safeName,
        size: buffer.length,
        sha256,
        contentType,
        storagePath,
        absolutePath: targetPath,
      };
    } catch (error) {
      logger.error('Failed to save file', {
        fileName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error(`Failed to save file: ${fileName}`);
    }
  }

  /**
   * Resolve an absolute path from a stored relative path
   */
  static getAbsolutePath(storagePath: string): string {
    const normalized = storagePath.replace(/\\/g, '/');
    const resolved = path.join(STORAGE_ROOT_PATH, normalized);
    return resolved;
  }

  /**
   * Check if file exists
   */
  static async fileExists(storagePath: string): Promise<boolean> {
    try {
      await fs.access(this.getAbsolutePath(storagePath));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file stats
   */
  static async getFileStats(storagePath: string) {
    return await fs.stat(this.getAbsolutePath(storagePath));
  }

  /**
   * Read file as buffer
   */
  static async readFile(storagePath: string): Promise<Buffer> {
    return await fs.readFile(this.getAbsolutePath(storagePath));
  }

  /**
   * Create a readable stream for a file
   */
  static createReadStream(storagePath: string): Readable {
    const filePath = this.getAbsolutePath(storagePath);
    const fsModule = require('fs');
    return fsModule.createReadStream(filePath);
  }

  /**
   * Delete a file by its storage path
   */
  static async deleteFile(storagePath: string): Promise<void> {
    try {
      const filePath = this.getAbsolutePath(storagePath);
      await fs.rm(filePath, { force: true });

      // Best-effort cleanup: remove the per-file directory if it's now empty.
      try {
        const dirPath = path.dirname(filePath);
        await fs.rmdir(dirPath);
      } catch {
        // ignore
      }
      logger.info('File deleted', { storagePath });
    } catch (error) {
      logger.error('Failed to delete file', {
        storagePath,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get content type from file extension
   */
  static getContentTypeFromExtension(fileName: string): string {
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
      '.js': 'application/javascript',
      '.ts': 'application/typescript',
    };

    return contentTypes[ext] || 'application/octet-stream';
  }
}
