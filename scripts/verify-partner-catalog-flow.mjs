// Local PostgreSQL only. No .env, production credentials or financial tables.
// Actual Partner actions -> actual catalog adapter -> actual Admin catalog commands
// -> captured canonical shop_save_catalog. Only session/transport/media storage are fixtures.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import Module from 'node:module';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
const __dirname=path.dirname(fileURLToPath(import.meta.url));
const app=path.resolve(__dirname,'..'),admin=path.resolve(app,'../movrr-admin');
const appRequire=Module.createRequire(path.join(app,'package.json')),adminRequire=Module.createRequire(path.join(admin,'package.json'));
const ts=appRequire('typescript'),postgres=adminRequire('postgres');
const database='partner_phase4_'+process.pid;
const options={host:'127.0.0.1',port:55443,username:'postgres',password:'isolated-local-test-only',max:4,onnotice(){},transform:{...postgres.camel,undefined:null}};
// Do not transform names: Supabase returns snake_case and string timestamps.
delete options.transform;
options.types={date:{to:1184,from:[1184,1114],serialize:x=>x,parse:x=>x.replace(' ','T').replace(/\+00$/, '+00:00')}};
const root=postgres({...options,database:'postgres'}),db=postgres({...options,database});
const actor='00000000-0000-4000-8000-000000000001',org='00000000-0000-4000-8000-000000000002',partner='00000000-0000-4000-8000-000000000003';
const principal={type:'organisation',userId:actor,organisationId:org,organisationType:'reward_partner'};
const session={authUser:{id:actor},appUser:{id:actor,role:'partner',name:'Partner',email:'partner@visual.invalid',languagePreference:'en-US'},partnerContext:{organisationId:org,membershipRole:'owner',capabilities:['rewards.manage','rewards.catalog.read','fulfilment.read','fulfilment.validate','fulfilment.confirm','resources.manage','staff.manage','analytics.view']}};
const q=x=>'"'+x.replaceAll('"','""')+'"';let checks=0;
const check=(value,label)=>{assert.ok(value,label);checks++};
const assets=new Map();
const supabase={from(table){const filters=[];return {select(){return this},eq(k,v){filters.push([k,v]);return this},async maybeSingle(){const rows=await db.unsafe(`select * from ${q(table)} where ${filters.map(([k],i)=>q(k)+'=$'+(i+1)).join(' and ')} limit 1`,filters.map(x=>x[1]));return {data:rows[0]??null}}}},async rpc(name,args){assert.equal(name,'shop_save_catalog');try{return {data:await save(args.p_actor,args.p_id,args.p_payload,args.p_expected)}}catch(error){return {data:null,error:{code:error.code,message:error.message}}}}};
const cache=new Map();
function load(file,area){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const mod={exports:{}};cache.set(file,mod);
 const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 const req=id=>{
  if(id==='server-only')return {};
  if(area==='admin'&&id==='@/lib/supabase-admin')return {createSupabaseAdminClient:()=>supabase};
  if(area==='admin'&&id==='@/lib/rewardCatalogImage')return {uploadRewardCatalogThumbnail:async(bytes,mime)=>{const key=crypto.randomUUID();assets.set(key,{bytes:Buffer.from(bytes),mime});return {path:key,publicUrl:'http://127.0.0.1:3339/media/'+key}},deleteRewardCatalogImage:async key=>assets.delete(key)};
  if(area==='app'&&id==='@/lib/appUser')return {requirePartnerSession:async()=>session};
  if(area==='app'&&id==='@/lib/notifications')return {};
  if(area==='app'&&id==='@/lib/platform/client')return {platformFetch:dispatch,createCorrelationId:()=>crypto.randomUUID()};
  if(area==='app'&&id==='next/headers')return {cookies:async()=>({get:()=>undefined})};
  if(area==='app'&&id==='next/cache')return {revalidatePath(){}};
  if(area==='app'&&id==='next/navigation')return {redirect(url){throw Object.assign(new Error('redirect'),{redirect:url})}};
  if(id.startsWith('@/'))return resolveLoad(path.join(area==='admin'?admin:app,id.slice(2)),area);
  if(id.startsWith('.'))return resolveLoad(path.resolve(path.dirname(file),id),area);
  return (area==='admin'?adminRequire:appRequire)(id);
 };
 new Function('require','module','exports','__dirname','__filename',source)(req,mod,mod.exports,path.dirname(file),file);return mod.exports;
}
function resolveLoad(base,area){const file=[base,base+'.ts',base+'.tsx',path.join(base,'index.ts')].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile());if(!file)throw Error('Cannot resolve '+base);return load(file,area)}
async function save(who,id,payload,expected){return db.begin(async tx=>{await tx`select set_config('request.jwt.claim.role','service_role',true)`;return (await tx`select shop_save_catalog(${who},${id??null},${tx.json(payload)},${expected??null}) result`)[0].result})}
let commands;
async function dispatch(route,opts={}){
 if(route==='/me/memberships')return {rider:false,memberships:[{id:org,organisationId:org,name:'',domain:'partner',role:'owner',capabilities:session.partnerContext.capabilities}]};
 if(route==='/partners/rewards'&&(!opts.method||opts.method==='GET'))return (await db`select * from reward_catalog where partner_id=${partner}`).map(c=>({...c,updatedAt:c.updated_at,pointsPrice:c.points_price,inventoryCount:c.inventory_count,thumbnailUrl:c.thumbnail_url}));
 if(route==='/partners/settings')return {name:'',status:'active'};
 if(route==='/partners/analytics')return {series:[]};
 if(!opts.method||opts.method==='GET')return [];
 const request=new Request('http://127.0.0.1:3339'+route,{method:opts.method,body:opts.body instanceof FormData?opts.body:JSON.stringify(opts.body),headers:opts.body instanceof FormData?{}:{'content-type':'application/json'}});
 const {body,media}=await commands.readPartnerCatalogRequest(request);
 const result=opts.method==='POST'?await commands.createPartnerCatalogItem({principal},body,media):await commands.updatePartnerCatalogItem({principal},route.split('/').at(-1),body,media);
 if(!result.ok){const ErrorType=load(path.join(app,'lib/platform/types.ts'),'app').PlatformApiError;throw new ErrorType({status:result.kind==='permission_denied'?403:result.kind==='ConcurrencyConflict'?409:422,kind:result.kind,message:result.message})}
 return result.value;
}
async function setup(){await root.unsafe('CREATE DATABASE '+q(database));
 await db.unsafe(`CREATE SCHEMA auth;CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql AS $$ SELECT current_setting('request.jwt.claim.role',true) $$;CREATE TABLE admin_users(user_id uuid,role text);CREATE TABLE rider(id uuid,user_id uuid);CREATE TABLE fulfilment_resource(id uuid,partner_org_id uuid,status text,resource_kind text);CREATE TABLE shop_catalog_editor(catalog_id uuid PRIMARY KEY,actor_id uuid);`);
 const fixture=path.join(admin,'scripts/fixtures/creation-workflows'),schema=JSON.parse(fs.readFileSync(path.join(fixture,'schema.json')));
 for(const e of schema.enums)await db.unsafe(`CREATE TYPE ${q(e.typname)} AS ENUM (${e.labels.map(x=>"'"+x.replaceAll("'","''")+"'").join(',')})`);
 for(const table of ['organisation','organisation_membership','reward_partner','reward_catalog','platform_audit_record']){
 const cols=schema.columns.filter(c=>c.table_name===table).map(c=>{const exact=schema.formattedTypes.find(t=>t.table_name===table&&t.column_name===c.column_name)?.formatted_type;const type=exact??(c.data_type==='USER-DEFINED'?q(c.udt_name):c.data_type==='ARRAY'?q(c.udt_name.slice(1))+'[]':c.data_type);return q(c.column_name)+' '+type+(c.column_default?' DEFAULT '+c.column_default:'')+(c.is_nullable==='NO'?' NOT NULL':'')});await db.unsafe(`CREATE TABLE ${q(table)}(${cols.join(',')});ALTER TABLE ${q(table)} ADD PRIMARY KEY(id)`);}
 await db.unsafe(fs.readFileSync(path.join(fixture,'catalog-functions.sql'),'utf8'));
 await db`insert into organisation(id,name,type,status) values(${org},'Isolated contract fixture','reward_partner','active')`;
 await db`insert into organisation_membership(organisation_id,user_id,role,bundle_key,status) values(${org},${actor},'owner','partner_owner','active')`;
 await db`insert into reward_partner(id,name,organisation_id) values(${partner},'Isolated contract fixture',${org})`;
 commands=load(path.join(admin,'features/rewards/application/partnerCatalogCommands.ts'),'admin');
}
async function journey(){
 const actions=load(path.join(app,'app/actions/partner.ts'),'app');
 const form=values=>{const f=new FormData();for(const[k,v]of Object.entries(values))f.set(k,String(v));return f};
 const invoke=async(fn,values)=>{try{await fn(form(values));throw Error('Expected redirect')}catch(e){if(!e.redirect)throw e;return e.redirect}};
 const url=await invoke(actions.createRewardCatalogAction,{title:'Isolated contract reward',pointsCost:40,status:'active'});
 let row=(await db`select * from reward_catalog`)[0];check(row.status==='draft'&&url.includes('/edit?success='),'Create action always creates draft');
 const id=row.id;
 let target=await invoke(actions.updateRewardCatalogAction,{catalogItemId:id,expectedUpdatedAt:row.updated_at,title:'Updated contract reward',status:'draft',pointsCost:50});
 row=(await db`select * from reward_catalog where id=${id}`)[0];check(row.title==='Updated contract reward'&&row.points_price===50&&target.includes('success='),'Actual draft edit saved through canonical SQL');
 // Existing active-state setup is confined to this disposable database; no production approval is forged.
 await db`update reward_catalog set status='active' where id=${id}`;
 target=await invoke(actions.updateRewardCatalogAction,{catalogItemId:id,expectedUpdatedAt:row.updated_at,status:'active'});check(target.includes('error='),'Forged Active save blocked before command');
 target=await invoke(actions.updateRewardCatalogAction,{catalogItemId:id,expectedUpdatedAt:row.updated_at,status:'draft'});check(target.includes('error='),'Active withdrawal requires acknowledgement');
 const oldVersion=row.updated_at;
 target=await invoke(actions.updateRewardCatalogAction,{catalogItemId:id,expectedUpdatedAt:row.updated_at,title:'Reviewed draft',status:'draft',acknowledgeWithdrawal:true});
 row=(await db`select * from reward_catalog where id=${id}`)[0];check(row.status==='draft'&&row.title==='Reviewed draft'&&target.includes('success='),'Acknowledged active edit saves draft, not active');
 target=await invoke(actions.updateRewardCatalogAction,{catalogItemId:id,expectedUpdatedAt:oldVersion,title:'Stale write',status:'draft'});check(target.includes('error='),'Stale viewed version denied');check((await db`select title from reward_catalog where id=${id}`)[0].title==='Reviewed draft','Stale write made no change');
 await assert.rejects(save(actor,id,{status:'active'},row.updated_at),/Admin approval required/);checks++;
 const foreign=crypto.randomUUID();await assert.rejects(save(foreign,id,{title:'Foreign'},row.updated_at),/not authorized/);checks++;
 const before=await db`select count(*)::int n from platform_audit_record`;
 await assert.rejects(save(actor,id,{status:'active'},row.updated_at));check((await db`select count(*)::int n from platform_audit_record`)[0].n===before[0].n,'Denied write has no audit/row mutation');
 console.log(JSON.stringify({passed:checks,production:false,actual:'Partner server actions + catalog adapter + Admin catalog command + canonical SQL',boundaries:['session','database transport','in-memory media provider'],databaseHost:'127.0.0.1:55443'}));
}
let server;
async function cleanup(){if(server)await new Promise(r=>server.close(r));await db.end();await root.unsafe('DROP DATABASE IF EXISTS '+q(database));await root.end()}
(async()=>{await setup();await journey();if(process.argv.includes('--serve')){server=http.createServer(async(req,res)=>{try{if(req.url.startsWith('/media/')){const asset=assets.get(req.url.split('/').at(-1));if(!asset){res.statusCode=404;res.end();return}res.setHeader('content-type',asset.mime);res.end(asset.bytes);return}const chunks=[];for await(const chunk of req)chunks.push(chunk);const body=Buffer.concat(chunks);let input;
// Disposable fixture setup only, never part of the application or production API.
if(req.method==='POST'&&req.url==='/__fixture/active'){const{id}=JSON.parse(body.toString());await db`update reward_catalog set status='active' where id=${id} and partner_id=${partner}`;res.end('{}');return}
if(req.method!=='GET'){const request=new Request('http://127.0.0.1:3339'+req.url,{method:req.method,headers:req.headers,body});input=req.headers['content-type']?.startsWith('multipart/form-data')?await request.formData():JSON.parse(body.toString())}
const data=await dispatch(req.url,{method:req.method,body:input});res.setHeader('content-type','application/json');res.end(JSON.stringify(data));}catch(e){res.statusCode=e.status??500;res.setHeader('content-type','application/json');res.end(JSON.stringify({kind:e.kind??'error',message:e.message}))}});await new Promise(r=>server.listen(3339,'127.0.0.1',r));console.log('Isolated catalog bridge ready http://127.0.0.1:3339');process.on('SIGINT',()=>cleanup().then(()=>process.exit()));}else await cleanup()})().catch(async e=>{console.error(e.stack);await cleanup().catch(()=>{});process.exitCode=1});
