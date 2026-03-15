import { test, expect } from './fixtures/harnessTest';
import { loadSceneYamlFixture } from './fixtures/loadSceneYaml';

test.use({ video: 'on' });

test('physics-balls: loads scene, records video of full camera waypoint lap', async ({ page }) => {
  test.setTimeout(90000);
  await page.goto('/test.html?freeze=0');

  const ready = await page.waitForFunction(
    () => (window as any).__harnessReady === true || (window as any).__harnessError,
    { timeout: 45000 },
  ).catch(() => null);

  const harnessError = await page.evaluate(() => (window as any).__harnessError);
  if (harnessError) {
    throw new Error(`Harness init failed: ${harnessError}`);
  }

  const yaml = await loadSceneYamlFixture(page, 'physics-balls');
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

  // Wait for one full camera lap around the 4 waypoints.
  // Waypoints: (-5,4,-5) -> (5,4,-5) -> (5,4,5) -> (-5,4,5) -> back to start.
  // ~40 units at speed 3 ≈ 14s. Add buffer for physics settling.
  await page.waitForTimeout(16000);

  const logs = (await page.evaluate(() => (window as any).getLogs?.() ?? [])) as Array<{
    level: string;
    message: string;
    context?: Record<string, unknown>;
  }>;
  const logMessages = logs.map((e) => `${e.message} ${JSON.stringify(e.context ?? {})}`);

  expect(
    logMessages.some((m) => m.includes('Physics world created') && m.includes('physics-rapier')),
    'Expected "Physics world created" log',
  ).toBe(true);

  expect(
    logMessages.some((m) => m.includes('Script slot init') && m.includes('waypoint_path')),
    'Expected "Script slot init" for waypoint_path script',
  ).toBe(true);

  const screenshot = await page.screenshot({
    path: 'test-output/physics-balls-captured.png',
  });
  expect(screenshot).toBeTruthy();
  expect(screenshot.length).toBeGreaterThan(0);

  await test.info().attach('physics-balls', {
    body: screenshot,
    contentType: 'image/png',
  });
});
