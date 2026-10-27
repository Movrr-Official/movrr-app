import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.MOVRR_PLAYWRIGHT_MODULE);
const out=path.resolve(process.env.MOVRR_PARTNER_VISUAL_OUT ?? '.tmp/partner-mobile-review/evidence');fs.mkdirSync(out,{recursive:true});
const origin=process.env.MOVRR_PARTNER_VISUAL_AFTER ?? 'http://127.0.0.1:3362';
const populated=process.env.MOVRR_PARTNER_VISUAL_POPULATED ?? 'http://127.0.0.1:3363';
const browser=await chromium.launch({headless:true});
try {
 const context=await browser.newContext({viewport:{width:414,height:896},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 const screens=[['Home','/dashboard',origin],['Activity','/dashboard/collections',populated],['Scan','/dashboard/validate',origin],['Rewards','/dashboard/rewards',populated],['Account','/dashboard/more',origin]];
 const captures=[];
 for(const [name,route,base] of screens) {
  const page=await context.newPage();await page.goto(base+route,{waitUntil:'networkidle'});await page.locator('[data-presentation=mobile]').waitFor();await page.addStyleTag({content:'nextjs-portal{display:none!important}'});await page.evaluate(()=>document.fonts.ready);
  const file=path.join(out,`${name.toLowerCase()}-final.png`);await page.screenshot({path:file});captures.push([name,'data:image/png;base64,'+fs.readFileSync(file).toString('base64')]);await page.close();
 }
 const page=await browser.newPage({viewport:{width:1620,height:840},deviceScaleFactor:1});
 await page.setContent(`<html><style>*{box-sizing:border-box}body{margin:0;padding:28px;background:#e9ede8;color:#17221a;font:14px system-ui}h1{font-size:25px;margin:0 0 8px}p{color:#626c64;margin:0 0 24px}.screens{display:grid;grid-template-columns:repeat(5,1fr);gap:20px}h2{font-size:14px;margin:0 0 12px}.screens img{width:100%;border-radius:22px;box-shadow:0 4px 20px #0001}</style><body><h1>MOVRR Partner · mobile application review</h1><p>Shared MOVRR identity. Distinct Partner compositions. Actual local application renders at 414×896; Activity and Rewards use labelled, read-only test fixtures. No production records.</p><div class=screens>${captures.map(([label,url])=>`<section><h2>${label}</h2><img src="${url}" /></section>`).join('')}</div></body></html>`);
 await page.screenshot({path:path.join(out,'mobile-app-review.png'),fullPage:true});
}finally{await browser.close()}
