import { useEffect, useState } from "preact/hooks";
import "./server-selector-popup.css";
import Popup from "../common/utility/Popup";
import Button from "../common/utility/Button";
import InputRow from "../common/form/InputRow";
import List from "../common/list/List";
import ListItem from "../common/list/ListItem";
import useI18n from "../../hooks/useI18n";
import { useServices } from "../../hooks/useServices";
import { TrashIcon, PlusIcon } from "../common/icons";

type ServerInfo = {
  id: string;
  name: string;
  region?: string;
  url: string;
  playersOnline?: number;
  maxPlayers?: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ServerSelectorPopup({ isOpen, onClose }: Props) {
  const { t } = useI18n();
  const { serverBrowser } = useServices();
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [region, setRegion] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadServers();
    }
  }, [isOpen]);

  async function loadServers() {
    if (!serverBrowser) return;
    try {
      const list = await serverBrowser.list();
      setServers(list as any);
    } catch (err) {
      console.error("Failed to load servers", err);
    }
  }

  async function handleAddServer() {
    if (!name.trim() || !url.trim() || !serverBrowser) return;
    
    try {
      await serverBrowser.add({
        id: crypto.randomUUID(),
        name: name.trim(),
        url: url.trim(),
        region: region.trim() || undefined,
      } as any);
      
      await loadServers();
      setName("");
      setUrl("");
      setRegion("");
      setShowAddForm(false);
    } catch (err) {
      console.error("Failed to add server", err);
    }
  }

  async function handleRemoveServer(id: string) {
    if (!serverBrowser) return;
    
    try {
      await serverBrowser.remove(id);
      await loadServers();
    } catch (err) {
      console.error("Failed to remove server", err);
    }
  }

  function handleConnect(server: ServerInfo) {
    console.log("Connecting to server:", server);
    // TODO: Implement server connection logic
    onClose();
  }

  return (
    <Popup isOpen={isOpen} onClose={onClose} title={t('servers.title')}>
      {/* Server list */}
      <List emptyMessage={t('servers.noServers')}>
        {servers.map((server) => (
          <ListItem key={server.id}>
            <div className="server-content">
              <div className="server-info">
                <div className="server-name">{server.name}</div>
                <div className="server-meta">
                  {server.region && <span className="server-region">{server.region}</span>}
                  <span className="server-url">{server.url}</span>
                </div>
              </div>
              <div className="server-actions">
                <Button variant="primary" size="small" onClick={() => handleConnect(server)}>
                  {t('servers.connect')}
                </Button>
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => handleRemoveServer(server.id)}
                >
                  <TrashIcon size={16} />
                </Button>
              </div>
            </div>
          </ListItem>
        ))}
      </List>

      {/* Add server form */}
      {showAddForm && (
        <div className="add-form">
          <h3>{t('servers.addNewServer')}</h3>
          <InputRow
            label={t('servers.serverName')}
            placeholder="My Server"
            value={name}
            onInput={setName}
          />
          <InputRow
            label={t('servers.serverUrl')}
            placeholder="ws://..."
            type="url"
            value={url}
            onInput={setUrl}
          />
          <InputRow
            label={t('servers.regionOptional')}
            placeholder="EU West"
            value={region}
            onInput={setRegion}
          />
          <div className="form-actions">
            <Button variant="ghost" onClick={() => setShowAddForm(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="success"
              onClick={handleAddServer}
              disabled={!name.trim() || !url.trim()}
            >
              {t('servers.addNewServer')}
            </Button>
          </div>
        </div>
      )}

      {/* Add button */}
      {!showAddForm && (
        <Button variant="ghost" fullWidth onClick={() => setShowAddForm(true)}>
          <PlusIcon size={16} /> {t('servers.addNewServer')}
        </Button>
      )}
    </Popup>
  );
}
