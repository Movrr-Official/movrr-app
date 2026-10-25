// Actual local Partner route; use the established isolated visual-session harness.
// Never use production identities, cameras, validation commands or merchant data.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const origin = new URL(process.env.MOVRR_PARTNER_LAYOUT_ORIGIN ?? 'http://127.0.0.1:3320');
assert.equal(origin.hostname, '127.0.0.1', 'Isolated localhost route required');
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.MOVRR_PLAYWRIGHT_MODULE);
const out = path.resolve('.tmp/partner-scanner-layout-20261025');
fs.mkdirSync(out, { recursive: true });
const checks = [], browser = await chromium.launch();
try {
  for (const width of [320, 360, 390, 430]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto(new URL('/dashboard/validate', origin).href, { waitUntil: 'networkidle' });
    for (const locale of ['en', 'nl']) {
      if (locale === 'nl') {
        await page.getByRole('button', { name: 'Language: English', exact: true }).click();
        await page.getByRole('button', { name: 'Nederlands', exact: true }).click();
      }
      await page.getByText(locale === 'en' ? 'Hold the QR code inside the frame.' : 'Houd de QR-code binnen het kader.', { exact: true }).waitFor();
      for (const instructionScale of [1, 2]) {
        await page.locator('.partner-camera-placeholder p').evaluate((el, scale) => { el.style.fontSize = 15 * scale + 'px'; }, instructionScale);
        await page.evaluate(() => document.fonts.ready);
        const bounds = await page.locator('.partner-camera-placeholder').evaluate(el => {
          const frame = el.getBoundingClientRect(), text = el.querySelector('p').getBoundingClientRect();
          return {
            withinFrame: text.x >= frame.x + 16 && text.right <= frame.right - 16 && text.y >= frame.y + 16 && text.bottom <= frame.bottom - 16,
            pageOverflow: document.documentElement.scrollWidth > innerWidth,
          };
        });
        checks.push({ locale, width, instructionScale, ...bounds });
      }
      await page.locator('.partner-camera-placeholder p').evaluate(el => { el.style.fontSize = ''; });
    }
    await page.waitForTimeout(400); // Let the language popover's exit transition complete.
    await page.screenshot({ path: path.join(out, `scanner-nl-${width}.png`) });
    await context.close();
  }
  fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ production: false, physicalDevice: false, checks }, null, 2));
  assert(checks.every(check => check.withinFrame && !check.pageOverflow), 'Scanner instruction exceeds its frame');
  console.log(JSON.stringify({ passed: checks.length, production: false, physicalDevice: false }));
} finally {
  await browser.close();
}
