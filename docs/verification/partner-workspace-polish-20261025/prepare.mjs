import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const root = process.cwd(), stage = process.argv[2];
if (!['before','after'].includes(stage)) throw Error('Use before or after from the Partner repository');
const target = path.join(root,'.tmp/partner-footer-20261025',stage);
if (fs.existsSync(target)) throw Error('Visual checkout exists; preserve it until task cleanup');
const baseline = '97da8f1528f1cba7a8dd5474808b05b8388efa61';
const files = (stage === 'before' ? execFileSync('git',['ls-tree','-r','--name-only',baseline],{encoding:'utf8'}) : execFileSync('git',['ls-files','--cached','--others','--exclude-standard'],{encoding:'utf8'})).trim().split(/\r?\n/);
for (const file of new Set(files)) {
  if (!/^(app|components|lib|services|providers|schemas|public)\//.test(file) && !['package.json','package-lock.json','tsconfig.json','postcss.config.mjs','next.config.ts','next-env.d.ts'].includes(file)) continue;
  const destination=path.join(target,file);fs.mkdirSync(path.dirname(destination),{recursive:true});
  fs.writeFileSync(destination,stage==='before'?execFileSync('git',['show',`${baseline}:${file}`],{maxBuffer:8e6}):fs.readFileSync(path.join(root,file)));
}
fs.symlinkSync(path.join(root,'node_modules'),path.join(target,'node_modules'),'junction');
const require=createRequire(path.join(root,'package.json')),ts=require('typescript');
const authPath=path.join(target,'lib/appUser.ts');let auth=fs.readFileSync(authPath,'utf8');
const ast=ts.createSourceFile(authPath,auth,ts.ScriptTarget.Latest,true);
const edits=[];
function visit(node){if(ts.isVariableDeclaration(node)&&node.initializer&&['getAuthenticatedAppUser','getCurrentProductSession'].includes(node.name.text))edits.push([node.initializer.getStart(ast),node.initializer.end,`cache(async () => (await visualSession()) as unknown as ${node.name.text==='getCurrentProductSession'?'ProductSession':'AccountIdentity'})`]);ts.forEachChild(node,visit)}visit(ast);
for(const [a,b,value]of edits.sort((a,b)=>b[0]-a[0]))auth=auth.slice(0,a)+value+auth.slice(b);
auth+=`\nasync function visualSession() { const viewer=(await cookies()).get('visual-viewer')?.value==='1'; return { authUser:{id:'00000000-0000-4000-8000-000000000001'},appUser:{id:'00000000-0000-4000-8000-000000000001',name:'Partner',email:'partner@visual.invalid',role:'partner',languagePreference:'en-US'},partnerContext:{organisationId:'00000000-0000-4000-8000-000000000002',membershipRole:viewer?'viewer':'manager',orgType:'reward_partner',capabilities:capabilitiesForMembershipRole(viewer?'viewer':'manager')} }; }\n`;
fs.writeFileSync(authPath,auth);
// Only local test boundaries are substituted. Route, UI, adapters and server actions remain actual sources.
fs.writeFileSync(path.join(target,'lib/platform/client.ts'),"import { PlatformApiError } from '@/lib/platform/types';\nexport const createCorrelationId=()=>crypto.randomUUID();\nexport type PlatformFetchOptions={method?:string;body?:unknown;idempotencyKey?:string;correlationId?:string};\nexport async function platformFetch<T>(route:string,options:PlatformFetchOptions={}):Promise<T>{if(options.method&&options.method!=='GET')throw new PlatformApiError({kind:'not_found',status:404,message:'Isolated visual fixture has no inventory'}); if(route==='/me/memberships')return {rider:false,memberships:[{id:'fixture-membership',organisationId:'00000000-0000-4000-8000-000000000002',name:'Visual fixture workspace',domain:'partner',role:'manager',capabilities:[]}]} as T;\n if(route==='/partners/resources')return [{id:'fixture-pool',name:'Visual fixture with image',status:'active',availableCount:0,thumbnailUrl:'http://127.0.0.1:3317/movrr-icon-mark.png'},{id:'fixture-no-image',name:'Visual fixture without image',status:'inactive',availableCount:0},{id:'fixture-broken',name:'Visual fixture unavailable image',status:'inactive',availableCount:0,thumbnailUrl:'http://127.0.0.1:3317/nonexistent-fixture.png'}] as T;\n if(route==='/partners/analytics')return {series:[]} as T; if(route==='/partners/settings')return {} as T; return [] as T;}\n");
let notifications=fs.readFileSync(path.join(target,'lib/notifications.ts'),'utf8');
const nAst=ts.createSourceFile('notifications.ts',notifications,ts.ScriptTarget.Latest,true),nEdits=[];
for(const node of nAst.statements)if(ts.isFunctionDeclaration(node)&&node.body&&['listUserNotifications','getUserNotificationPreferences'].includes(node.name?.text))nEdits.push([node.body.getStart(nAst),node.body.end,node.name.text==='listUserNotifications'?'{ return []; }':'{ return true; }']);
for(const[a,b,value]of nEdits.sort((a,b)=>b[0]-a[0]))notifications=notifications.slice(0,a)+value+notifications.slice(b);fs.writeFileSync(path.join(target,'lib/notifications.ts'),notifications);
fs.writeFileSync(path.join(target,'proxy.ts'),`import { NextResponse } from 'next/server'; export function proxy(){return NextResponse.next();} export const config={matcher:['/dashboard/:path*']};\n`);
fs.writeFileSync(path.join(target,'.env'),`NEXT_PUBLIC_APP_URL=http://127.0.0.1:3317\nNEXT_PUBLIC_SITE_URL=http://127.0.0.1:3317\nAPP_URL=http://127.0.0.1:3317\nNEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9\nSUPABASE_URL=http://127.0.0.1:9\nNEXT_PUBLIC_SUPABASE_ANON_KEY=isolated-visual-fixture\nSUPABASE_SERVICE_ROLE_KEY=isolated-visual-fixture\nPLATFORM_API_URL=https://platform-build.invalid/api\n`);
fs.writeFileSync(path.join(target,'VISUAL-FIXTURE.json'),JSON.stringify({production:false,stage,baseline,isolatedReadFixtures:true,boundaries:['Session identity','Platform transport (empty canonical read models; commands rejected)','Notification read transport','Proxy identity']},null,2));
console.log(target);
