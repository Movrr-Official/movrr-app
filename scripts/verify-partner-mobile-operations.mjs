import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.MOVRR_PLAYWRIGHT_MODULE);
const origin=process.env.MOVRR_PARTNER_VISUAL_POPULATED ?? 'http://127.0.0.1:3363';
if(!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Populated fixtures must run locally');
const out=path.resolve(process.env.MOVRR_PARTNER_VISUAL_OUT ?? '.tmp/partner-mobile-operations/evidence');fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[];const check=(name,value)=>{assert.ok(value,name);checks.push(name)};
const browser=await chromium.launch({headless:true});
try {
 for(const size of [{width:320,height:740},{width:414,height:896},{width:412,height:915}]) {
  const context=await browser.newContext({viewport:size,isMobile:true,hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await context.route('https://partner-image.visual.invalid/catalog.svg',route=>route.fulfill({contentType:'image/svg+xml',body:fs.readFileSync('__tests__/fixtures/partner-catalog-image.svg','utf8')}));
  for(const locale of ['en','nl']) {
   await context.addCookies([{name:'movrr-partner-locale',value:JSON.stringify({actor:'00000000-0000-4000-8000-000000000001',locale}),domain:'127.0.0.1',path:'/dashboard'}]);
   for(const [name,route] of [['home','/dashboard'],['activity','/dashboard/collections'],['history','/dashboard/collections?view=history'],['rewards','/dashboard/rewards'],['account','/dashboard/more'],['handover','/dashboard/collections/visual-validated'],['closed','/dashboard/collections/visual-completed']]) {
    await page.goto(origin+route,{waitUntil:'networkidle'});await page.locator('[data-presentation=mobile]').waitFor();await page.addStyleTag({content:'nextjs-portal{display:none!important}'});
    check(`${size.width} ${locale} ${name}: populated screen fits`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    if(name==='account') check(`${size.width} ${locale}: preferences use flat settings rows`,await page.locator('.partner-account-language,.partner-account-install').evaluateAll(nodes=>nodes.length===2&&nodes.every(el=>{const s=getComputedStyle(el);return parseFloat(s.minHeight)>=60&&parseFloat(s.fontSize)>=16&&s.borderRadius==='0px'&&s.boxShadow==='none'&&s.backgroundColor==='rgba(0, 0, 0, 0)';})));
    if(name==='activity') check(`${size.width} ${locale}: status remains readable inside the main entry column`,await page.locator('.partner-activity-copy .partner-activity-status').evaluateAll(nodes=>nodes.length===2&&nodes.every(el=>parseFloat(getComputedStyle(el).fontSize)>=13)));
    if(size.width===414&&locale==='en')await page.screenshot({path:path.join(out,`${name}-populated.png`)});
   }
   await page.goto(origin+'/dashboard/rewards',{waitUntil:'networkidle'});
   check(`${size.width} ${locale}: mobile type and rounded geometry`,await page.evaluate(()=>{
    const style=selector=>getComputedStyle(document.querySelector(selector));
    return parseFloat(style('.partner-app-wordmark').fontSize)>=18&&document.querySelector('.partner-app-wordmark img').getBoundingClientRect().width>=36&&parseFloat(style('.partner-catalog-item').borderTopLeftRadius)>=20&&parseFloat(style('.partner-catalog-search').borderTopLeftRadius)>=16&&parseFloat(style('.partner-square-action').borderTopLeftRadius)>=16&&parseFloat(style('.partner-catalog-copy dd').fontSize)>=15;
   }));
   const image=page.locator('.partner-catalog-image img');
   await image.evaluate(el=>el.decode());
   check(`${size.width} ${locale}: supplied image renders beside honest missing-image fallbacks`,await image.evaluate(el=>el.naturalWidth>0)&&await page.locator('.partner-catalog-image').count()===3&&await page.locator('.partner-catalog-image img').count()===1);
   await page.route('https://partner-image.visual.invalid/catalog.svg',route=>route.abort());
   await page.reload({waitUntil:'networkidle'});
   check(`${size.width} ${locale}: failed image falls back without losing reward name`,await page.locator('.partner-catalog-image img').count()===0&&await page.locator('article').filter({hasText:'Museum pass'}).count()===1);
   await page.unroute('https://partner-image.visual.invalid/catalog.svg');
   const search=page.getByRole('searchbox',{name:locale==='nl'?'Beloningen zoeken':'Search rewards'});await search.fill('museum');
   check(`${size.width} ${locale}: catalog search preserves scoped result`,await page.locator('article').count()===1&&await page.locator('article').innerText().then(t=>t.includes('Museum pass')));
   await search.fill('unmatched');check(`${size.width} ${locale}: catalog has no-match state`,await page.locator('article').count()===0);
   await page.getByRole('button',{name:locale==='nl'?'Zoekopdracht wissen':'Clear search',exact:true}).first().click();check(`${size.width} ${locale}: clearing search restores supplied records`,await page.locator('article').count()===3);
   await page.goto(origin+'/dashboard/collections/visual-validated',{waitUntil:'networkidle'});check(`${size.width} ${locale}: handover requires canonical physical confirmation`,await page.locator('input[type=checkbox][required]').count()===1);
   await page.goto(origin+'/dashboard/collections/visual-completed',{waitUntil:'networkidle'});check(`${size.width} ${locale}: closed collection has no mutation form`,await page.locator('main form').count()===0);
  }
  await context.clearCookies();await context.addCookies([{name:'visual-viewer',value:'1',domain:'127.0.0.1',path:'/'}]);
  await page.goto(origin+'/dashboard/rewards',{waitUntil:'networkidle'});check(`${size.width}: read-only catalog has no edit/create actions`,await page.locator('main a[href*=edit],main a[href*=create]').count()===0);
  await page.goto(origin+'/dashboard/more',{waitUntil:'networkidle'});check(`${size.width}: viewer Account respects established capabilities`,await page.locator('main a[href="/dashboard/resources"],main a[href="/dashboard/staff"]').count()===0&&await page.locator('main a[href="/dashboard/analytics"]').count()===1);
  await context.close();
 }
 check('no populated browser runtime errors',errors.length===0);
 fs.writeFileSync(path.join(out,'operations-results.json'),JSON.stringify({production:false,physicalDevice:false,fixture:'__tests__/fixtures/partner-mobile-read-models.json',commandsExecuted:false,checks,errors},null,2));console.log(JSON.stringify({checks:checks.length,errors}));
}finally{await browser.close()}
