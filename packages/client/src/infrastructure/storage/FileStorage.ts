import type IStorage from '@client/domain/ports/IStorage';
import { app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * File-based storage using Electron's userData directory.
 * Only available in main/preload contexts. For renderer, use IPC-backed storage.
 */
export class FileStorage implements IStorage {
  private basePath: string;

  constructor(namespace = 'spaceducks') {
    const userData = app.getPath('userData');
    this.basePath = path.join(userData, namespace);
  }

  private async ensureDir() {
    await fs.mkdir(this.basePath, { recursive: true });
  }

  private keyPath(key: string) {
    return path.join(this.basePath, `${key}.json`);
  }

  async readJson<T>(key: string): Promise<T | undefined> {
    await this.ensureDir();
    const file = this.keyPath(key);
    try {
      const content = await fs.readFile(file, 'utf8');
      return JSON.parse(content) as T;
    } catch (e: any) {
      if (e?.code === 'ENOENT') return undefined;
      throw e;
    }
  }

  async writeJson<T>(key: string, data: T): Promise<void> {
    await this.ensureDir();
    const file = this.keyPath(key);
    const tmp = `${file}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tmp, file);
  }

  async delete(key: string): Promise<void> {
    const file = this.keyPath(key);
    try { await fs.unlink(file); } catch {}
  }
}

export default FileStorage;
