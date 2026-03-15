import { test, expect } from '@playwright/test';
import { loadSceneYamlFixture } from './fixtures/loadSceneYaml';

test.describe('Scene Visual', () => {
  test('simple-floor: loads scene and renders', async ({ page }) => {
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
    }, loadSceneYamlFixture('simple-floor'));

    if (!loadResult.ok) {
      const logs = await page.evaluate(() => (window as any).getLogs?.() ?? []);
      console.log('Diagnostic logs:', JSON.stringify(logs, null, 2));
      throw new Error(`loadSceneYaml failed: ${loadResult.error ?? 'unknown'}`);
    }

    await page.evaluate(async () => {
      const ready = (window as any).readyForScreenshot;
      if (ready) await ready();
    });

    await page.waitForTimeout(1500);

    const logs = await page.evaluate(() => (window as any).getLogs?.() ?? []);
    console.log(`Diagnostic logs (${logs.length} entries):`, JSON.stringify(logs.slice(-15).map((e: any) => ({ level: e.level, message: e.message, context: e.context })), null, 2));

    const screenshot = await page.screenshot({
      path: 'test-output/scene-visual-simple-floor-captured.png',
    });
    expect(screenshot).toBeTruthy();
    expect(screenshot.length).toBeGreaterThan(0);
  });

  test('simple-floor: screenshot matches baseline', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/?mode=test&freeze=1');

    await page.waitForFunction(
      () => (window as any).__harnessReady === true || (window as any).__harnessError,
      { timeout: 45000 },
    );

    const harnessError = await page.evaluate(() => (window as any).__harnessError);
    if (harnessError) {
      throw new Error(`Harness init failed: ${harnessError}`);
    }

    await page.evaluate((yaml: string) => {
      return (window as any).loadSceneYaml(yaml);
    }, loadSceneYamlFixture('simple-floor'));

    await page.evaluate(async () => {
      const ready = (window as any).readyForScreenshot;
      if (ready) await ready();
    });

    await page.waitForTimeout(1500);

    await expect(page).toHaveScreenshot('scene-visual-simple-floor.png');
  });

  test('concrete-floor: loads and renders with texture', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/?mode=test&freeze=1');
    await page.waitForFunction(
      () => (window as any).__harnessReady === true || (window as any).__harnessError,
      { timeout: 45000 },
    );
    const harnessError = await page.evaluate(() => (window as any).__harnessError);
    if (harnessError) throw new Error(`Harness init failed: ${harnessError}`);

    const loadResult = await page.evaluate((yaml: string) => (window as any).loadSceneYaml(yaml), loadSceneYamlFixture('concrete-floor'));
    if (!loadResult.ok) throw new Error(`loadSceneYaml failed: ${loadResult.error ?? 'unknown'}`);

    await page.evaluate(async () => { const r = (window as any).readyForScreenshot; if (r) await r(); });
    await page.waitForTimeout(1500);

    const screenshot = await page.screenshot({ path: 'test-output/scene-visual-concrete-floor.png' });
    expect(screenshot).toBeTruthy();
    expect(screenshot.length).toBeGreaterThan(0);
  });

  test('gold-floor: loads and renders with MetalGoldFoil001 texture', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/?mode=test&freeze=1');
    await page.waitForFunction(
      () => (window as any).__harnessReady === true || (window as any).__harnessError,
      { timeout: 45000 },
    );
    const harnessError = await page.evaluate(() => (window as any).__harnessError);
    if (harnessError) throw new Error(`Harness init failed: ${harnessError}`);

    const loadResult = await page.evaluate((yaml: string) => (window as any).loadSceneYaml(yaml), loadSceneYamlFixture('gold-floor'));
    if (!loadResult.ok) throw new Error(`loadSceneYaml failed: ${loadResult.error ?? 'unknown'}`);

    await page.evaluate(async () => { const r = (window as any).readyForScreenshot; if (r) await r(); });
    await page.waitForTimeout(1500);

    const screenshot = await page.screenshot({ path: 'test-output/scene-visual-gold-floor.png' });
    expect(screenshot).toBeTruthy();
    expect(screenshot.length).toBeGreaterThan(0);
  });

  test('floor-with-camera: renders and saves screenshot', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/?mode=test&freeze=1');

    await page.waitForFunction(
      () => (window as any).__harnessReady === true || (window as any).__harnessError,
      { timeout: 45000 },
    );

    const harnessError = await page.evaluate(() => (window as any).__harnessError);
    if (harnessError) {
      throw new Error(`Harness init failed: ${harnessError}`);
    }

    const loadResult = await page.evaluate((yaml: string) => {
      return (window as any).loadSceneYaml(yaml);
    }, loadSceneYamlFixture('floor-with-camera'));

    if (!loadResult.ok) {
      throw new Error(`loadSceneYaml failed: ${loadResult.error ?? 'unknown'}`);
    }

    await page.evaluate(async () => {
      const ready = (window as any).readyForScreenshot;
      if (ready) await ready();
    });

    await page.waitForTimeout(1500);

    const screenshot = await page.screenshot({
      path: 'test-output/scene-visual-floor-with-camera.png',
    });
    expect(screenshot).toBeTruthy();
    expect(screenshot.length).toBeGreaterThan(0);
  });
});
