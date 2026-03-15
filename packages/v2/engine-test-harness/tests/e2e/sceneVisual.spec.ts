import { test, expect } from '@playwright/test';
import { loadSceneYamlFixture } from './fixtures/loadSceneYaml';

test.describe('Scene Visual', () => {
  test('gold-sphere: loads scene, checks logs, takes screenshot', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/?mode=test&freeze=1');

    const ready = await page.waitForFunction(
      () => (window as any).__harnessReady === true || (window as any).__harnessError,
      { timeout: 45000 },
    ).catch(() => null);

    const harnessError = await page.evaluate(() => (window as any).__harnessError);
    if (harnessError) {
      throw new Error(`Harness init failed: ${harnessError}`);
    }

    const loadResult = await page.evaluate((yaml: string) => {
      return (window as any).loadSceneYaml(yaml);
    }, loadSceneYamlFixture('gold-sphere'));

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

    await page.waitForTimeout(500);

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
      logMessages.some((m) => m.includes('Loading refs into cache')),
      'Expected "Loading refs into cache" log',
    ).toBe(true);

    expect(
      logMessages.some((m) => m.includes('Fetching texture') && m.includes('MetalGoldFoil001')),
      'Expected "Fetching texture" for MetalGoldFoil001',
    ).toBe(true);

    expect(
      logMessages.some((m) => m.includes('Texture loaded') && m.includes('MetalGoldFoil001')),
      'Expected "Texture loaded" for MetalGoldFoil001',
    ).toBe(true);

    console.log(`Diagnostic logs (${logs.length} entries):`, JSON.stringify(logs.slice(-10).map((e) => ({ level: e.level, message: e.message, context: e.context })), null, 2));

    const screenshot = await page.screenshot({
      path: 'test-output/gold-sphere-captured.png',
    });
    expect(screenshot).toBeTruthy();
    expect(screenshot.length).toBeGreaterThan(0);

    await test.info().attach('gold-sphere', {
      body: screenshot,
      contentType: 'image/png',
    });
  });
});
