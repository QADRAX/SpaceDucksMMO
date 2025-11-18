import { useState } from 'preact/hooks';

type Props = {
  value: string | null;
  onChange: (v: string | null) => void;
};

export function TextureSelector({ value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const textures = [] as string[]; // placeholder: actual resolver lives in services in production

  return (
    <div>
      <input className="text-input" value={query} onInput={(e: JSX.TargetedEvent<HTMLInputElement, Event>) => setQuery(e.currentTarget.value)} />
      <div style={{ maxHeight: 120, overflow: 'auto' }}>
        {textures.map((t) => (
          <div key={t} onClick={() => onChange(t)}>{t}</div>
        ))}
        {textures.length === 0 && <div className="small-label">No textures</div>}
      </div>
    </div>
  );
}
