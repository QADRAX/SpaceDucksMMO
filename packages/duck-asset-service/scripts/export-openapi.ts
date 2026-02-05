import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { swaggerSpec } from '../src/lib/swagger';

async function main() {
  const outFile = path.resolve(process.cwd(), 'openapi.json');
  const json = JSON.stringify(swaggerSpec, null, 2);

  await fs.writeFile(outFile, `${json}\n`, 'utf8');

  // eslint-disable-next-line no-console
  console.log(`[openapi] wrote ${outFile}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[openapi] export failed', err);
  process.exitCode = 1;
});
