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
  for(const locale of ['en','nl']) {
   await context.addCookies([{name:'movrr-partner-locale',value:JSON.stringify({actor:'00000000-0000-4000-8000-000000000001',locale}),domain:'127.0.0.1',path:'/dashboard'}]);
   for(const [name,route] of [['home','/dashboard'],['activity','/dashboard/collections'],['history','/dashboard/collections?view=history'],['rewards','/dashboard/rewards'],['account','/dashboard/more'],['handover','/dashboard/collections/visual-validated'],['closed','/dashboard/collections/visual-completed']]) {
    await page.goto(origin+route,{waitUntil:'networkidle'});await page.locator('[data-presentation=mobile]').waitFor();await page.addStyleTag({content:'nextjs-portal{display:none!important}'});
    check(`${size.width} ${locale} ${name}: populated screen fits`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    if(size.width===414&&locale==='en')await page.screenshot({path:path.join(out,`${name}-populated.png`)});
   }
   await page.goto(origin+'/dashboard/rewards',{waitUntil:'networkidle'});
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
