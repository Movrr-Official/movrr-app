import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const { chromium }=createRequire(import.meta.url)(process.env.MOVRR_PLAYWRIGHT_MODULE);
const evidence=path.resolve(process.env.MOVRR_PARTNER_VISUAL_OUT ?? '.tmp/partner-mobile-header-20261027/evidence');
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1600,height:900}});
 const screens=[['Home','home'],['Activity','collections'],['Scan','validate'],['Rewards','rewards'],['Account','more']];
 const data=file=>'data:image/png;base64,'+fs.readFileSync(file).toString('base64');
 await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;padding:30px;background:#e9ede8;color:#17221a;font:15px system-ui}h1{font-size:26px;margin:0 0 10px}p{color:#626c64;margin:0 0 28px}.screens{display:grid;grid-template-columns:repeat(5,1fr);gap:20px}h2{font-size:16px;margin:0 0 12px}img{width:100%;border-radius:24px}</style><h1>MOVRR Partner: one header, clear screen context</h1><p>Actual local application at 414 x 896. Labelled read-only presentation fixtures; no production records. Physical-device acceptance is separate.</p><div class="screens">${screens.map(([label,file])=>`<section><h2>${label}</h2><img src="${data(path.join(evidence,file+'-header.png'))}"></section>`).join('')}</div>`);
 await page.screenshot({path:fileURLToPath(new URL('./review.png',import.meta.url)),fullPage:true});
} finally {await browser.close();}
