#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');

const runId = new Date().toISOString().replace(/[.:]/g, '-');
const userArgs = process.argv.slice(2);

const jestBin = path.resolve(__dirname, '../../../node_modules/jest/bin/jest.js');

const jestArgs = [
  '--expose-gc',
  '--experimental-vm-modules',
  jestBin,
  '--testPathPatterns=\\.perf\\.test\\.ts$',
  '--runInBand',
  ...userArgs
];

console.log(`[benchmarks] Run ID: ${runId}`);

const result = spawnSync(process.execPath, jestArgs, {
  stdio: 'inherit',
  env: {
    ...process.env,
    DUCK_BENCHMARK_RUN_ID: runId
  }
});

if (result.error) {
  console.error('[benchmarks] Failed to run Jest:', result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
