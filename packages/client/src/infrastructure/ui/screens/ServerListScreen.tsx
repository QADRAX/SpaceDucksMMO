/** @jsxImportSource preact */
import { render, FunctionComponent } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import type IScreen from '../../../domain/ports/IScreen';
import ScreenId from '../../../domain/ui/ScreenId';
import type ServerBrowserService from '../../../application/ServerBrowserService';

interface ServerListViewProps {
  go: (id: ScreenId) => void;
  svc: ServerBrowserService;
}

const ServerListView: FunctionComponent<ServerListViewProps> = ({ go, svc }) => {
  const [servers, setServers] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  async function load() {
    const list = await svc.list();
    setServers(list);
  }

  useEffect(() => { load(); }, []);

  const add = async () => {
    setError('');
    if (!name.trim() || !url.trim()) { setError('Name and URL required'); return; }
    try {
      await svc.add({ name: name.trim(), region: region.trim(), url: url.trim() });
      setName(''); setRegion(''); setUrl('');
      await load();
    } catch (e: any) { setError(e?.message || 'Failed'); }
  };

  const remove = async (id: string) => {
    await svc.remove(id);
    await load();
  };

  return (
    <div className="ui-panel stack">
      <div className="group">
        <button className="btn ghost" onClick={() => go(ScreenId.Main)}>&lt; Back</button>
        <h4 className="ui-title" style={{ margin: 0 }}>Servers</h4>
      </div>

      <div className="stack">
        <input className="input" placeholder="Server name" value={name} onInput={e => setName((e.target as HTMLInputElement).value)} />
        <input className="input" placeholder="Region (eu-west)" value={region} onInput={e => setRegion((e.target as HTMLInputElement).value)} />
        <input className="input" placeholder="URL (http://host:port)" value={url} onInput={e => setUrl((e.target as HTMLInputElement).value)} />
        <div className="group">
          <button className="btn primary" onClick={add}>Add server</button>
        </div>
        <div style={{ color: '#f87171', fontSize: 12, minHeight: 16 }}>{error}</div>
      </div>

      <div className="label">Registered servers</div>
      <div className="stack">
        {servers.length === 0 && <div className="label">No servers yet. Add one above.</div>}
        {servers.map(s => (
          <div className="group" key={s.id}>
            <div className="server-item" style={{ flex: 1 }}>{s.name} ({s.region}) — {s.url}</div>
            <button className="btn" onClick={() => remove(s.id)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export class ServerListScreen implements IScreen {
  id = ScreenId.ServerList;
  private el!: HTMLElement;
  constructor(private go: (id: ScreenId) => void, private servers: ServerBrowserService) {}
  mount(container: HTMLElement): void {
    this.el = document.createElement('div');
    render(<ServerListView go={this.go} svc={this.servers} />, this.el);
    container.appendChild(this.el);
  }
  unmount(): void {
    render(null as any, this.el);
    this.el.remove();
  }
}

export default ServerListScreen;
