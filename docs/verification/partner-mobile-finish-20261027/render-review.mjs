import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const {chromium}=createRequire(import.meta.url)(process.env.MOVRR_PLAYWRIGHT_MODULE);
const evidence=path.resolve(process.env.MOVRR_PARTNER_VISUAL_OUT ?? '.tmp/partner-mobile-finish-20261027/evidence');
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({viewport:{width:1600,height:900}});
 const screens=[['Home','home-finish'],['Activity','activity-finish'],['Scan','scan-en'],['Rewards','rewards-finish'],['Account','account-finish'],['Recorded activity','history-finish'],['Review and handover','handover-finish'],['Reward editor','editor-finish'],['Unsaved changes','unsaved-finish'],['Server validation result','scan-result-finish']];
 const data=file=>'data:image/png;base64,'+fs.readFileSync(file).toString('base64');
 await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;padding:30px;background:#e9ede8;color:#17221a;font:15px system-ui}h1{font-size:26px;margin:0 0 10px}p{color:#626c64;margin:0 0 28px}.screens{display:grid;grid-template-columns:repeat(5,1fr);gap:28px 20px}h2{font-size:16px;margin:0 0 12px}img{width:100%;border-radius:24px}</style><h1>MOVRR Partner: interaction and visual refinement</h1><p>Actual local application at 414 x 896. Labelled test fixtures and synthetic invalid scan code; no production records. Merchant actions use existing canonical services. Physical-device acceptance is separate.</p><div class="screens">${screens.map(([label,file])=>`<section><h2>${label}</h2><img src="${data(path.join(evidence,file+'.png'))}"></section>`).join('')}</div>`);
 await page.screenshot({path:fileURLToPath(new URL('./review.png',import.meta.url)),fullPage:true});
}finally{await browser.close();}
