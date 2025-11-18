type Props = {
  entities: any[];
  activeCamera: string | null;
  onSetActive: (id: string) => void;
};

export function CameraSelector({ entities, activeCamera, onSetActive }: Props) {
  return (
    <div style={{ marginTop: 6 }}>
      <select
        className="select-input"
        value={activeCamera || ''}
        onChange={(e: JSX.TargetedEvent<HTMLSelectElement, Event>) => {
          const id = e.currentTarget.value || null;
          if (!id) return;
          onSetActive(id);
        }}
      >
        <option value="">None</option>
        {entities.map((ce: any) => (
          <option key={ce.id} value={ce.id}>
            {ce.id}
          </option>
        ))}
      </select>
    </div>
  );
}
