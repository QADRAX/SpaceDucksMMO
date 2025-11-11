import type IStorage from '@client/domain/ports/IStorage';

// Renderer-side storage implementation using preload-exposed IPC bridge.
export class IpcStorage implements IStorage {
  private bridge: any;

  constructor(globalKey = 'spaceducks') {
    // globalKey not used yet, reserved for namespace segregation via IPC if needed
    this.bridge = (window as any).spaceducks?.storage;
  }

  private ensure() {
    if (!this.bridge) throw new Error('IPC storage bridge unavailable');
  }

  async readJson<T>(key: string): Promise<T | undefined> {
    this.ensure();
    return this.bridge.readJson(key) as Promise<T | undefined>;
  }

  async writeJson<T>(key: string, data: T): Promise<void> {
    this.ensure();
    await this.bridge.writeJson(key, data);
  }

  async delete(key: string): Promise<void> {
    this.ensure();
    await this.bridge.delete(key);
  }
}

export default IpcStorage;
