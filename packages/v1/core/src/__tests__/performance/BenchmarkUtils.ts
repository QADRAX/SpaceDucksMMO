/**
 * Utilities for performance benchmarking
 */

import * as fs from 'fs';
import * as path from 'path';

const DEFAULT_TARGET_FPS = 144;
const parsedTargetFps = Number(process.env.DUCK_TARGET_FPS ?? DEFAULT_TARGET_FPS);
export const TARGET_FPS = Number.isFinite(parsedTargetFps) && parsedTargetFps > 0
  ? parsedTargetFps
  : DEFAULT_TARGET_FPS;

export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  opsPerSecond: number;
  memoryUsed?: number;
}

export interface BenchmarkOptions {
  iterations?: number;
  warmupIterations?: number;
  maxTime?: number; // Maximum time to run in ms
  trackMemory?: boolean;
}

interface PersistedBenchmarkResult extends BenchmarkResult {
  timestamp: string;
  suite?: string;
  testName?: string;
}

interface BenchmarkReport {
  runId: string;
  generatedAt: string;
  cwd: string;
  totalBenchmarks: number;
  benchmarks: PersistedBenchmarkResult[];
}

const REPORT_DIR = path.join(process.cwd(), 'perf-results');
const RUN_ID = new Date().toISOString().replace(/[.:]/g, '-');
const LATEST_JSON_PATH = path.join(REPORT_DIR, 'benchmark-report-latest.json');
const LATEST_MD_PATH = path.join(REPORT_DIR, 'benchmark-report-latest.md');

const persistedResults: PersistedBenchmarkResult[] = [];

function getJestContext(): { suite?: string; testName?: string } {
  const maybeExpect = (globalThis as any).expect;
  if (!maybeExpect || typeof maybeExpect.getState !== 'function') {
    return {};
  }

  const state = maybeExpect.getState();
  const testPath = typeof state?.testPath === 'string' ? state.testPath : undefined;
  const currentTestName = typeof state?.currentTestName === 'string' ? state.currentTestName : undefined;
  const suite = testPath ? path.basename(testPath) : undefined;

  return {
    suite,
    testName: currentTestName
  };
}

function ensureReportDir(): void {
  if (!fs.existsSync(REPORT_DIR)) {
    fs.mkdirSync(REPORT_DIR, { recursive: true });
  }
}

function buildReport(): BenchmarkReport {
  return {
    runId: RUN_ID,
    generatedAt: new Date().toISOString(),
    cwd: process.cwd(),
    totalBenchmarks: persistedResults.length,
    benchmarks: [...persistedResults]
  };
}

function reportToMarkdown(report: BenchmarkReport): string {
  const lines: string[] = [];

  lines.push('# Benchmark Report');
  lines.push('');
  lines.push(`- Run ID: ${report.runId}`);
  lines.push(`- Generated At: ${report.generatedAt}`);
  lines.push(`- Working Dir: ${report.cwd}`);
  lines.push(`- Total Benchmarks: ${report.totalBenchmarks}`);
  lines.push(`- Target FPS: ${TARGET_FPS}`);
  lines.push(`- Frame Budget: ${(1000 / TARGET_FPS).toFixed(2)}ms`);
  lines.push('');

  if (report.benchmarks.length === 0) {
    lines.push('_No benchmark results collected._');
    lines.push('');
    return lines.join('\n');
  }

  lines.push('| Benchmark | Avg (ms) | Min (ms) | Max (ms) | Ops/sec | Iterations | Suite | Test | Timestamp |');
  lines.push('|---|---:|---:|---:|---:|---:|---|---|---|');

  for (const bench of report.benchmarks) {
    lines.push(
      `| ${bench.name} | ${bench.avgTime.toFixed(4)} | ${bench.minTime.toFixed(4)} | ${bench.maxTime.toFixed(4)} | ${bench.opsPerSecond.toFixed(2)} | ${bench.iterations} | ${bench.suite ?? '-'} | ${bench.testName ?? '-'} | ${bench.timestamp} |`
    );
  }

  lines.push('');
  return lines.join('\n');
}

function persistBenchmarkReport(): void {
  try {
    ensureReportDir();
    const report = buildReport();

    const json = JSON.stringify(report, null, 2);
    const md = reportToMarkdown(report);

    fs.writeFileSync(LATEST_JSON_PATH, json, 'utf8');
    fs.writeFileSync(LATEST_MD_PATH, md, 'utf8');
  } catch {
    // Never break tests if report generation fails.
  }
}

/**
 * Run a benchmark with multiple iterations and collect statistics
 */
export async function benchmark(
  name: string,
  fn: () => void | Promise<void>,
  options: BenchmarkOptions = {}
): Promise<BenchmarkResult> {
  const {
    iterations = 100,
    warmupIterations = 10,
    maxTime = 5000,
    trackMemory = false
  } = options;

  // Warmup
  for (let i = 0; i < warmupIterations; i++) {
    await fn();
  }

  // Collect garbage before benchmark
  if (global.gc) {
    global.gc();
  }

  const times: number[] = [];
  let totalIterations = 0;
  const startTime = performance.now();
  const initialMemory = trackMemory && process.memoryUsage ? process.memoryUsage().heapUsed : 0;

  // Run benchmark
  for (let i = 0; i < iterations; i++) {
    const iterStart = performance.now();
    await fn();
    const iterEnd = performance.now();
    
    times.push(iterEnd - iterStart);
    totalIterations++;

    // Stop if we've exceeded max time
    if (performance.now() - startTime > maxTime) {
      break;
    }
  }

  const endTime = performance.now();
  const finalMemory = trackMemory && process.memoryUsage ? process.memoryUsage().heapUsed : 0;

  const totalTime = endTime - startTime;
  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxIterTime = Math.max(...times);
  const opsPerSecond = (totalIterations / totalTime) * 1000;

  const result: BenchmarkResult = {
    name,
    iterations: totalIterations,
    totalTime,
    avgTime,
    minTime,
    maxTime: maxIterTime,
    opsPerSecond,
    memoryUsed: trackMemory ? finalMemory - initialMemory : undefined
  };

  const context = getJestContext();
  persistedResults.push({
    ...result,
    timestamp: new Date().toISOString(),
    suite: context.suite,
    testName: context.testName
  });
  persistBenchmarkReport();

  return result;
}

/**
 * Run a synchronous benchmark (convenience wrapper)
 */
export function benchmarkSync(
  name: string,
  fn: () => void,
  options?: BenchmarkOptions
): Promise<BenchmarkResult> {
  return benchmark(name, fn, options);
}

/**
 * Compare multiple benchmarks and return relative performance
 */
export async function compareBenchmarks(
  benchmarks: Array<{ name: string; fn: () => void | Promise<void> }>,
  options?: BenchmarkOptions
): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];

  for (const bench of benchmarks) {
    const result = await benchmark(bench.name, bench.fn, options);
    results.push(result);
  }

  return results;
}

/**
 * Format benchmark result as readable string
 */
export function formatBenchmarkResult(result: BenchmarkResult): string {
  const lines = [
    `Benchmark: ${result.name}`,
    `  Iterations: ${result.iterations}`,
    `  Total time: ${result.totalTime.toFixed(2)}ms`,
    `  Avg time: ${result.avgTime.toFixed(4)}ms`,
    `  Min time: ${result.minTime.toFixed(4)}ms`,
    `  Max time: ${result.maxTime.toFixed(4)}ms`,
    `  Ops/sec: ${result.opsPerSecond.toFixed(2)}`
  ];

  if (result.memoryUsed !== undefined) {
    const memMB = result.memoryUsed / 1024 / 1024;
    lines.push(`  Memory: ${memMB.toFixed(2)}MB`);
  }

  return lines.join('\n');
}

/**
 * Print benchmark results to console
 */
export function printBenchmarkResults(results: BenchmarkResult[]): void {
  console.log('\n' + '='.repeat(60));
  console.log('BENCHMARK RESULTS');
  console.log('='.repeat(60));

  results.forEach(result => {
    console.log('\n' + formatBenchmarkResult(result));
  });

  // Find fastest
  if (results.length > 1) {
    const fastest = results.reduce((prev, current) =>
      current.avgTime < prev.avgTime ? current : prev
    );
    
    console.log('\n' + '-'.repeat(60));
    console.log(`Fastest: ${fastest.name} (${fastest.avgTime.toFixed(4)}ms avg)`);
    
    // Show relative performance
    console.log('\nRelative performance:');
    results.forEach(result => {
      const ratio = result.avgTime / fastest.avgTime;
      const percent = ((ratio - 1) * 100).toFixed(1);
      const slower = ratio === 1 ? '(baseline)' : `(${percent}% slower)`;
      console.log(`  ${result.name}: ${ratio.toFixed(2)}x ${slower}`);
    });
  }

  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Assert that benchmark meets performance requirements
 */
export function expectBenchmarkFasterThan(
  result: BenchmarkResult,
  maxAvgTimeMs: number,
  message?: string
): void {
  const msg = message || `Expected ${result.name} to complete in less than ${maxAvgTimeMs}ms on average`;
  
  if (result.avgTime > maxAvgTimeMs) {
    throw new Error(
      `${msg}\nActual: ${result.avgTime.toFixed(4)}ms (${((result.avgTime / maxAvgTimeMs - 1) * 100).toFixed(1)}% slower)`
    );
  }
}

export function frameBudgetMs(targetFps: number = TARGET_FPS): number {
  return 1000 / targetFps;
}

export function expectBenchmarkWithinFrameBudget(
  result: BenchmarkResult,
  options?: {
    targetFps?: number;
    frameMultiplier?: number;
    message?: string;
  }
): void {
  const targetFps = options?.targetFps ?? TARGET_FPS;
  const frameMultiplier = options?.frameMultiplier ?? 1;
  const budgetMs = frameBudgetMs(targetFps) * frameMultiplier;
  const defaultMessage = `Expected ${result.name} to fit in ${frameMultiplier} frame budget(s) at ${targetFps} FPS (${budgetMs.toFixed(2)}ms)`;

  expectBenchmarkFasterThan(result, budgetMs, options?.message ?? defaultMessage);
}

/**
 * Assert minimum operations per second
 */
export function expectMinOpsPerSecond(
  result: BenchmarkResult,
  minOps: number,
  message?: string
): void {
  const msg = message || `Expected ${result.name} to achieve at least ${minOps} ops/sec`;
  
  if (result.opsPerSecond < minOps) {
    throw new Error(
      `${msg}\nActual: ${result.opsPerSecond.toFixed(2)} ops/sec`
    );
  }
}
