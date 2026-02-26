import type IServerDirectory from '@client/domain/ports/IServerDirectory';
import type { ServerInfo } from '@client/domain/server/ServerInfo';
import type IStorage from '@client/domain/ports/IStorage';

/**
 * Persistent implementation of server directory backed by IStorage (FileStorage / IPC).
 * Stores servers under a single JSON key. Safe against corrupt data.
 */
export class PersistentServerDirectory implements IServerDirectory {
  private cache: ServerInfo[] = [];
  private loaded = false;
  private readonly storageKey: string;

  constructor(private storage: IStorage, storageKey = 'servers') {
    this.storageKey = storageKey;
  }

  private async ensureLoaded() {
    if (this.loaded) return;
    try {
      const data = await this.storage.readJson<ServerInfo[]>(this.storageKey);
      if (Array.isArray(data)) {
        // Basic shape validation
        this.cache = data.filter(s => typeof s.id === 'string' && typeof s.name === 'string' && typeof s.url === 'string');
      } else {
        this.cache = [];
      }
    } catch {
      this.cache = []; // Corrupt file fallback
    } finally {
      this.loaded = true;
    }
  }

  private async flush() {
    await this.storage.writeJson(this.storageKey, this.cache);
  }

  async listServers(): Promise<ServerInfo[]> {
    await this.ensureLoaded();
    return [...this.cache];
  }

  async getServer(id: string): Promise<ServerInfo | undefined> {
    await this.ensureLoaded();
    return this.cache.find(s => s.id === id);
  }

  async addServer(info: ServerInfo): Promise<void> {
    await this.ensureLoaded();
    if (this.cache.some(s => s.id === info.id)) throw new Error(`Server with id '${info.id}' already exists.`);
    this.cache.push(info);
    await this.flush();
  }

  async removeServer(id: string): Promise<void> {
    await this.ensureLoaded();
    const before = this.cache.length;
    this.cache = this.cache.filter(s => s.id !== id);
    if (this.cache.length !== before) await this.flush();
  }

  // Optional latency stub retained for interface compatibility (unused now)
  async refreshLatency(server: ServerInfo): Promise<ServerInfo> { return server; }
}

export default PersistentServerDirectory;
