import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', error => console.error(`[Browser Error] ${error.message}`));
  page.on('requestfailed', request => console.log(`[Network Error] ${request.url()} - ${request.failure()?.errorText}`));
  page.on('request', request => {
    if (request.url().includes('meshes') || request.url().includes('textures') || request.url().includes('materials')) {
        console.log(`[HTTP Fetch] ${request.url()}`);
    }
  });

  await page.goto('http://localhost:5173');
  
  // Wait for the scene list to load
  await page.waitForSelector('text=astra_lumen_ii_a_rigged_companion_android');
  
  // Click the load button
  await page.click('text=astra_lumen_ii_a_rigged_companion_android');
  
  // Wait to allow the scene to load
  await page.waitForTimeout(4000);

  // Click Show Logs
  try {
      await page.click('text=Show Logs');
      await page.waitForTimeout(500);
      const text = await page.innerText('aside');
      console.log('--- UI LOGS ---');
      console.log(text);
  } catch(e) {}

  await browser.close();
})();
