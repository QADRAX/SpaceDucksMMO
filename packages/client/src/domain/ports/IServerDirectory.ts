import type { ServerInfo } from '@client/domain/server/ServerInfo';

export interface IServerDirectory {
  listServers(): Promise<ServerInfo[]>;
  getServer(id: string): Promise<ServerInfo | undefined>;
  refreshLatency?(server: ServerInfo): Promise<ServerInfo>;
}

export default IServerDirectory;
