import { h } from 'preact';
import { useState } from 'preact/hooks';
import { useServices } from '../../../hooks/useServices';
import { Entity } from '@duckengine/rendering-three/ecs';

type Props = {
  onCreated?: (id: string) => void;
};

export function CreateEntityButton({ onCreated }: Props) {
  const services = useServices();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const openPopup = () => { setName(''); setError(null); setOpen(true); };
  const close = () => { setOpen(false); setError(null); };

  const create = () => {
    const id = name?.trim();
    if (!id) { setError('Name required'); return; }
    try {
      const scene = services.sceneManager?.getCurrent?.();
      if (!scene) { setError('No active scene'); return; }
      // Create an ECS Entity using the domain Entity class and add it to the scene
      try {
        const ent = new Entity(id);
        // Some scenes expect full Entity instances
        (scene as any).addEntity && (scene as any).addEntity(ent);
        if (onCreated) onCreated(ent.id);
      } catch (e: any) {
        setError(String(e));
        return;
      }
      close();
    } catch (e: any) {
      setError(String(e));
    }
  };

  return (
    <div className="create-entity-container">
      <button className="create-entity-btn" onClick={openPopup}>+ New Entity</button>
      {open && (
        <div className="create-entity-overlay" role="dialog">
          <div className="create-entity-popup">
            <div className="create-entity-header">Create Entity</div>
            <div style={{ marginTop: 8 }}>
              <input className="text-input" value={name} onInput={(e: any) => setName(e.currentTarget.value)} placeholder="entity-name" />
            </div>
            {error && <div className="error-box" style={{ marginTop: 8 }}>{error}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
              <button onClick={close}>Cancel</button>
              <button onClick={create}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateEntityButton;
