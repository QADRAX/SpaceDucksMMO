export interface ServerInfo {
  id: string;
  name: string;
  region: string;
  pingMs?: number;
  playersOnline?: number;
  maxPlayers?: number;
  status: 'online' | 'offline' | 'starting';
  url: string; // base URL for socket connection
}
