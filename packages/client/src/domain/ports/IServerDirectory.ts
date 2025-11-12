import type { ServerInfo } from '@client/domain/server/ServerInfo';

export interface IServerDirectory {
  listServers(): Promise<ServerInfo[]>;
  getServer(id: string): Promise<ServerInfo | undefined>;
  refreshLatency?(server: ServerInfo): Promise<ServerInfo>;
  /** Add a new server to the directory. Should reject duplicate ids. */
  addServer(info: ServerInfo): Promise<void>;
  /** Remove a server by id. Resolves silently if id doesn't exist. */
  removeServer(id: string): Promise<void>;
}

export default IServerDirectory;
