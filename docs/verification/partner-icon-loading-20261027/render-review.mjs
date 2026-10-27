import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.MOVRR_PLAYWRIGHT_MODULE);
const evidence = path.resolve(process.env.MOVRR_PARTNER_VISUAL_OUT ?? '.tmp/partner-mobile-loading-20261027/evidence');
const data = file => 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1560, height: 900 } });
  const screens = ['home', 'activity', 'scan', 'rewards', 'account'];
  await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;padding:32px;background:#e9ede8;color:#17221a;font:15px system-ui}h1{margin:0 0 10px;font-size:26px}p{color:#56645b;max-width:1200px}header{display:flex;gap:24px;align-items:center;margin-bottom:32px}header img{width:112px;border-radius:25px}header figure{margin:0;text-align:center;font-size:12px}header figcaption{margin-top:8px}.screens{display:grid;grid-template-columns:repeat(5,1fr);gap:20px}section>img{width:100%;border-radius:24px}h2{font-size:17px;text-transform:capitalize}h3{font-size:13px;font-weight:500}</style><header><figure><img src="${data('assets/partner/android-icon-source.png')}"><figcaption>Rider source</figcaption></figure><figure><img src="${data('public/pwa/partner/icon-512.png')}"><figcaption>MOVRR Partner</figcaption></figure><div><h1>MOVRR Partner: icon and loading review</h1><p>Continuous dark green canvas, green mark, original Rider proportions. Actual local Next.js route loading boundaries at 414 x 896, with a three-second delay confined to an isolated verification copy.</p><p>Ready screens use labelled read-only test fixtures. No production records. Browser rendering does not establish physical-device acceptance.</p></div></header><div class="screens">${screens.map(screen => `<section><h2>${screen}</h2><h3>Loading</h3><img src="${data(path.join(evidence, screen+'-loading.png'))}"><h3>Content ready</h3><img src="${data(path.join(evidence, screen+'-ready.png'))}"></section>`).join('')}</div>`);
  await page.screenshot({ path: new URL('./review.png', import.meta.url).pathname.replace(/^\/(\w:)/, '$1'), fullPage: true });
} finally { await browser.close(); }
