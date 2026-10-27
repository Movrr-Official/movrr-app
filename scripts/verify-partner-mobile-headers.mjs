import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.MOVRR_PLAYWRIGHT_MODULE);
const origin = process.env.MOVRR_PARTNER_VISUAL_AFTER ?? 'http://127.0.0.1:3392';
if (!['127.0.0.1','localhost'].includes(new URL(origin).hostname)) throw Error('Local read fixtures only');
const out = path.resolve(process.env.MOVRR_PARTNER_VISUAL_OUT ?? '.tmp/partner-mobile-header-20261027/evidence');
fs.mkdirSync(out,{recursive:true});
const checks=[], errors=[];
const check=(label,value)=>{assert.ok(value,label);checks.push(label);};
const routes=['','collections','validate','rewards','more','resources','staff','settings','analytics','notifications','collections/visual-validated','rewards/create','rewards/visual-pass/edit'];
const browser=await chromium.launch({headless:true});
try {
 for(const size of [{width:320,height:740},{width:414,height:896},{width:412,height:915}]) {
  const context=await browser.newContext({viewport:size,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  await context.route('https://partner-image.visual.invalid/catalog.svg',route=>route.fulfill({contentType:'image/svg+xml',body:fs.readFileSync('__tests__/fixtures/partner-catalog-image.svg','utf8')}));
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  for(const locale of ['en','nl']) {
   await context.addCookies([{name:'movrr-partner-locale',value:JSON.stringify({actor:'00000000-0000-4000-8000-000000000001',locale}),domain:'127.0.0.1',path:'/dashboard'}]);
   for(const route of routes) {
    await page.goto(origin+'/dashboard'+(route?'/'+route:''),{waitUntil:'networkidle'});
    await page.addStyleTag({content:'nextjs-portal{display:none!important}'});
    check(`${size.width} ${locale} ${route||'home'}: one visible heading in one header`,await page.locator('h1:visible').count()===1&&await page.locator('.partner-app-header h1:visible').count()===1);
    check(`${size.width} ${locale} ${route||'home'}: fits without clipping`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&document.querySelector('.partner-app-header h1').getBoundingClientRect().right<=innerWidth));
    if(route==='validate'||route.includes('/')||['resources','staff','settings','analytics','notifications'].includes(route))check(`${size.width} ${locale} ${route}: no unrelated bell`,await page.locator('.partner-app-header button[aria-label="'+(locale==='nl'?'Meldingen':'Notifications')+'"]').count()===0);
    if(size.width===414&&locale==='en'&&['','collections','validate','rewards','more','rewards/create','collections/visual-validated'].includes(route))await page.screenshot({path:path.join(out,(route||'home').replaceAll('/','-')+'-header.png')});
   }
   await page.goto(origin+'/dashboard/rewards',{waitUntil:'networkidle'});
   const fab=page.locator('.partner-reward-fab');
   const initial=await fab.boundingBox(),tabs=await page.locator('.partner-app-tabs').boundingBox();
   check(`${size.width} ${locale}: labelled 56px FAB clears tabs`,initial.width===56&&initial.height===56&&initial.y+initial.height<=tabs.y-12&&await fab.getAttribute('aria-label')===(locale==='nl'?'Beloning toevoegen':'Add reward'));
   await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
   const scrolled=await fab.boundingBox();
   check(`${size.width} ${locale}: FAB and header remain anchored while scrolling`,Math.abs(initial.y-scrolled.y)<1&&Math.abs((await page.locator('.partner-app-header').boundingBox()).y)<1);
   check(`${size.width} ${locale}: last card scrolls clear of FAB`,(await page.locator('article').last().boundingBox()).y+(await page.locator('article').last().boundingBox()).height<scrolled.y);
   await fab.click();await page.waitForURL('**/dashboard/rewards/create');
   check(`${size.width} ${locale}: create keeps one contextual header`,await page.locator('.partner-app-header h1').innerText()===(locale==='nl'?'Beloning aanmaken':'Create reward')&&await page.locator('.partner-reward-fab').count()===0);
   await page.goBack();await page.waitForURL('**/dashboard/rewards');
   await page.getByRole('searchbox').focus();
   await page.evaluate(()=>{Object.defineProperty(visualViewport,'height',{configurable:true,value:300});visualViewport.dispatchEvent(new Event('resize'));});
   check(`${size.width} ${locale}: keyboard suppresses FAB`,!await fab.isVisible());
   await page.getByRole('searchbox').blur();check(`${size.width} ${locale}: dismissing keyboard restores FAB`,await fab.isVisible());
  }
  await context.close();
 }
 check('no runtime errors',errors.length===0);
 fs.writeFileSync(path.join(out,'header-results.json'),JSON.stringify({production:false,physicalDevices:false,renders:78,checks,errors},null,2));
 console.log(JSON.stringify({checks:checks.length,renders:78,errors}));
} finally {await browser.close();}
