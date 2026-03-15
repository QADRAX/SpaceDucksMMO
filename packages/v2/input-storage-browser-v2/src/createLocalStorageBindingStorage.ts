import type {
  BindingStoragePort,
  InputBindingsConfig,
} from '@duckengine/input-mappings-v2';

/**
 * Creates a BindingStoragePort that uses localStorage.
 * For browser environments only.
 */
export function createLocalStorageBindingStorage(
  key = 'duckengine-input-bindings',
): BindingStoragePort {
  return {
    async load(): Promise<InputBindingsConfig | null> {
      if (typeof localStorage === 'undefined') return null;
      try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as InputBindingsConfig) : null;
      } catch {
        return null;
      }
    },

    async save(config: InputBindingsConfig): Promise<void> {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(key, JSON.stringify(config));
    },
  };
}
