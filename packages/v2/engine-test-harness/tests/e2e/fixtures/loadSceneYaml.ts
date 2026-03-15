import type { Page } from '@playwright/test';

/**
 * Loads scene YAML from public/scenes/ via the served app URL.
 * Single source of truth: public/scenes/*.yaml
 *
 * @param page - Playwright page (must have navigated so request context is ready)
 * @param sceneName - Filename without extension (e.g. 'orbit-sphere')
 */
export async function loadSceneYamlFixture(page: Page, sceneName: string): Promise<string> {
  const response = await page.request.get(`/scenes/${sceneName}.yaml`);
  if (!response.ok()) {
    throw new Error(`Failed to fetch /scenes/${sceneName}.yaml: ${response.status()} ${response.statusText()}`);
  }
  return response.text();
}
