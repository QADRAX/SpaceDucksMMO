import { useState } from 'preact/hooks';

type Props = {
  value: string | null;
  onChange: (v: string | null) => void;
};

export default function TextureSelector({ value, onChange }: Props) {
  const [query, setQuery] = useState('');
  const textures = [] as any[]; // placeholder: actual resolver lives in services in production

  return (
    <div>
      <input class="text-input" value={query} onInput={(e: any) => setQuery(e.target.value)} />
      <div style={{ maxHeight: 120, overflow: 'auto' }}>
        {textures.map((t) => (
          <div key={t} onClick={() => onChange(t)}>{t}</div>
        ))}
        {textures.length === 0 && <div class="small-label">No textures</div>}
      </div>
    </div>
  );
}
