import fs from 'fs/promises';
import yaml from 'js-yaml';
import type { Galaxy } from '@spaceducks/core';
import type IGalaxyLoader from '../../application/ports/IGalaxyLoader';

/**
 * Implementación de IGalaxyLoader que lee un archivo YAML desde disco.
 */
export class YamlGalaxyLoader implements IGalaxyLoader {
  async load(cfgPath: string): Promise<Galaxy> {
    // fs.promises.readFile lanzará si no existe
    const text = await fs.readFile(cfgPath, 'utf8');
    const doc = yaml.load(text);
    if (!doc || typeof doc !== 'object') {
      throw new Error(`YAML inválido o vacío en: ${cfgPath}`);
    }
    return doc as Galaxy;
  }
}

export default YamlGalaxyLoader;
