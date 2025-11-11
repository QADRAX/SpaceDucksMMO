import type IStorage from '@client/domain/ports/IStorage';

/**
 * Simple browser-based storage using localStorage.
 * Safe for renderer/HMR development; consider replacing with IPC-backed storage for production.
 */
export class BrowserStorage implements IStorage {
  private ns: string;

  constructor(namespace = 'spaceducks') {
    this.ns = namespace;
  }

  private keyPath(key: string) {
    return `${this.ns}:${key}`;
  }

  async readJson<T>(key: string): Promise<T | undefined> {
    try {
      const raw = window.localStorage.getItem(this.keyPath(key));
      if (!raw) return undefined;
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }

  async writeJson<T>(key: string, data: T): Promise<void> {
    window.localStorage.setItem(this.keyPath(key), JSON.stringify(data));
  }

  async delete(key: string): Promise<void> {
    window.localStorage.removeItem(this.keyPath(key));
  }
}

export default BrowserStorage;
