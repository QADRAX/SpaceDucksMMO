/** @jsxImportSource preact */
import { h } from 'preact';
import { useI18n } from '@client/infrastructure/ui/hooks/useI18n';
import './property-select.css';

export interface PropertySelectProps {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  translateOptions?: boolean;
  translationKeyPrefix?: string;
}

/**
 * Dropdown selector with optional translation
 * 
 * Features:
 * - Optional label translation
 * - Custom translation key prefix
 * - Consistent styling
 */
export function PropertySelect({
  value,
  options,
  onChange,
  translateOptions = false,
  translationKeyPrefix
}: PropertySelectProps) {
  const { t } = useI18n();
  
  const handleChange = (e: Event) => {
    const target = e.target as HTMLSelectElement;
    onChange(target.value);
  };
  
  return (
    <select value={value} onChange={handleChange} class="property-select">
      {options.map(opt => {
        let label = opt.label;
        
        if (translateOptions && translationKeyPrefix) {
          label = t(`${translationKeyPrefix}.${opt.value}`);
        }
        
        return (
          <option key={opt.value} value={opt.value}>
            {label}
          </option>
        );
      })}
    </select>
  );
}
