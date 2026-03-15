import type { InputBindingsConfig } from './inputBindingsConfig';

/**
 * Contrato para cargar/guardar bindings de input.
 * El consumer implementa según su entorno:
 * - Browser: localStorage, IndexedDB
 * - Node: fs, archivo JSON
 * - Electron: electron-store
 * - Mobile: AsyncStorage, SQLite
 */
export interface BindingStoragePort {
  /** Carga bindings guardados. null si no hay o error. */
  load(): Promise<InputBindingsConfig | null>;
  /** Guarda bindings. */
  save(config: InputBindingsConfig): Promise<void>;
}
