import { h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import './select-field.css';

export type SelectOption<T = string> = {
  value: T;
  label: string;
  icon?: preact.ComponentChildren;
  group?: string;
};

type Props<T = string> = {
  value: T | null;
  options: SelectOption<T>[];
  placeholder?: string;
  onChange: (v: T | null) => void;
  className?: string;
};

export function SelectField<T = string>({ value, options, placeholder = 'Select...', onChange, className = '' }: Props<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const selected = options.find((o) => o.value === value) || null;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!(e.target instanceof Node)) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const handleToggle = () => setOpen((s) => !s);

  const handleSelect = (opt: SelectOption<T>) => {
    onChange(opt.value);
    setOpen(false);
  };

  // group options by group label (preserve order)
  const groups: Array<{ label: string | null; items: SelectOption<T>[] }> = [];
  for (const o of options) {
    const g = o.group ?? '__none__';
    let grp = groups.find((x) => (x.label ?? '__none__') === g);
    if (!grp) {
      grp = { label: o.group ?? null, items: [] };
      groups.push(grp);
    }
    grp.items.push(o);
  }

  return (
    <div className={`sd-selectfield ${className}`} ref={ref}>
      <button type="button" className="sd-selectfield-toggle" onClick={handleToggle} aria-haspopup="listbox" aria-expanded={open}>
        <span className="sd-selectfield-value">
          {selected?.icon && <span className="sd-selectfield-icon">{selected.icon}</span>}
          <span className="sd-selectfield-label">{selected ? selected.label : placeholder}</span>
        </span>
        <span className="sd-selectfield-caret">▾</span>
      </button>

      {open && (
        <div className="sd-selectfield-menu" role="listbox">
          {groups.map((g, gi) => (
            <div key={gi} className="sd-selectfield-group">
              {g.label && <div className="sd-selectfield-group-label">{g.label}</div>}
              {g.items.map((it) => (
                <div
                  key={String(it.value)}
                  role="option"
                  aria-selected={value === it.value}
                  className={`sd-selectfield-item ${value === it.value ? 'selected' : ''}`}
                  onClick={() => handleSelect(it)}
                >
                  {it.icon && <span className="sd-selectfield-item-icon">{it.icon}</span>}
                  <span className="sd-selectfield-item-label">{it.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SelectField;
