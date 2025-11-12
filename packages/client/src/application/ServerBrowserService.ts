import type IServerDirectory from '@client/domain/ports/IServerDirectory';
import type { ServerInfo } from '@client/domain/server/ServerInfo';

export class ServerBrowserService {
  constructor(private readonly directory: IServerDirectory) {}

  list(): Promise<ServerInfo[]> {
    return this.directory.listServers();
  }

  get(id: string): Promise<ServerInfo | undefined> {
    return this.directory.getServer(id);
  }

  // Latency not used for now per requirements
  async withLatency(): Promise<ServerInfo[]> { return this.list(); }

  async add(server: Omit<ServerInfo, 'id' | 'pingMs' | 'playersOnline' | 'maxPlayers' | 'status'> & { id?: string; status?: ServerInfo['status'] }): Promise<void> {
    // Generate id if missing and provide minimal defaults
    const id = server.id ?? `srv_${Date.now().toString(36)}`;
    const info: ServerInfo = {
      id,
      name: server.name,
      region: server.region || 'unknown',
      url: server.url,
      status: server.status ?? 'online'
    };
    return this.directory.addServer(info);
  }

  async remove(id: string): Promise<void> {
    return this.directory.removeServer(id);
  }
}

export default ServerBrowserService;
