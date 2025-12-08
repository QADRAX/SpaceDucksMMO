import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { logger } from './logger';
import { Readable } from 'stream';

/**
 * Filesystem storage service for asset files
 */

const STORAGE_BASE_PATH = process.env.ASSET_STORAGE_PATH || '/data/assets';

export interface FileMetadata {
  fileName: string;
  size: number;
  hash: string;
  contentType: string;
}

export class StorageService {
  /**
   * Save a file to the storage directory
   */
  static async saveFile(
    assetKey: string,
    version: string,
    file: File | Buffer,
    fileName: string
  ): Promise<FileMetadata> {
    try {
      const targetDir = path.join(STORAGE_BASE_PATH, assetKey, version);
      const targetPath = path.join(targetDir, fileName);

      // Ensure directory exists
      await fs.mkdir(targetDir, { recursive: true });

      let buffer: Buffer;
      let contentType: string;

      if (file instanceof File) {
        const arrayBuffer = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
        contentType = file.type || 'application/octet-stream';
      } else {
        buffer = file;
        contentType = 'application/octet-stream';
      }

      // Write file
      await fs.writeFile(targetPath, buffer);

      // Calculate hash
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');

      logger.info('File saved successfully', {
        assetKey,
        version,
        fileName,
        size: buffer.length,
        hash,
      });

      return {
        fileName,
        size: buffer.length,
        hash: `sha256:${hash}`,
        contentType,
      };
    } catch (error) {
      logger.error('Failed to save file', {
        assetKey,
        version,
        fileName,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error(`Failed to save file: ${fileName}`);
    }
  }

  /**
   * Get file path
   */
  static getFilePath(assetKey: string, version: string, fileName: string): string {
    return path.join(STORAGE_BASE_PATH, assetKey, version, fileName);
  }

  /**
   * Check if file exists
   */
  static async fileExists(assetKey: string, version: string, fileName: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(assetKey, version, fileName);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file stats
   */
  static async getFileStats(assetKey: string, version: string, fileName: string) {
    const filePath = this.getFilePath(assetKey, version, fileName);
    return await fs.stat(filePath);
  }

  /**
   * Read file as buffer
   */
  static async readFile(assetKey: string, version: string, fileName: string): Promise<Buffer> {
    const filePath = this.getFilePath(assetKey, version, fileName);
    return await fs.readFile(filePath);
  }

  /**
   * Create a readable stream for a file
   */
  static createReadStream(assetKey: string, version: string, fileName: string): Readable {
    const filePath = this.getFilePath(assetKey, version, fileName);
    const fsModule = require('fs');
    return fsModule.createReadStream(filePath);
  }

  /**
   * Delete all files for a specific asset version
   */
  static async deleteVersion(assetKey: string, version: string): Promise<void> {
    try {
      const versionDir = path.join(STORAGE_BASE_PATH, assetKey, version);
      await fs.rm(versionDir, { recursive: true, force: true });
      logger.info('Version directory deleted', { assetKey, version });
    } catch (error) {
      logger.error('Failed to delete version directory', {
        assetKey,
        version,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete all files for an asset
   */
  static async deleteAsset(assetKey: string): Promise<void> {
    try {
      const assetDir = path.join(STORAGE_BASE_PATH, assetKey);
      await fs.rm(assetDir, { recursive: true, force: true });
      logger.info('Asset directory deleted', { assetKey });
    } catch (error) {
      logger.error('Failed to delete asset directory', {
        assetKey,
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
