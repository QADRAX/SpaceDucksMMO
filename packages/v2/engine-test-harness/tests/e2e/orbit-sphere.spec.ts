import { test, expect } from './fixtures/harnessTest';
import { loadSceneYamlFixture } from './fixtures/loadSceneYaml';
import { buildTestUrl, type RenderingBackend } from './fixtures/testUrl';

test.use({ video: 'on' });

for (const backend of ['webgl', 'webgpu'] as const satisfies readonly RenderingBackend[]) {
  test.describe(`${backend}`, () => {
    test('orbit-sphere: loads scene with orbit camera script, runs animation, takes screenshot', async ({ page }) => {
      test.setTimeout(60000);
      await page.goto(buildTestUrl('/test.html', backend, { freeze: '0' }));

  const ready = await page.waitForFunction(
    () => (window as any).__harnessReady === true || (window as any).__harnessError,
    { timeout: 45000 },
  ).catch(() => null);

  const harnessError = await page.evaluate(() => (window as any).__harnessError);
  if (harnessError) {
    throw new Error(`Harness init failed: ${harnessError}`);
  }

  const yaml = await loadSceneYamlFixture(page, 'orbit-sphere');
  const loadResult = await page.evaluate((y: string) => {
    return (window as any).loadSceneYaml(y);
  }, yaml);

  if (!loadResult.ok) {
    const logs = await page.evaluate(() => (window as any).getLogs?.() ?? []);
    console.log('Diagnostic logs:', JSON.stringify(logs, null, 2));
    throw new Error(`loadSceneYaml failed: ${loadResult.error ?? 'unknown'}`);
  }

  await page.evaluate(async () => {
    const ready = (window as any).readyForScreenshot;
    if (ready) await ready();
  });

  await page.waitForFunction(
    () => {
      const logs = (window as any).getLogs?.() ?? [];
      return logs.some((e: { message: string }) => e.message?.includes('Texture loaded'));
    },
    { timeout: 10000 },
  );

  await page.waitForTimeout(2500);

  const logs = (await page.evaluate(() => (window as any).getLogs?.() ?? [])) as Array<{
    level: string;
    message: string;
    context?: Record<string, unknown>;
  }>;
  const logMessages = logs.map((e) => `${e.message} ${JSON.stringify(e.context ?? {})}`);

  expect(
    logMessages.some((m) => m.includes('Scripting session created') && m.includes('scripting-lua')),
    'Expected "Scripting session created" log from scripting subsystem',
  ).toBe(true);

  expect(
    logMessages.some((m) => m.includes('Script slot init') && m.includes('orbit_camera')),
    'Expected "Script slot init" for orbit_camera script',
  ).toBe(true);

  const screenshot = await page.screenshot({
    path: `test-output/orbit-sphere-${backend}-captured.png`,
  });
  expect(screenshot).toBeTruthy();
  expect(screenshot.length).toBeGreaterThan(0);

  await test.info().attach('orbit-sphere', {
    body: screenshot,
    contentType: 'image/png',
  });
});
  });
}
