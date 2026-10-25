import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.MOVRR_PLAYWRIGHT_MODULE);
const css=fs.readdirSync('.next/static/chunks').filter(f=>f.endsWith('.css')).map(f=>fs.readFileSync('.next/static/chunks/'+f,'utf8')).join('\n');const face=[...css.matchAll(/@font-face\{[^}]*font-family:Manrope;[^}]*\}/g)].at(-1)[0],fontFile=face.match(/src:url\(\.\.\/media\/([^)]*)\)/)[1],font=fs.readFileSync('.next/static/media/'+fontFile);const fontCSS=`@font-face{font-family:MOVRRVisualManrope;src:url(data:font/woff2;base64,${font.toString('base64')}) format('woff2');font-weight:200 800;font-style:normal;font-display:block;}html{--font-manrope:MOVRRVisualManrope!important}nextjs-portal{display:none!important}`;
const out=path.resolve('.tmp/partner-footer-20261025/captures');fs.mkdirSync(out,{recursive:true});
const results=[];
const browser=await chromium.launch({headless:true});
try {
for(const stage of ['before','after'])for(const [size,width,height] of [['desktop',1440,1000],['mobile',390,844]])for(const [slug,route]of [['collections','/dashboard/collections'],['fields','/dashboard/rewards/create'],['inventory','/dashboard/resources'],['workspaces','/workspaces']]){
 const context=await browser.newContext({viewport:{width,height},isMobile:size==='mobile',hasTouch:size==='mobile',reducedMotion:'reduce'});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>['127.0.0.1','localhost'].includes(new URL(r.request().url()).hostname)||r.request().url().startsWith('data:')?r.continue():r.abort());
 const response=await page.goto(`http://127.0.0.1:${stage==='before'?3317:3318}${route}`,{waitUntil:'networkidle',timeout:90000});
 await page.addStyleTag({content:fontCSS});await page.evaluate(()=>document.fonts.ready);
 assert.equal(response.status(),200);assert.deepEqual(errors,[]);
 const metrics=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,documentHeight:document.documentElement.scrollHeight,viewport:innerHeight,footer:(()=>{const e=document.querySelector('.partner-footer,.workspace-picker-footer');const r=e?.getBoundingClientRect();return {visible:e&&getComputedStyle(e).display!=='none',top:r?.top,bottom:r?.bottom};})(),fields:[...document.querySelectorAll('main [data-slot="input"],main [data-slot="textarea"],main [data-slot="select-trigger"]')].map(e=>{const s=getComputedStyle(e);return {slot:e.dataset.slot,height:e.getBoundingClientRect().height,radius:s.borderRadius,font:s.fontSize,border:s.borderColor,background:s.backgroundColor};})}));
 assert(!metrics.overflow);
 if(stage==='after'&&slug==='collections'&&size==='desktop')assert(Math.abs(metrics.footer.bottom-height)<2);
 if(stage==='after'&&slug==='collections'&&size==='mobile')assert(!metrics.footer.visible);
 if(stage==='after'&&slug==='inventory'){
  await page.waitForFunction(()=>document.querySelectorAll('main img').length===1);const images=page.locator('main img');assert.equal(await images.count(),1);
  assert.equal(await images.first().evaluate(e=>e.complete&&e.naturalWidth>0),true);
  assert.equal(await page.locator('main [aria-hidden="true"] svg.lucide-image').count(),2);
  const select=page.getByRole('combobox',{name:'Voucher pool'});await select.click();
  await page.getByRole('option',{name:'Visual fixture without image'}).click();
  assert.equal(await page.locator('form').filter({has:select}).evaluate(f=>new FormData(f).get('resourceId')),'fixture-no-image');
 }
 let violations=[];
 if(stage==='after'){
  await page.addScriptTag({path:process.env.MOVRR_AXE_SCRIPT});
  violations=await page.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));
  assert.deepEqual(violations,[]);
 }
 await page.evaluate(()=>{document.activeElement?.blur();window.scrollTo(0,0)});await page.evaluate(()=>new Promise(requestAnimationFrame));
 await page.screenshot({path:path.join(out,`${stage}-${slug}-${size}.png`),fullPage:size!=='mobile'});
 if(stage==='after'&&slug==='fields'){
  const select=page.getByRole('combobox',{name:'Status'});await select.focus();await page.keyboard.press('ArrowDown');
  await page.getByRole('option',{name:'Draft',exact:true}).waitFor();
  await page.screenshot({path:path.join(out,`after-fields-menu-${size}.png`),fullPage:size!=='mobile'});await page.keyboard.press('Escape');assert.equal(await select.evaluate(e=>e===document.activeElement),true);
  await page.evaluate(()=>{document.documentElement.classList.add('dark');const i=document.querySelector('main input[name=title]');i.setAttribute('aria-invalid','true');document.querySelector('main input[name=sku]').disabled=true;});
  await page.screenshot({path:path.join(out,`after-fields-dark-${size}.png`),fullPage:size!=='mobile'});
 }
 results.push({stage,slug,size,status:response.status(),metrics,errors,violations});console.log(stage,slug,size,'passed');await context.close();
}
// Short tall/compact and tablet layouts; long forms keep the footer in document flow.
for(const [width,height]of [[1920,1080],[1440,650],[820,1180]]){
 const page=await browser.newPage({viewport:{width,height}});await page.goto('http://127.0.0.1:3318/dashboard/collections',{waitUntil:'networkidle'});
 const metrics=await page.evaluate(()=>({footerBottom:document.querySelector('.partner-footer').getBoundingClientRect().bottom,visible:getComputedStyle(document.querySelector('.partner-footer')).display!=='none',overflow:document.documentElement.scrollWidth>innerWidth}));assert(!metrics.overflow);if(width>=1024)assert(Math.abs(metrics.footerBottom-height)<2);else assert(!metrics.visible);results.push({width,height,metrics});await page.close();
}
{
 const page=await browser.newPage({viewport:{width:1440,height:650}});await page.goto('http://127.0.0.1:3318/dashboard/rewards/create',{waitUntil:'networkidle'});
 const m=await page.evaluate(()=>({documentHeight:document.documentElement.scrollHeight,viewport:innerHeight,footer:document.querySelector('.partner-footer').getBoundingClientRect().top,formBottom:document.querySelector('main form').getBoundingClientRect().bottom}));assert(m.documentHeight>m.viewport);assert(m.footer>m.formBottom);results.push({longForm:m});await page.close();
}
{
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,reducedMotion:'reduce'});
 await context.addCookies([{name:'movrr-partner-locale',value:JSON.stringify({actor:'00000000-0000-4000-8000-000000000001',locale:'nl'}),url:'http://127.0.0.1:3318'}]);
 const page=await context.newPage();await page.goto('http://127.0.0.1:3318/workspaces?lang=nl',{waitUntil:'networkidle'});await page.addStyleTag({content:fontCSS});await page.getByRole('heading',{name:'Kies je werkruimte'}).waitFor();
 await page.screenshot({path:path.join(out,'after-workspaces-mobile-nl.png'),fullPage:true});await page.evaluate(()=>document.documentElement.classList.add('dark'));await page.addScriptTag({path:process.env.MOVRR_AXE_SCRIPT});const violations=await page.evaluate(async()=>(await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id));assert.deepEqual(violations,[]);results.push({dutchWorkspace:true,darkWorkspaceAxeViolations:0});await context.close();
}
fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({production:false,physicalDevice:false,boundaries:'Actual routes, components and form actions; isolated account, inventory and membership read fixtures. All business commands rejected. Fixture images are layout samples, not merchant supply.',fontSha256:crypto.createHash('sha256').update(font).digest('hex'),results},null,2));
}finally{await browser.close();}
