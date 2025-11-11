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

  async withLatency(): Promise<ServerInfo[]> {
    const servers = await this.list();
    return Promise.all(servers.map(s => this.directory.refreshLatency ? this.directory.refreshLatency(s) : Promise.resolve(s)));
  }
}

export default ServerBrowserService;
