import { test, expect } from './fixtures/harnessTest';
import { loadSceneYamlFixture } from './fixtures/loadSceneYaml';
import { buildTestUrl, type RenderingBackend } from './fixtures/testUrl';

type HarnessLog = {
  level?: string;
  message?: string;
  context?: Record<string, unknown>;
};

/**
 * Lua-driven transform3d.enabled demo.
 * Asserts stable `self.Log` markers (not pixel timing). Screenshots are artifacts only.
 *
 * Scene interval = 3s → phases: [0,3) on, [3,6) off, [6,9) on.
 */
test.use({ video: 'on' });

async function getLogs(page: import('@playwright/test').Page): Promise<HarnessLog[]> {
  return (await page.evaluate(() => (window as any).getLogs?.() ?? [])) as HarnessLog[];
}

async function waitForLog(
  page: import('@playwright/test').Page,
  substring: string,
  timeoutMs: number,
): Promise<void> {
  await page.waitForFunction(
    (needle: string) => {
      const logs = (window as any).getLogs?.() ?? [];
      return logs.some((e: { message?: string }) => e.message?.includes(needle));
    },
    substring,
    { timeout: timeoutMs },
  );
}

for (const backend of ['webgl', 'webgpu'] as const satisfies readonly RenderingBackend[]) {
  test.describe(`${backend}`, () => {
    test('transform-toggle: Lua logs enabled→disabled→enabled', async ({ page }) => {
      test.setTimeout(90000);
      await page.goto(buildTestUrl('/test.html', backend, { freeze: '0' }));

      await page.waitForFunction(
        () => (window as any).__harnessReady === true || (window as any).__harnessError,
        { timeout: 45000 },
      ).catch(() => null);

      const harnessError = await page.evaluate(() => (window as any).__harnessError);
      if (harnessError) {
        throw new Error(`Harness init failed: ${harnessError}`);
      }

      const yaml = await loadSceneYamlFixture(page, 'transform-toggle');
      const loadResult = await page.evaluate((y: string) => {
        return (window as any).loadSceneYaml(y);
      }, yaml);

      if (!loadResult.ok) {
        console.log('Diagnostic logs:', JSON.stringify(await getLogs(page), null, 2));
        throw new Error(`loadSceneYaml failed: ${loadResult.error ?? 'unknown'}`);
      }

      await waitForLog(page, 'transform-toggle: ready', 20000);

      await page.evaluate(async () => {
        const ready = (window as any).readyForScreenshot;
        if (ready) await ready();
      });
      const shotEnabled = await page.screenshot({
        path: `test-output/transform-toggle-${backend}-enabled.png`,
      });
      await test.info().attach('enabled', { body: shotEnabled, contentType: 'image/png' });

      // Mid/late into first disabled phase (interval 3s) — driven by Log, not wall-clock guess.
      await waitForLog(page, 'transform-toggle: disabled', 20000);
      await page.waitForTimeout(400);
      await page.evaluate(async () => {
        const ready = (window as any).readyForScreenshot;
        if (ready) await ready();
      });
      const shotDisabled = await page.screenshot({
        path: `test-output/transform-toggle-${backend}-disabled.png`,
      });
      await test.info().attach('disabled', { body: shotDisabled, contentType: 'image/png' });

      await page.waitForFunction(
        () => {
          const logs = ((window as any).getLogs?.() ?? []) as Array<{ message?: string }>;
          const msgs = logs.map((e) => e.message ?? '');
          const disabledAt = msgs.findIndex((m) => m.includes('transform-toggle: disabled'));
          if (disabledAt < 0) return false;
          return msgs.slice(disabledAt + 1).some((m) => m.includes('transform-toggle: enabled'));
        },
        { timeout: 20000 },
      );
      await page.waitForTimeout(400);
      await page.evaluate(async () => {
        const ready = (window as any).readyForScreenshot;
        if (ready) await ready();
      });
      const shotReenabled = await page.screenshot({
        path: `test-output/transform-toggle-${backend}-reenabled.png`,
      });
      await test.info().attach('reenabled', { body: shotReenabled, contentType: 'image/png' });

      const messages = (await getLogs(page)).map((e) => e.message ?? '');
      expect(messages.some((m) => m.includes('transform-toggle: ready'))).toBe(true);
      expect(messages.some((m) => m.includes('transform-toggle: disabled'))).toBe(true);

      const disabledAt = messages.findIndex((m) => m.includes('transform-toggle: disabled'));
      expect(
        messages.slice(disabledAt + 1).some((m) => m.includes('transform-toggle: enabled')),
        'Expected transform-toggle: enabled after disabled (re-enter space)',
      ).toBe(true);
    });
  });
}
