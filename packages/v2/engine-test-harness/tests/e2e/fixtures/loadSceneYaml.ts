import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/** fixtures/scenes at package root (tests/e2e/fixtures -> ../../fixtures/scenes) */
const SCENES_DIR = join(__dirname, '..', '..', '..', 'fixtures', 'scenes');

/**
 * Loads scene YAML from fixtures/scenes/.
 * @param sceneName - Filename without extension (e.g. 'simple-floor')
 */
export function loadSceneYamlFixture(sceneName: string): string {
  return readFileSync(join(SCENES_DIR, `${sceneName}.yaml`), 'utf-8');
}
