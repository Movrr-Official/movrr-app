import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.MOVRR_PLAYWRIGHT_MODULE);
const out = path.resolve(process.env.MOVRR_PARTNER_VISUAL_OUT ?? '.tmp/partner-mobile-app-20261025/evidence');
const beforeOrigin = process.env.MOVRR_PARTNER_VISUAL_BEFORE ?? 'http://127.0.0.1:3341';
const afterOrigin = process.env.MOVRR_PARTNER_VISUAL_AFTER ?? 'http://127.0.0.1:3342';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const checks = [], matrix = [], errors = [];
const check = (name, value) => { assert.ok(value, name); checks.push(name); };
const routes = [['home','/dashboard'],['scan','/dashboard/validate'],['activity','/dashboard/collections'],['history','/dashboard/collections?view=history'],['rewards','/dashboard/rewards'],['account','/dashboard/more'],['inventory','/dashboard/resources'],['staff','/dashboard/staff'],['settings','/dashboard/settings'],['notifications','/dashboard/notifications'],['create','/dashboard/rewards/create']];
async function go(page, origin, route) {
  const response = await page.goto(origin + route, { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200, route);
  await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
  await page.evaluate(() => document.fonts.ready);
}
try {
  for (const size of [{ name:'narrow',width:320,height:740 },{ name:'iphone-xr',width:414,height:896 },{ name:'s23-ultra',width:412,height:915 }]) {
    const context = await browser.newContext({ viewport:{ width:size.width,height:size.height },isMobile:true,hasTouch:true,reducedMotion:'reduce' });
    const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
    for (const locale of ['en','nl']) {
      await context.addCookies([{ name:'movrr-partner-locale',value:JSON.stringify({ actor:'00000000-0000-4000-8000-000000000001',locale }),domain:'127.0.0.1',path:'/dashboard' }]);
      for (const [name,route] of routes) {
        await go(page,afterOrigin,route);
        await page.locator('[data-presentation=mobile]').waitFor();
        const result = await page.evaluate(() => ({ overflow:document.documentElement.scrollWidth>innerWidth+1,rail:!!document.querySelector('.partner-rail'),lang:document.querySelector('.partner-workspace').lang,active:document.querySelector('.partner-app-tabs [aria-current=page]')?.getAttribute('href'),targets:[...document.querySelectorAll('.partner-app-tabs a')].map(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})),animation:getComputedStyle(document.querySelector('main')).animationName }));
        check(`${size.name} ${locale} ${name}: mobile composition, language, targets, reduced motion`, !result.overflow&&!result.rail&&result.lang===locale&&result.targets.every(r=>r.width>=44&&r.height>=44)&&result.animation==='none');
        const { targets, ...composition } = result;
        matrix.push({ device:size.name,locale,route,...composition,minimumTabWidth:Math.min(...targets.map(target=>target.width)),minimumTabHeight:Math.min(...targets.map(target=>target.height)) });
        if (size.name==='iphone-xr' && ['home','scan','activity','rewards','account'].includes(name)) await page.screenshot({ path:path.join(out,`${name}-${locale}.png`) });
      }
    }
    await context.clearCookies();
    await go(page,afterOrigin,'/dashboard');
    const bellPresentation = await page.locator('header').getByRole('button',{name:'Notifications',exact:true}).evaluate(button=>{const style=getComputedStyle(button),rect=button.getBoundingClientRect();return {background:style.backgroundColor,border:style.borderTopWidth,width:rect.width,height:rect.height}});
    check(`${size.name}: unboxed bell retains a 44px touch target`,bellPresentation.background==='rgba(0, 0, 0, 0)'&&bellPresentation.border==='0px'&&bellPresentation.width>=44&&bellPresentation.height>=44);
    await page.getByRole('link',{name:'Account',exact:true}).click(); await page.waitForURL('**/dashboard/more');
    check(`${size.name}: route transition focuses main content`,await page.locator('main').evaluate(el=>el===document.activeElement));
    await page.goBack(); await page.waitForURL('**/dashboard'); check(`${size.name}: browser Back restores Home`,true);
    check(`${size.name}: header keeps language in Account`,await page.locator('header').getByRole('button',{name:'Language: English',exact:true}).count()===0);
    await go(page,afterOrigin,'/dashboard/more');
    await page.getByRole('button',{name:'Language: English',exact:true}).click();
    await page.getByRole('button',{name:'Nederlands',exact:true}).waitFor();
    const sheet = await page.getByRole('dialog').boundingBox();
    check(`${size.name}: Account language is a bottom sheet`,sheet&&Math.abs(sheet.y+sheet.height-size.height)<2&&sheet.width===size.width);
    await page.getByRole('button',{name:'Close',exact:true}).click();
    await page.getByRole('button',{name:'Nederlands',exact:true}).waitFor({state:'hidden'});
    await page.getByRole('button',{name:'Language: English',exact:true}).click(); await page.goBack();
    await page.getByRole('button',{name:'Nederlands',exact:true}).waitFor({state:'hidden'}); check(`${size.name}: Back dismisses language overlay`,new URL(page.url()).pathname==='/dashboard/more');
    await go(page,afterOrigin,'/dashboard/rewards/create');
    check(`${size.name}: nested rewards tab and Back target`,await page.locator('.partner-app-tabs [aria-current=page]').getAttribute('href')==='/dashboard/rewards'&&await page.getByRole('link',{name:'Back',exact:true}).getAttribute('href')==='/dashboard/rewards');
    await go(page,afterOrigin,'/dashboard/more');
    check(`${size.name}: workspace switching retains canonical endpoint`,await page.getByRole('link',{name:'Switch workspace',exact:true}).getAttribute('href')==='/workspaces?lang=en');
    check(`${size.name}: signout retains canonical endpoint`,await page.locator('form[action="/api/auth/signout"]').count()===1);
    await go(page,afterOrigin,'/dashboard/validate');
    await page.getByRole('button',{name:'Start camera',exact:true}).click();
    await page.getByRole('alert').filter({hasText:'Camera unavailable'}).waitFor(); check(`${size.name}: camera denial offers fallback`,await page.getByText('Enter a code instead',{exact:true}).isVisible());
    await page.evaluate(()=>navigator.serviceWorker.ready);
    await context.setOffline(true);
    check(`${size.name}: camera disabled offline`,await page.getByRole('button',{name:'Start camera',exact:true}).isDisabled());
    await page.goto(afterOrigin+'/dashboard/validate?token=never-retain',{waitUntil:'domcontentloaded'});
    await page.locator('#retry').waitFor();
    const cached = await page.evaluate(async()=>{const paths=[];for(const key of await caches.keys())for(const request of await(await caches.open(key)).keys())paths.push(new URL(request.url).pathname);return paths;});
    check(`${size.name}: offline cache is public only`,cached.length===3&&cached.every(value=>['/offline.html','/fonts/jakarta-400.ttf','/fonts/lexend-700.ttf'].includes(value)));
    check(`${size.name}: offline retry drops secrets and offers no mutations`,await page.locator('#retry').getAttribute('href')==='/dashboard/validate'&&await page.locator('form').count()===0);
    await context.setOffline(false); await page.locator('#retry').click(); await page.waitForURL('**/dashboard/validate'); check(`${size.name}: reconnect returns to Scan`,true);
    await context.close();
  }
  const desktop = await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'}), page=await desktop.newPage();
  for (const [name,route] of routes.filter(([name])=>['home','scan','rewards'].includes(name))) {
    await go(page,beforeOrigin,route); const before = await page.screenshot({path:path.join(out,`desktop-${name}-before.png`)});
    await go(page,afterOrigin,route); const after = await page.screenshot({path:path.join(out,`desktop-${name}-after.png`)});
    check(`desktop ${name}: pixel-identical baseline`,before.equals(after));
    check(`desktop ${name}: original shell`,await page.locator('.partner-rail').isVisible()&&await page.locator('[data-presentation=mobile]').count()===0);
  }
  await go(page,afterOrigin,'/dashboard/validate');
  check('desktop scanner has handoff and no camera',await page.locator('video').count()===0&&await page.getByText('Continue on your phone',{exact:true}).isVisible());
  const manifest = await (await page.request.get(afterOrigin+'/partner/manifest.webmanifest')).json();
  check('served Partner installation manifest',manifest.name==='MOVRR Partner'&&manifest.display==='standalone'&&manifest.start_url==='/dashboard');
  await desktop.close();
  const installationBrowser = await browser.newContext({viewport:{width:414,height:896},isMobile:true,hasTouch:true});
  const installPage = await installationBrowser.newPage();
  await go(installPage,afterOrigin,'/dashboard');
  await installPage.evaluate(()=>{
    window.partnerTestInstallCalls=0;
    const event=new Event('beforeinstallprompt',{cancelable:true});
    event.prompt=async()=>{window.partnerTestInstallCalls++};event.userChoice=Promise.resolve({outcome:'dismissed'});
    window.dispatchEvent(event);
  });
  await installPage.getByRole('link',{name:'Account',exact:true}).click();await installPage.waitForURL('**/dashboard/more');
  await installPage.getByRole('button',{name:'Install MOVRR Partner',exact:true}).click();
  check('installation prompt received on Home remains available in Account',await installPage.evaluate(()=>window.partnerTestInstallCalls)===1);
  await installationBrowser.close();
  const installed = await browser.newContext({viewport:{width:414,height:896},isMobile:true,hasTouch:true});
  await installed.addInitScript(()=>{const original=window.matchMedia.bind(window);window.matchMedia=query=>{const media=original(query);return query==='(display-mode: standalone)'?new Proxy(media,{get(target,key){if(key==='matches')return true;const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}}):media;};});
  const app = await installed.newPage();await go(app,afterOrigin,'/dashboard');
  check('simulated standalone retains mobile app and hides install control',await app.locator('[data-presentation=mobile]').count()===1&&await app.getByRole('button',{name:'Install MOVRR Partner',exact:true}).count()===0);
  await app.evaluate(()=>localStorage.setItem('theme','dark'));
  for(const [name,route] of routes.filter(([name])=>['home','scan','account'].includes(name))) {
    await go(app,afterOrigin,route);
    check(`dark ${name}: mobile composition fits`,await app.evaluate(()=>document.documentElement.classList.contains('dark')&&document.documentElement.scrollWidth<=innerWidth+1));
    await app.screenshot({path:path.join(out,`${name}-dark.png`)});
  }
  await go(app,afterOrigin,'/dashboard/rewards/create');
  await app.evaluate(()=>document.documentElement.style.fontSize='200%');
  check('200% text scaling fits mobile editor',await app.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await app.evaluate(()=>document.documentElement.style.fontSize='');
  const titleInput=app.getByLabel('Title',{exact:true});await titleInput.focus();
  await app.evaluate(()=>{Object.defineProperty(visualViewport,'height',{configurable:true,value:300});visualViewport.dispatchEvent(new Event('resize'));});
  check('simulated software keyboard hides bottom tabs',!await app.locator('.partner-app-tabs').isVisible());
  await titleInput.blur();check('keyboard dismissal restores bottom tabs',await app.locator('.partner-app-tabs').isVisible());
  await go(app,afterOrigin,'/dashboard');
  await app.getByRole('button',{name:'Notifications',exact:true}).click();
  await app.getByRole('link',{name:'View all notifications',exact:true}).click();await app.waitForURL('**/dashboard/notifications');
  await app.goBack();await app.waitForURL('**/dashboard');check('notification deep link retains return path',true);
  await installed.close();check('no browser runtime errors',errors.length===0);
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({production:false,physicalDevices:false,emptyReadModels:true,checks,matrix,errors},null,2));
  console.log(JSON.stringify({checks:checks.length,renders:matrix.length,errors}));
} catch(error) { fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({message:error.message,checks,matrix,errors},null,2));throw error; }
finally { await browser.close(); }
