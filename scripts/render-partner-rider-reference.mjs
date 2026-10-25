// Render current Rider primitives, never a fabricated Rider/merchant account.
// React Native Web, Paper font plumbing and Expo gradient adapters are explicit
// browser boundaries; Mobile source and tokens are read without modification.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require=createRequire(import.meta.url),root=process.cwd(),mobile=path.resolve(root,'../movrr-mobile');
const esbuild=require(process.env.MOVRR_ESBUILD_MODULE),{chromium}=require(process.env.MOVRR_PLAYWRIGHT_MODULE);
const browserModules=path.dirname(process.env.MOVRR_ESBUILD_MODULE),out=path.resolve('.tmp/partner-phase4-20261025/evidence');
const entry=`import React from 'react';import{createRoot}from'react-dom/client';import{View,Text}from'react-native';import{ScreenHeader}from'${path.join(mobile,'components/layout/ScreenHeader.tsx').replaceAll('\\','/')}';import{Button}from'${path.join(mobile,'components/ui/Button.tsx').replaceAll('\\','/')}';import{Colors}from'@/styles/colors';const c=Colors.light;createRoot(document.getElementById('app')).render(<View style={{padding:24,gap:24,backgroundColor:c.backgroundTertiary,minHeight:'100vh'}}><ScreenHeader title="Rewards" description="MOVRR Mobile component reference"/><View style={{backgroundColor:c.card,borderRadius:24,padding:24,gap:20}}><Text style={{fontFamily:'PlusJakartaSans_400Regular',fontSize:16,lineHeight:24,color:c.foreground}}>Current Rider typography, surface and action primitives. No account or business data.</Text><Button title="View rewards" onPress={()=>{}}/><Button title="Continue" variant="outline" onPress={()=>{}}/><Button title="Unavailable" disabled onPress={()=>{}}/></View></View>);`;
await esbuild.build({stdin:{contents:entry,loader:'tsx',resolveDir:root},jsx:'automatic',bundle:true,write:true,outfile:path.join(out,'rider-reference.js'),format:'iife',platform:'browser',nodePaths:[path.join(root,'node_modules'),browserModules],define:{'process.env.NODE_ENV':'"production"',__DEV__:'false'},plugins:[{name:'rider-web-boundaries',setup(build){
build.onResolve({filter:/.*/},args=>{
 if(args.path==='@/store/themeStore')return {path:'theme',namespace:'adapter'};
 if(args.path==='react-native-paper')return {path:'paper',namespace:'adapter'};
 if(args.path==='expo-linear-gradient')return {path:'gradient',namespace:'adapter'};
 if(args.path==='./Icon'&&args.importer.endsWith('Button.tsx'))return {path:'icon',namespace:'adapter'};
 if(args.path==='react-native')return {path:path.join(browserModules,'react-native-web/dist/index.js')};
 if(args.path==='react'||args.path.startsWith('react/'))return {path:require.resolve(args.path)};
 if(args.path==='react-dom/client')return {path:require.resolve('react-dom/client')};
 if(args.path.startsWith('@/')){const base=path.join(mobile,args.path.slice(2));return {path:[base+'.ts',base+'.tsx',path.join(base,'index.ts')].find(p=>fs.existsSync(p))};}
 if(/^[A-Z]:[\\/]/i.test(args.path))return {path:args.path};
});
build.onLoad({filter:/.*/,namespace:'adapter'},args=>({loader:'tsx',resolveDir:root,contents:args.path==='theme'?`export const useThemeStore=()=>({isDark:false});`:args.path==='icon'?`export default function Icon(){return null}`:args.path==='paper'?`export{Text}from'react-native';export const MD3LightTheme={colors:{}},MD3DarkTheme={colors:{}};export const configureFonts=({config})=>config;`:`import React from'react';import{View,StyleSheet}from'react-native';export function LinearGradient({colors,style,children,...props}){return <View style={[style,{backgroundImage:'linear-gradient(135deg,'+colors.join(',')+')'}]} {...props}>{children}</View>}` }));
}}]});
const font=(name,file)=>`@font-face{font-family:'${name}';src:url('${pathToFileURL(file).href}')}`;
fs.writeFileSync(path.join(out,'rider-reference.html'),`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}${font('Lexend_600SemiBold',path.resolve('public/fonts/lexend-600.ttf').replaceAll('\\','/'))}${font('Lexend_700Bold',path.resolve('public/fonts/lexend-700.ttf').replaceAll('\\','/'))}${font('PlusJakartaSans_400Regular',path.resolve('public/fonts/jakarta-400.ttf').replaceAll('\\','/'))}${font('PlusJakartaSans_600SemiBold',path.resolve('public/fonts/jakarta-600.ttf').replaceAll('\\','/'))}</style><div id="app"></div><script src="rider-reference.js"></script>`);
const browser=await chromium.launch({headless:true});try{const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.join(out,'rider-reference.html')).href);await page.getByText('View rewards',{exact:true}).waitFor();await page.evaluate(()=>document.fonts.ready);if(errors.length)throw Error(errors.join('\n'));await page.screenshot({path:path.join(out,'rider-primitives-current.png')});console.log('Rendered actual current Rider Button and ScreenHeader, with declared web adapters; no physical-device claim.')}finally{await browser.close()}
