import type IServerDirectory from '@client/domain/ports/IServerDirectory';
import type { ServerInfo } from '@client/domain/server/ServerInfo';

export class StaticServerDirectory implements IServerDirectory {
  private servers: ServerInfo[];

  constructor(servers?: ServerInfo[]) {
    this.servers = servers ?? [
      { id: 'local', name: 'Local Dev', region: 'local', status: 'online', url: 'http://localhost:3000' },
    ];
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
}

export default StaticServerDirectory;
