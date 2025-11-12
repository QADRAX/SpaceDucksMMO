import type IServerDirectory from '@client/domain/ports/IServerDirectory';
import type { ServerInfo } from '@client/domain/server/ServerInfo';

export class StaticServerDirectory implements IServerDirectory {
  private servers: ServerInfo[];

  constructor(servers?: ServerInfo[]) {
    // Initialize with empty list unless explicitly provided. User will add servers manually.
    this.servers = servers ?? [];
  }

  async listServers(): Promise<ServerInfo[]> {
    return this.servers;
  }

  async getServer(id: string): Promise<ServerInfo | undefined> {
    return this.servers.find(s => s.id === id);
  }

  async refreshLatency(server: ServerInfo): Promise<ServerInfo> {
    // Stubbed latency measurement
    return { ...server, pingMs: 12 };
  }

  async addServer(info: ServerInfo): Promise<void> {
    // Prevent duplicate ids
    if (this.servers.some(s => s.id === info.id)) {
      throw new Error(`Server with id '${info.id}' already exists.`);
    }
    this.servers.push(info);
  }

  async removeServer(id: string): Promise<void> {
    this.servers = this.servers.filter(s => s.id !== id);
  }
}

export default StaticServerDirectory;
