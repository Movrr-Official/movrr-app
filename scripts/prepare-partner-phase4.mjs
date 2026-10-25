// Reuse the established empty-session visual harness in its own isolated task directory.
// Commands use the localhost-only canonical catalog bridge; no production access.
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd(),stage=process.argv[2];
if(!['before','after'].includes(stage))throw Error('Use before or after');
const source=fs.readFileSync('scripts/prepare-partner-visual.mjs','utf8')
 .replace('security-partner-20261025','partner-phase4-20261025')
 .replace('2e544099e5a5e61376a24879f156a63c92212bd1','43f11fcec679f145c7fe8d29ced2085d16d3edc8');
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const target=path.join(root,'.tmp/partner-phase4-20261025',stage);
const config=path.join(target,'next.config.ts');
fs.writeFileSync(config,fs.readFileSync(config,'utf8').replace('const nextConfig = {','const nextConfig = { devIndicators: false,'));
fs.writeFileSync(path.join(target,'lib/platform/client.ts'),`import { PlatformApiError } from '@/lib/platform/types';
export const createCorrelationId=()=>crypto.randomUUID();
export type PlatformFetchOptions={method?:string;body?:unknown;idempotencyKey?:string;correlationId?:string};
export async function platformFetch<T>(route:string,options:PlatformFetchOptions={}):Promise<T>{
const form=options.body instanceof FormData;const response=await fetch('http://127.0.0.1:3339'+route,{method:options.method??'GET',headers:form?{}:{'Content-Type':'application/json'},...(options.body?{body:form?options.body as FormData:JSON.stringify(options.body)}:{})});const result=await response.json();if(!response.ok)throw new PlatformApiError({kind:result.kind,status:response.status,message:result.message});return result as T;}
`);
const env=path.join(target,'.env');fs.writeFileSync(env,fs.readFileSync(env,'utf8').replaceAll('3317',stage==='before'?'3317':'3318'));
fs.writeFileSync(path.join(target,'VISUAL-FIXTURE.json'),JSON.stringify({production:false,stage,session:'isolated existing harness identity',transport:'localhost-only canonical SQL bridge',media:'in-memory provider',financialRecords:false},null,2));
