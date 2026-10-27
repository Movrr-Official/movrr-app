import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)(process.env.MOVRR_PLAYWRIGHT_MODULE);
const origin=process.env.MOVRR_PARTNER_LOADING_ORIGIN ?? "http://127.0.0.1:3383";
if(!["127.0.0.1","localhost"].includes(new URL(origin).hostname))throw Error("Delayed verification is local-only");
const out=path.resolve(process.env.MOVRR_PARTNER_VISUAL_OUT ?? ".tmp/partner-mobile-loading-20261027/evidence");fs.mkdirSync(out,{recursive:true});
const routes=[["home","/dashboard"],["activity","/dashboard/collections"],["scan","/dashboard/validate"],["rewards","/dashboard/rewards"],["account","/dashboard/more"],["inventory","/dashboard/resources"],["team","/dashboard/staff"],["settings","/dashboard/settings"],["performance","/dashboard/analytics"],["notifications","/dashboard/notifications"],["collection","/dashboard/collections/visual-validated"],["reward-create","/dashboard/rewards/create"],["reward-edit","/dashboard/rewards/visual-pass/edit"]];
const checks=[],errors=[];const check=(name,value)=>{assert.ok(value,name);checks.push(name)};
const browser=await chromium.launch({headless:true});
try {
 // Compile and warm public chunks before measuring the delayed read itself.
 const warm=await browser.newContext();
 for(const [,route] of routes) {const r=await warm.request.get(origin+route);assert.equal(r.status(),200,route);}
 await warm.close();console.log("Prepared 13 actual Next route boundaries");
 for(const size of [{width:320,height:740},{width:414,height:896},{width:412,height:915}]) {
  const context=await browser.newContext({viewport:size,isMobile:true,hasTouch:true,reducedMotion:"reduce"});
  await context.route("https://partner-image.visual.invalid/catalog.svg",route=>route.fulfill({contentType:"image/svg+xml",body:fs.readFileSync("__tests__/fixtures/partner-catalog-image.svg","utf8")}));
  const page=await context.newPage();page.on("pageerror",error=>errors.push(error.message));
  for(const locale of ["en","nl"]) {
   await context.addCookies([{name:"movrr-partner-locale",value:JSON.stringify({actor:"00000000-0000-4000-8000-000000000001",locale}),domain:"127.0.0.1",path:"/dashboard"}]);
   for(const [screen,route] of routes) {
    await page.goto(origin+route,{waitUntil:"commit"});
    const loading=page.locator(`[data-loading-screen="${screen}"]:visible`);await loading.waitFor({state:"visible",timeout:15000});
    await page.addStyleTag({content:"nextjs-portal{display:none!important}"});
    const result=await loading.evaluate(el=>({screen:el.getAttribute("data-loading-screen"),busy:el.getAttribute("aria-busy"),live:el.getAttribute("aria-live"),label:el.querySelector(".sr-only")?.textContent,interactive:el.querySelectorAll("a,button,input,select,textarea,video").length,overflow:document.documentElement.scrollWidth>innerWidth+1,animation:getComputedStyle(el.querySelector('[data-slot="skeleton"]')).animationName}));
    check(`${size.width} ${locale} ${screen}: correct accessible, noninteractive loading composition`,result.screen===screen&&result.busy==="true"&&result.live==="polite"&&result.interactive===0&&!result.overflow&&result.animation==="none");
    check(`${size.width} ${locale} ${screen}: persistent app navigation`,await page.locator(".partner-app-tabs a:visible").count()===5&&await page.locator(".partner-app-header:visible").count()===1);
    if(locale==="nl")check(`${size.width} nl ${screen}: localized announcement`,/laden|voorbereiden/.test(result.label));
    if(size.width===414&&locale==="en")await page.screenshot({path:path.join(out,`${screen}-loading.png`)});
    await loading.waitFor({state:"hidden",timeout:15000});
    check(`${size.width} ${locale} ${screen}: real content replaces retrieval state`,await page.locator("[data-loading-screen]:visible").count()===0&&await page.locator("main h1:visible").count()===1);
    if(size.width===414&&locale==="en")await page.screenshot({path:path.join(out,`${screen}-ready.png`)});
   }
   console.log(JSON.stringify({viewport:size.width,locale,completed:routes.length}));
  }
  // Respect motion changes live, not just at startup.
  await page.emulateMedia({reducedMotion:"no-preference"});
  await page.goto(origin+"/dashboard/rewards",{waitUntil:"commit"});
  const loading=page.locator('[data-loading-screen="rewards"]:visible');await loading.waitFor({state:"visible"});
  check(`${size.width}: shared restrained pulse when motion is allowed`,await loading.locator('[data-slot="skeleton"]').first().evaluate(el=>getComputedStyle(el).animationName==="partner-content-pulse"));
  await page.emulateMedia({reducedMotion:"reduce"});
  check(`${size.width}: live reduced-motion change stops pulse`,await loading.locator('[data-slot="skeleton"]').first().evaluate(el=>getComputedStyle(el).animationName==="none"));
  await context.close();
 }
 check("no loading browser runtime errors",errors.length===0);
 fs.writeFileSync(path.join(out,"loading-results.json"),JSON.stringify({production:false,physicalDevices:false,readDelayMs:3000,delayConfinedToIsolatedCopy:true,fixture:"__tests__/fixtures/partner-mobile-read-models.json",routes:routes.length,renders:78,checks,errors},null,2));
 console.log(JSON.stringify({checks:checks.length,renders:78,errors}));
} finally {await browser.close()}
