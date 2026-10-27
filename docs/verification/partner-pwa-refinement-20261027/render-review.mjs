import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.MOVRR_PLAYWRIGHT_MODULE);
const out=path.resolve(process.env.MOVRR_PARTNER_VISUAL_OUT ?? '.tmp/partner-pwa-review/evidence');
fs.mkdirSync(out,{recursive:true});
const origin=process.env.MOVRR_PARTNER_VISUAL_AFTER ?? 'http://127.0.0.1:3342';
const riderReference=process.env.MOVRR_RIDER_REFERENCE ?? '../movrr-mobile/docs/store-assets/ios-submission-review-2026-10-18/screenshots/captures/iphone/home.png';
const b=await chromium.launch({headless:true});
try {
 const c=await b.newContext({viewport:{width:414,height:896},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 for(const [name,route] of [['home','/dashboard'],['activity','/dashboard/collections'],['scan','/dashboard/validate'],['rewards','/dashboard/rewards'],['account','/dashboard/more']]){
  const p=await c.newPage();await p.goto(origin+route,{waitUntil:'networkidle'});await p.addStyleTag({content:'nextjs-portal{display:none!important}'});await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:`${out}/${name}-review.png`});await p.close();
 }
 const image=file=>'data:image/png;base64,'+fs.readFileSync(file).toString('base64');
 const screens=[['Rider reference · 18 Oct',image(riderReference)],...['home','activity','scan','rewards','account'].map(n=>['Partner · '+n,image(`${out}/${n}-review.png`)])];
 const p=await b.newPage({viewport:{width:1864,height:960},deviceScaleFactor:1});
 await p.setContent(`<html><style>*{box-sizing:border-box}body{margin:0;padding:28px;background:#eceeea;color:#181816;font:14px system-ui}h1{font-size:26px;margin:0 0 8px}p{color:#545452;margin:0 0 24px}.screens{display:grid;grid-template-columns:repeat(6,1fr);gap:20px}h2{font-size:14px;margin:0 0 12px}.screens img{width:100%;border-radius:24px;box-shadow:0 6px 24px #0001}.icons{display:flex;align-items:center;gap:20px;margin-top:20px}.icons img{width:64px;height:64px;border-radius:14px}span{max-width:640px}</style><body><h1>MOVRR Partner · mobile application review</h1><p>Shared MOVRR design language. Merchant-first navigation and operations. Partner screens: isolated local render, empty read models, no production records.</p><div class=screens>${screens.map(([label,url])=>`<section><h2>${label}</h2><img src="${url}" /></section>`).join('')}</div><div class=icons><img src="${image('public/pwa/partner/icon-512.png')}"/><img src="${image('public/pwa/partner/apple-touch-icon.png')}"/><span><strong>MOVRR Partner</strong><br>Transparent master mark and platform-required opaque icon. No inset dark tile. Native phone installation and camera acceptance remain pending.</span></div></body></html>`);
 await p.screenshot({path:`${out}/visual-review.png`,fullPage:true});
}finally{await b.close()}
