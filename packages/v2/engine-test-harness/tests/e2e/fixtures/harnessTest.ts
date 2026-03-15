import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { test as base, type Page } from '@playwright/test';
import { generateFpsChartHtml, type PerfReport } from './performanceChart';

/**
 * Extended test that automatically attaches diagnostic logs, browser console,
 * and frame-by-frame performance (FPS chart) to every test report.
 * Use this instead of the base test for harness e2e tests.
 */
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use, testInfo) => {
    const consoleEntries: string[] = [];

    page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      const loc = msg.location();
      const locStr = loc?.url ? ` (${loc.url}:${loc.lineNumber})` : '';
      consoleEntries.push(`[${type}] ${text}${locStr}`);
    });

    await use(page);

    try {
      await page.evaluate(() => (window as any).stopPerformanceRecording?.());
      const raw = await page.evaluate(() => (window as any).getPerformanceReport?.() ?? null);

      if (raw?.frames?.length) {
        const perfReport: PerfReport = { frames: raw.frames ?? [], phases: raw.phases ?? [] };

      const chartTitle = `${testInfo.title} — FPS`;
      const chartHtml = generateFpsChartHtml(perfReport, chartTitle);

      const slug = testInfo.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      const chartPath = join('test-output', `perf-${slug}.html`);
      mkdirSync(dirname(chartPath), { recursive: true });
      writeFileSync(chartPath, chartHtml, 'utf-8');

      await testInfo.attach('performance-fps-chart', {
        path: chartPath,
        contentType: 'text/html',
      });

      await testInfo.attach('performance-frames', {
        body: JSON.stringify(perfReport.frames, null, 0),
        contentType: 'application/json',
      });

      if (perfReport.phases.length > 0) {
        await testInfo.attach('performance-phases', {
          body: JSON.stringify(perfReport.phases, null, 2),
          contentType: 'application/json',
        });
      }
      }
    } catch {
      // Page may be closed; skip performance attachment
    }

    try {
      const diagnosticLogs = await page.evaluate(() => (window as any).getLogs?.() ?? []);
      await testInfo.attach('diagnostic-logs', {
        body: JSON.stringify(diagnosticLogs, null, 2),
        contentType: 'application/json',
      });
    } catch {
      // Page may be closed; skip diagnostic attachment
    }

    if (consoleEntries.length > 0) {
      await testInfo.attach('browser-console', {
        body: consoleEntries.join('\n'),
        contentType: 'text/plain',
      });
    }
  },
});

export { expect } from '@playwright/test';
