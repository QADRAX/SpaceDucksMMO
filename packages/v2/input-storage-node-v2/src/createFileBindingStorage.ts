import * as fs from 'node:fs';
import type {
  BindingStoragePort,
  InputBindingsConfig,
} from '@duckengine/input-mappings-v2';

/**
 * Creates a BindingStoragePort that uses a JSON file.
 * For Node environments only.
 */
export function createFileBindingStorage(
  path: string,
): BindingStoragePort {
  return {
    async load(): Promise<InputBindingsConfig | null> {
      try {
        const raw = await fs.promises.readFile(path, 'utf-8');
        return JSON.parse(raw) as InputBindingsConfig;
      } catch {
        return null;
      }
    },

    async save(config: InputBindingsConfig): Promise<void> {
      await fs.promises.writeFile(
        path,
        JSON.stringify(config, null, 2),
        'utf-8',
      );
    },
  };
}
