import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const { chromium }=createRequire(import.meta.url)(process.env.MOVRR_PLAYWRIGHT_MODULE);
const origin=process.env.MOVRR_PARTNER_VISUAL_AFTER ?? 'http://127.0.0.1:3402';
if(!['127.0.0.1','localhost'].includes(new URL(origin).hostname))throw Error('Local isolated fixtures only');
const out=path.resolve(process.env.MOVRR_PARTNER_VISUAL_OUT ?? '.tmp/partner-mobile-finish-20261027/evidence');fs.mkdirSync(out,{recursive:true});
const checks=[],errors=[];const check=(name,value)=>{assert.ok(value,name);checks.push(name)};
const browser=await chromium.launch({headless:true});
try {
 for(const size of [{width:320,height:740},{width:414,height:896},{width:412,height:915}]) {
  const context=await browser.newContext({viewport:size,isMobile:true,hasTouch:true,reducedMotion:'reduce'}),page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  await context.route('https://partner-image.visual.invalid/catalog.svg',route=>route.fulfill({contentType:'image/svg+xml',body:fs.readFileSync('__tests__/fixtures/partner-catalog-image.svg','utf8')}));
  let posts=0;page.on('request',request=>{if(request.method()==='POST')posts++;});
  const go=async route=>{await page.goto(origin+route,{waitUntil:'networkidle'});await page.addStyleTag({content:'nextjs-portal{display:none!important}'});};
  const shot=async name=>{if(size.width===414)await page.screenshot({path:path.join(out,name+'.png')});};
  for(const locale of ['en','nl']) {
   const nl=locale==='nl', label=(en,dutch)=>nl?dutch:en;
   await context.addCookies([{name:'movrr-partner-locale',value:JSON.stringify({actor:'00000000-0000-4000-8000-000000000001',locale}),domain:'127.0.0.1',path:'/dashboard'}]);
   for(const [name,route] of [['home','/dashboard'],['activity','/dashboard/collections'],['history','/dashboard/collections?view=history'],['rewards','/dashboard/rewards'],['account','/dashboard/more'],['handover','/dashboard/collections/visual-validated'],['recorded','/dashboard/collections/visual-completed'],['inventory','/dashboard/resources'],['editor','/dashboard/rewards/create']]) {
    await go(route);
    check(`${size.width} ${locale} ${name}: one heading, no overflow, no reduced-motion movement`,await page.locator('h1:visible').count()===1&&await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&[...document.querySelectorAll('.partner-app-content,.partner-app-content>*')].every(el=>getComputedStyle(el).animationName==='none')));
    if(!nl)await shot(name+'-finish');
   }
   await go('/dashboard/rewards');
   check(`${size.width} ${locale}: tab selection uses one calm surface`,await page.locator('.partner-tab.is-active').evaluate(el=>getComputedStyle(el,'::before').display==='none'&&getComputedStyle(el.querySelector('span')).backgroundColor!=='rgba(0, 0, 0, 0)'));
   check(`${size.width} ${locale}: branded image fallbacks are decorative`,await page.locator('.partner-catalog-placeholder').count()===2&&await page.locator('.partner-catalog-placeholder').first().evaluate(el=>el.closest('[aria-hidden=true]')!==null));
   check(`${size.width} ${locale}: reward states stay unboxed`,await page.locator('.partner-catalog-state span').evaluateAll(els=>els.every(el=>getComputedStyle(el).borderTopWidth==='0px')));

   await page.locator('.partner-reward-fab').click();await page.waitForURL('**/dashboard/rewards/create');
   const title=page.getByRole('textbox',{name:label('Title','Titel'),exact:true}),points=page.getByRole('spinbutton',{name:label('Points cost','Prijs in MOVRR Punten'),exact:true});
   const form=page.locator('.partner-mobile-form');
   const initialPosts=posts;
   await form.evaluate(el=>el.requestSubmit());
   await page.locator('.partner-form-error-summary').waitFor();
   check(`${size.width} ${locale}: invalid editor never submits`,posts===initialPosts&&await title.getAttribute('aria-invalid')==='true'&&await points.getAttribute('aria-invalid')==='true');
   await title.fill('Local presentation draft');await title.press('Enter');
   check(`${size.width} ${locale}: Enter progresses to Description`,await page.locator('textarea[name=description]').evaluate(el=>el===document.activeElement));
   await points.fill('20');
   check(`${size.width} ${locale}: corrected fields clear errors and use numeric keyboard`,await title.getAttribute('aria-invalid')===null&&await points.getAttribute('aria-invalid')===null&&await points.getAttribute('inputmode')==='numeric');
   check(`${size.width} ${locale}: dirty history has no private form values`,await page.evaluate(()=>!!history.state.movrrPartnerEditor&&!JSON.stringify(history.state).includes('Local presentation draft')));
   await page.getByRole('link',{name:label('Back','Terug'),exact:true}).click();await page.getByRole('dialog').waitFor();
   if(!nl)await shot('unsaved-finish');
   await page.keyboard.press('Escape');
   check(`${size.width} ${locale}: Escape dismisses unsaved sheet and keeps values`,!await page.getByRole('dialog').isVisible()&&await title.inputValue()==='Local presentation draft');
   await page.goBack();await page.getByRole('dialog').waitFor();
   check(`${size.width} ${locale}: Back protects an unsaved editor`,new URL(page.url()).pathname==='/dashboard/rewards/create');
   await page.getByRole('button',{name:label('Keep editing','Verder bewerken'),exact:true}).click();
   await page.getByRole('link',{name:label('Account','Account'),exact:true}).click();await page.getByRole('dialog').waitFor();
   await page.goBack();await page.getByRole('dialog').waitFor({state:'hidden'});
   check(`${size.width} ${locale}: Back dismisses a pending leave sheet`,new URL(page.url()).pathname==='/dashboard/rewards/create'&&await title.inputValue()==='Local presentation draft');
   await page.getByRole('link',{name:label('Back','Terug'),exact:true}).click();await page.getByRole('dialog').waitFor();
   await page.getByRole('button',{name:label('Discard changes','Wijzigingen verwerpen'),exact:true}).click();await page.waitForURL('**/dashboard/rewards');
   check(`${size.width} ${locale}: confirmed leave returns to the canonical catalog`,await page.locator('.partner-tab[aria-current=page]').getAttribute('href')==='/dashboard/rewards');

   await page.locator('.partner-reward-fab').click();await page.waitForURL('**/dashboard/rewards/create');
   await title.fill('Local submission fixture');await points.fill('20');
   const beforeSubmit=posts;
   await form.locator('button[type=submit]').click();await page.waitForURL('**/dashboard/rewards/create?error=*');
   check(`${size.width} ${locale}: one original server action; isolated transport rejects mutation`,posts===beforeSubmit+1&&await page.locator('#form-feedback[role=alert]').isVisible()&&await page.evaluate(()=>!history.state?.movrrPartnerEditor));

   await go('/dashboard/resources');
   const codes=page.getByRole('textbox',{name:label('Voucher codes','Vouchercodes'),exact:true});await codes.fill('LOCAL-TEST-CODE');
   check(`${size.width} ${locale}: voucher import gets private keyboard affordances`,await codes.getAttribute('autocomplete')==='off'&&await codes.getAttribute('spellcheck')==='false');
   await page.getByRole('link',{name:label('Back','Terug'),exact:true}).click();await page.getByRole('dialog').waitFor();
   await page.getByRole('button',{name:label('Keep editing','Verder bewerken'),exact:true}).click();
   check(`${size.width} ${locale}: unsaved inventory stays intact`,await codes.inputValue()==='LOCAL-TEST-CODE');

   // A full navigation intentionally resets the isolated test editor; accept only the browser's unload prompt.
   page.once('dialog',dialog=>dialog.accept());await go('/dashboard/collections/visual-validated');
   check(`${size.width} ${locale}: secondary cancellation is collapsed, handover remains explicit`,await page.locator('.partner-collection-secondary').getAttribute('open')===null&&await page.locator('input[type=checkbox][required]').isVisible());
   await page.locator('.partner-collection-secondary summary').click();
   check(`${size.width} ${locale}: cancellation reveals its original reason field`,await page.locator('.partner-collection-secondary input[name=reason]').isVisible());
   await go('/dashboard/collections/visual-completed');
   check(`${size.width} ${locale}: recorded collection has no mutation`,await page.locator('main form').count()===0&&await page.locator('.partner-collection-mobile-status>a').getAttribute('href')==='/dashboard/collections');

   await go('/dashboard/validate');
   await page.locator('summary').click();await page.locator('input[name=token]').fill('local-test-token-'.repeat(4));
   // Delay only the local test request to observe the real pending UI.
   await page.route('**/dashboard/validate',async route=>{if(route.request().method()==='POST')await new Promise(resolve=>setTimeout(resolve,500));await route.continue();});
   await page.getByRole('button',{name:label('Validate reward','Beloning controleren'),exact:true}).click();
   await page.locator('.partner-scan-checking').waitFor();
   check(`${size.width} ${locale}: pending validation is explicit and noninteractive`,await page.locator('.partner-camera').getAttribute('aria-busy')==='true'&&await page.getByRole('button',{name:label('Start camera','Camera starten'),exact:true}).isDisabled());
   await page.locator('.partner-scan-result[data-outcome=invalid]').waitFor();
   check(`${size.width} ${locale}: isolated not-found produces canonical invalid, never a local success`,await page.locator('.partner-scan-result[data-outcome=validated]').count()===0&&await page.locator('.partner-scan-result').evaluate(el=>el===document.activeElement));
   if(!nl)await shot('scan-result-finish');
   await page.unroute('**/dashboard/validate');
  }
  await context.close();
 }
 const desktop=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await desktop.newPage();
 const beforeOrigin=process.env.MOVRR_PARTNER_VISUAL_BEFORE ?? 'http://127.0.0.1:3401';
 if(!['127.0.0.1','localhost'].includes(new URL(beforeOrigin).hostname))throw Error('Local baseline only');
 for(const [name,route] of [['create','/dashboard/rewards/create'],['edit','/dashboard/rewards/visual-pass/edit'],['inventory','/dashboard/resources'],['handover','/dashboard/collections/visual-validated'],['recorded','/dashboard/collections/visual-completed']]) {
  const captures=[];
  for(const base of [beforeOrigin,origin]) {await page.goto(base+route,{waitUntil:'networkidle'});await page.addStyleTag({content:'nextjs-portal{display:none!important}'});await page.evaluate(()=>document.fonts.ready);captures.push(await page.screenshot());}
  check(`desktop ${name}: shared form and collection presentation pixel-identical`,captures[0].equals(captures[1]));
  check(`desktop ${name}: mobile editing hooks absent`,await page.locator('.partner-mobile-form,dialog.partner-leave-sheet,.partner-collection-mobile-status').count()===0);
 }
 await desktop.close();
 check('no runtime errors',errors.length===0);
 fs.writeFileSync(path.join(out,'finish-results.json'),JSON.stringify({production:false,physicalDevices:false,mutationTransport:'always rejects; no records written',checks,errors},null,2));console.log(JSON.stringify({checks:checks.length,errors}));
}finally{await browser.close();}
