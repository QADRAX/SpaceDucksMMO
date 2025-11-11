import type { Galaxy } from '@spaceducks/core';

/**
 * Puerto (interface) para loaders de galaxia.
 * Implementaciones pueden leer desde YAML, DB, HTTP, etc.
 */
export interface IGalaxyLoader {
  load(cfgPath: string): Promise<Galaxy>;
}

export default IGalaxyLoader;
