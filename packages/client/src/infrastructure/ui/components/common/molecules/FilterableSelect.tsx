import { h } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import LazyThumbnail from '../../inspector/molecules/LazyThumbnail';
import '../../common/molecules/filterable-select.css';

export interface FilterableOption {
  // support two shapes used across the codebase: { id, label } and { value, label }
  id?: string;
  value?: string;
  label: string;
  group?: string;
  thumbnail?: string; // path or url to image used by LazyThumbnail
}

export interface FilterableSelectProps {
  options: FilterableOption[];
  value: string | null | undefined;
  onChange: (id: string | null) => void;
  placeholder?: string; // input placeholder when no filterPlaceholder provided
  filterPlaceholder?: string; // explicit placeholder for the filter input
  initialFilter?: string;
  allowClear?: boolean;
  className?: string;
}

function groupOptions(options: FilterableOption[]) {
  const groups = new Map<string, FilterableOption[]>();
  const root: FilterableOption[] = [];
  for (const o of options) {
    if (o.group) {
      const arr = groups.get(o.group) ?? [];
      arr.push(o);
      groups.set(o.group, arr);
    } else {
      root.push(o);
    }
  }
  return { groups, root };
}

export default function FilterableSelect({
  options,
  value,
  onChange,
  placeholder = 'Filter... ',
  filterPlaceholder,
  initialFilter,
  allowClear = true,
  className = '',
}: FilterableSelectProps) {
  const [query, setQuery] = useState(initialFilter ?? '');
  const [open, setOpen] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const mountedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // only apply initialFilter on first mount
    if (!mountedRef.current) {
      mountedRef.current = true;
      if (initialFilter) setQuery(initialFilter);
    }
  }, [initialFilter]);

  const normalized = useMemo(() => query.trim().toLowerCase(), [query]);

  const filtered = useMemo(() => {
    if (!normalized) return options;
    return options.filter((o) => {
      const id = (o.id ?? o.value ?? '').toLowerCase();
      return o.label.toLowerCase().includes(normalized) || id.includes(normalized);
    });
  }, [options, normalized]);

  const { groups, root } = useMemo(() => groupOptions(filtered), [filtered]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  function handleSelect(id: string | null) {
    onChange(id);
    setQuery('');
    setOpen(false);
  }

  function toggleGroup(name: string) {
    setCollapsedGroups((s) => ({ ...s, [name]: !s[name] }));
  }

  const inputPlaceholder = filterPlaceholder ?? placeholder;

  return (
    <div className={`filterable-select ${className}`} ref={containerRef}>
      <div className="filterable-select__input">
        <input
          value={query}
          onInput={(e: Event) => setQuery((e.target as HTMLInputElement).value)}
          onFocus={() => setOpen(true)}
          placeholder={inputPlaceholder}
          aria-label="Filter"
        />
        {allowClear && query.length > 0 && (
          <button
            className="filterable-select__clear"
            onClick={() => setQuery('')}
            aria-label="Clear filter"
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <div className="filterable-select__list filterable-select__overlay">
          {root.length === 0 && groups.size === 0 ? (
            <div className="filterable-select__empty">No matches</div>
          ) : (
            <div>
              {root.map((o) => {
                const id = o.id ?? o.value ?? '';
                return (
                  <div
                    key={id}
                    className={`filterable-select__item ${value === id ? 'filterable-select__item--selected' : ''}`}
                    onClick={() => handleSelect(id || null)}
                    role="option"
                    aria-selected={value === id}
                  >
                    {o.thumbnail ? (
                      <LazyThumbnail src={o.thumbnail} className="filterable-select__thumbnail" />
                    ) : (
                      <div className="filterable-select__none" />
                    )}
                    <div className="filterable-select__label">{o.label}</div>
                  </div>
                );
              })}

              {Array.from(groups.entries()).map(([name, items]) => (
                <div className="filterable-select__group" key={name}>
                  <div className="filterable-select__group-header" onClick={() => toggleGroup(name)}>
                    <span>{name}</span>
                    <span>{collapsedGroups[name] ? '▸' : '▾'}</span>
                  </div>
                  {!collapsedGroups[name] && (
                    <div className="filterable-select__group-items">
                      {items.map((o) => {
                        const id = o.id ?? o.value ?? '';
                        return (
                          <div
                            key={id}
                            className={`filterable-select__item ${value === id ? 'filterable-select__item--selected' : ''}`}
                            onClick={() => handleSelect(id || null)}
                            role="option"
                            aria-selected={value === id}
                          >
                            {o.thumbnail ? (
                              <LazyThumbnail src={o.thumbnail} className="filterable-select__thumbnail" />
                            ) : (
                              <div className="filterable-select__none" />
                            )}
                            <div className="filterable-select__label">{o.label}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
