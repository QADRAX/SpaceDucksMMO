#!/usr/bin/env node

/**
 * Physics Performance Report Analyzer
 * 
 * Usage:
 *   node scripts/analyze-perf.js [reportFile.json]
 *   node scripts/analyze-perf.js --latest
 *   node scripts/analyze-perf.js --compare report1.json report2.json
 */

const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.includes('--latest')) {
    return { mode: 'latest' };
  }
  if (args.includes('--compare')) {
    const idx = args.indexOf('--compare');
    return { mode: 'compare', files: args.slice(idx + 1, idx + 3) };
  }
  if (args[0]) {
    return { mode: 'single', file: args[0] };
  }
  return { mode: 'latest' };
}

function findLatest() {
  const dir = path.join(process.cwd(), 'perf-results/stress');
  if (!fs.existsSync(dir)) {
    console.error('No perf-results/stress directory found');
    process.exit(1);
  }
  
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .reverse();
  
  if (files.length === 0) {
    console.error('No JSON reports found in perf-results/stress');
    process.exit(1);
  }
  
  return path.join(dir, files[0]);
}

function loadReport(filepath) {
  try {
    const full = path.isAbsolute(filepath) ? filepath : path.join(process.cwd(), filepath);
    if (!fs.existsSync(full)) {
      throw new Error(`File not found: ${full}`);
    }
    return JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch (e) {
    console.error('Error loading report:', e.message);
    process.exit(1);
  }
}

function printHeader(title) {
  console.log('\n' + '='.repeat(100));
  console.log(` ${title}`);
  console.log('='.repeat(100) + '\n');
}

function printRowTable(headers, rows) {
  const colWidths = headers.map((h, i) => {
    const headerWidth = h.length;
    const dataWidth = Math.max(...rows.map(r => String(r[i]).length));
    return Math.max(headerWidth, dataWidth) + 1;
  });

  // Header
  const headerRow = headers
    .map((h, i) => h.padEnd(colWidths[i]))
    .join('│');
  console.log(headerRow);
  console.log(
    headers
      .map((_, i) => '─'.repeat(colWidths[i]))
      .join('┼')
  );

  // Rows
  for (const row of rows) {
    const dataRow = row
      .map((v, i) => String(v).padEnd(colWidths[i]))
      .join('│');
    console.log(dataRow);
  }
}

function printChart(label, values, maxWidth = 60) {
  const max = Math.max(...values.map(v => v.value));
  const scale = maxWidth / max;

  console.log(`${label}:`);
  for (const { name, value } of values) {
    const barWidth = Math.max(1, Math.round(value * scale));
    const bar = '█'.repeat(barWidth);
    console.log(`  ${name.padEnd(25)} │${bar} ${value.toFixed(2)}`);
  }
  console.log();
}

function analyzeReport(report) {
  const { results } = report;

  printHeader('PHYSICS PERFORMANCE ANALYSIS');
  
  // Summary table
  console.log('SCENARIO SUMMARY:');
  const summaryRows = results.map(r => [
    r.scenarioName,
    r.entityCount,
    r.colliderCount,
    `${r.metrics.avg_ms.toFixed(3)}ms`,
    `${r.metrics.p95_ms.toFixed(3)}ms`,
    `${r.metrics.p99_ms.toFixed(3)}ms`,
    `${r.stability.stability_percent.toFixed(1)}%`,
    `${r.stability.estimated_fps.toFixed(1)} FPS`,
    r.stability.stability_percent >= 99 ? '✓' : r.stability.stability_percent >= 95 ? '⚠' : '✗'
  ]);
  printRowTable(
    ['Scenario', 'Entities', 'Colliders', 'Avg', 'P95', 'P99', 'Stability', 'Est. FPS', 'Status'],
    summaryRows
  );

  // Collision analysis
  printHeader('COLLISION ANALYSIS');
  const collisionRows = results.map(r => [
    r.scenarioName,
    r.collisions.total_events,
    `${r.collisions.avg_per_frame.toFixed(2)}`,
    r.collisions.max_per_frame,
  ]);
  printRowTable(
    ['Scenario', 'Total Events', 'Avg/Frame', 'Max/Frame'],
    collisionRows
  );

  // Performance chart
  printHeader('FRAME TIME DISTRIBUTION');
  printChart(
    'Average Frame Time (ms)',
    results.map(r => ({ name: r.scenarioName, value: r.metrics.avg_ms })),
    60
  );

  // Stability chart
  printChart(
    'Stability Percentage',
    results.map(r => ({ name: r.scenarioName, value: r.stability.stability_percent })),
    50
  );

  // Findings
  printHeader('KEY FINDINGS');

  const worstAvg = results.reduce((a, b) => a.metrics.avg_ms > b.metrics.avg_ms ? a : b);
  const worstStability = results.reduce((a, b) => a.stability.stability_percent < b.stability.stability_percent ? a : b);

  console.log(`Highest Frame Time: ${worstAvg.scenarioName} (${worstAvg.metrics.avg_ms.toFixed(3)}ms)`);
  console.log(`Worst Stability:    ${worstStability.scenarioName} (${worstStability.stability.stability_percent.toFixed(1)}%)`);

  // Threshold analysis
  const safeResults = results.filter(r => r.stability.stability_percent >= 99);
  const marginalResults = results.filter(r => r.stability.stability_percent >= 95 && r.stability.stability_percent < 99);
  const failResults = results.filter(r => r.stability.stability_percent < 95);

  console.log(`\nResults by Category:`);
  console.log(`  ✓ Safe (≥99%):      ${safeResults.length} scenarios`);
  console.log(`  ⚠ Marginal (95%):   ${marginalResults.length} scenarios`);
  console.log(`  ✗ Failing (<95%):   ${failResults.length} scenarios`);

  if (failResults.length > 0) {
    console.log(`\nRecommendations for failing scenarios:`);
    for (const result of failResults) {
      const overhead = result.metrics.avg_ms - 6.94;
      const pctOver = (overhead / 6.94) * 100;
      console.log(`  - ${result.scenarioName}: ${pctOver.toFixed(0)}% over budget`);
      console.log(`    Entities: ${result.entityCount}, Avg collisions: ${result.collisions.avg_per_frame.toFixed(0)}/frame`);
    }
  }

  console.log(`\nFrame Budget @ 144 FPS: ${report.frame_budget_ms.toFixed(2)}ms`);
  console.log(`Target FPS: ${report.target_fps}`);
  console.log(`Generated: ${report.generated_at}`);
}

function compareReports(file1, file2) {
  const report1 = loadReport(file1);
  const report2 = loadReport(file2);

  printHeader(`PERFORMANCE COMPARISON`);
  console.log(`Report 1: ${path.basename(file1)}`);
  console.log(`Report 2: ${path.basename(file2)}\n`);

  // Build comparison
  const scenarios = {};
  for (const r of report1.results) {
    scenarios[r.scenarioName] = { r1: r };
  }
  for (const r of report2.results) {
    if (!scenarios[r.scenarioName]) scenarios[r.scenarioName] = {};
    scenarios[r.scenarioName].r2 = r;
  }

  const rows = [];
  for (const [name, { r1, r2 }] of Object.entries(scenarios)) {
    if (!r1 || !r2) continue;

    const timeDelta = r2.metrics.avg_ms - r1.metrics.avg_ms;
    const timePct = (timeDelta / r1.metrics.avg_ms) * 100;
    const stabDelta = r2.stability.stability_percent - r1.stability.stability_percent;

    const arrow = timeDelta > 0 ? '↑' : '↓';
    const color = timePct > 10 ? '⚠' : timePct > -10 ? '→' : '✓';

    rows.push([
      name,
      `${r1.metrics.avg_ms.toFixed(3)}ms`,
      `${r2.metrics.avg_ms.toFixed(3)}ms`,
      `${arrow} ${timePct.toFixed(1)}%`,
      `${r1.stability.stability_percent.toFixed(1)}%`,
      `${r2.stability.stability_percent.toFixed(1)}%`,
      `${stabDelta > 0 ? '+' : ''}${stabDelta.toFixed(1)}%`,
      color,
    ]);
  }

  printRowTable(
    ['Scenario', 'T1 Avg', 'T2 Avg', 'Change', 'T1 Stab', 'T2 Stab', 'Stab Δ', 'Status'],
    rows
  );

  // Summary
  console.log();
  const avgTimeDelta = rows
    .map(r => parseFloat(r[3]) || 0)
    .reduce((a, b) => a + b, 0) / rows.length;

  console.log(`Average Performance Change: ${avgTimeDelta > 0 ? '+' : ''}${avgTimeDelta.toFixed(1)}%`);
  if (avgTimeDelta > 5) console.log('⚠ Performance degraded');
  if (avgTimeDelta < -5) console.log('✓ Performance improved');
}

// Main
const args = parseArgs();

switch (args.mode) {
  case 'latest':
    analyzeReport(loadReport(findLatest()));
    break;
  case 'single':
    analyzeReport(loadReport(args.file));
    break;
  case 'compare':
    compareReports(args.files[0], args.files[1]);
    break;
}
