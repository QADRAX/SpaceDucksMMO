import { useEffect, useState } from "preact/hooks";
import "./server-selector-popup.css";
import Popup from "../common/utility/Popup";
import Button from "../common/utility/Button";
import InputRow from "../common/form/InputRow";
import List from "../common/list/List";
import ListItem from "../common/list/ListItem";
import type ServerBrowserService from "@client/application/ServerBrowserService";

type ServerInfo = {
  id: string;
  name: string;
  region?: string;
  url: string;
  playersOnline?: number;
  maxPlayers?: number;
};

type Props = {
  serverBrowser?: ServerBrowserService;
  isOpen: boolean;
  onClose: () => void;
};

export default function ServerSelectorPopup({ serverBrowser, isOpen, onClose }: Props) {
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
    <Popup isOpen={isOpen} onClose={onClose} title="Select Server">
      {/* Server list */}
      <List emptyMessage="No servers available">
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
                  Connect
                </Button>
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => handleRemoveServer(server.id)}
                >
                  🗑️
                </Button>
              </div>
            </div>
          </ListItem>
        ))}
      </List>

      {/* Add server form */}
      {showAddForm && (
        <div className="add-form">
          <h3>Add New Server</h3>
          <InputRow
            label="Server Name"
            placeholder="My Server"
            value={name}
            onInput={setName}
          />
          <InputRow
            label="Server URL"
            placeholder="ws://..."
            type="url"
            value={url}
            onInput={setUrl}
          />
          <InputRow
            label="Region (optional)"
            placeholder="EU West"
            value={region}
            onInput={setRegion}
          />
          <div className="form-actions">
            <Button variant="ghost" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleAddServer}
              disabled={!name.trim() || !url.trim()}
            >
              Add Server
            </Button>
          </div>
        </div>
      )}

      {/* Add button */}
      {!showAddForm && (
        <Button variant="ghost" fullWidth onClick={() => setShowAddForm(true)}>
          + Add New Server
        </Button>
      )}
    </Popup>
  );
}
