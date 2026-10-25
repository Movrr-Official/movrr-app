import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.MOVRR_PLAYWRIGHT_MODULE);
const fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
const out='.tmp/partner-header-20261025/captures';fs.mkdirSync(out,{recursive:true});
const css=fs.readdirSync('.next/static/chunks').filter(f=>f.endsWith('.css')).map(f=>fs.readFileSync('.next/static/chunks/'+f,'utf8')).join('\n');
const face=[...css.matchAll(/@font-face\{[^}]*font-family:Manrope;[^}]*\}/g)].at(-1)[0],fontFile=face.match(/src:url\(\.\.\/media\/([^)]*)\)/)[1],font=fs.readFileSync('.next/static/media/'+fontFile);
const fontCSS=`@font-face{font-family:MOVRRVisualManrope;src:url(data:font/woff2;base64,${font.toString('base64')}) format('woff2');font-weight:200 800;font-display:block}html{--font-manrope:MOVRRVisualManrope!important}nextjs-portal{display:none!important}`;
const browser=await chromium.launch({headless:true}),results=[];
try {for(const stage of ['before','after'])for(const [size,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'}),page=await context.newPage();
await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
const base=`http://127.0.0.1:${stage==='before'?3317:3318}`;
await page.goto(base+'/dashboard/rewards/create');await page.addStyleTag({content:fontCSS});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(400);
await page.screenshot({path:`${out}/${stage}-create-${size}.png`,fullPage:size!=="mobile"});
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
if(stage==='after'){
const file=page.locator('input[type=file]');
await file.setInputFiles({name:'reward.png',mimeType:'image/png',buffer:fs.readFileSync('public/movrr-icon-mark.png')});
await page.locator('img[alt="Reward image"]').waitFor();
await page.screenshot({path:`${out}/after-create-preview-${size}.png`,fullPage:size!=="mobile"});
if(size==='mobile'){await page.getByRole('button',{name:'Create item',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/after-create-actions-mobile.png`});await page.evaluate(()=>scrollTo(0,0));}
await page.getByRole('button',{name:'Remove image',exact:true}).click();assert.equal(await file.evaluate(e=>e.files.length),0);assert.equal(await page.locator('input[name=removeImage]').inputValue(),'true');
await file.setInputFiles({name:'invalid.txt',mimeType:'text/plain',buffer:Buffer.from('invalid')});await page.getByRole('alert').filter({hasText:'Choose a valid'}).waitFor();assert.equal(await file.evaluate(e=>e.files.length),0);
await page.goto(base+'/dashboard/rewards/00000000-0000-4000-8000-000000000003/edit');await page.addStyleTag({content:fontCSS});await page.getByRole('button',{name:'Replace image',exact:true}).waitFor();
await page.screenshot({path:`${out}/after-edit-${size}.png`,fullPage:size!=="mobile"});
await page.getByRole('button',{name:'Remove image',exact:true}).click();assert.equal(await page.locator('input[name=removeImage]').inputValue(),'true');
await page.goto(base+'/dashboard/rewards');await page.addStyleTag({content:fontCSS});await page.screenshot({path:`${out}/after-rewards-${size}.png`,fullPage:size!=="mobile"});
const language=page.getByRole('button',{name:'Language: English',exact:true});await language.click();await page.getByRole('button',{name:'Nederlands',exact:true}).waitFor();await page.screenshot({path:`${out}/after-language-${size}.png`});
await page.mouse.click(width-16,220);await page.getByRole('button',{name:'Nederlands',exact:true}).waitFor({state:'hidden'});
await language.click();await page.getByRole('button',{name:'Nederlands',exact:true}).waitFor();await page.keyboard.press('Escape');await page.getByRole('button',{name:'Nederlands',exact:true}).waitFor({state:'hidden'});await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='Language: English');
await page.getByRole('button',{name:'Notifications',exact:true}).click();await page.getByText("You're all caught up",{exact:true}).waitFor();await page.screenshot({path:`${out}/after-notifications-${size}.png`});
await page.getByRole('link',{name:'View all notifications',exact:true}).click();await page.waitForURL('**/dashboard/notifications');
await context.addCookies([{name:'movrr-partner-locale',value:JSON.stringify({actor:'00000000-0000-4000-8000-000000000001',locale:'nl'}),url:base}]);
await page.goto(base+'/dashboard/rewards/create');await page.addStyleTag({content:fontCSS});await page.getByText('Afbeelding van de beloning',{exact:true}).waitFor();await page.screenshot({path:`${out}/after-create-nl-${size}.png`,fullPage:size!=="mobile"});
await page.addScriptTag({path:process.env.MOVRR_AXE_SCRIPT}); const violations=await page.evaluate(async()=> (await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[]);
results.push({stage,size,uploadPreview:true,remove:true,invalidType:true,editExistingImage:true,languageOutsideEscape:true,notificationsEmptyViewAll:true,dutch:true,axeViolations:violations});
}else results.push({stage,size,overflow:false});
await context.close();}
fs.writeFileSync(out+'/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
