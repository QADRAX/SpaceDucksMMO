type ServerInfo = {
  id: string;
  name: string;
  region?: string;
  url: string;
  playersOnline?: number;
  maxPlayers?: number;
};

type Props = {
  server: ServerInfo;
  onRemove: (id: string) => void;
};

export default function ServerListItem({ server, onRemove }: Props) {
  return (
    <div className="sd-server-item">
      <div className="sd-server-main">
        <div className="sd-server-name">{server.name}</div>
        <div className="sd-server-region">{server.region ?? "—"}</div>
      </div>
      <div className="sd-server-meta">
        {server.playersOnline ?? 0}/{server.maxPlayers ?? "—"}
      </div>
      <button className="sd-server-remove" onClick={() => onRemove(server.id)}>
        Remove
      </button>
    </div>
  );
}
