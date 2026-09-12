import {build} from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import postcss from 'postcss';
const web=process.argv.includes('--web'),out=web?'dist-web':'dist';
// A locally supplied track is optional; a clean checkout uses synthesized music.
const track='web-assets/audio/room-theme.mp3';
const hasTrack=web&&await fs.stat(track).then(info=>info.isFile()).catch(error=>{if(error.code==='ENOENT')return false;throw error;});
await fs.rm(out,{recursive:true,force:true});await fs.mkdir(`${out}/assets`,{recursive:true});await fs.cp('public',out,{recursive:true});
if(hasTrack){await fs.mkdir(`${out}/audio`,{recursive:true});await fs.copyFile(track,`${out}/audio/room-theme.mp3`);}
const css=[];
const offlineCapabilities={name:'offline-capabilities',setup(b){
 b.onResolve({filter:/^three$/},()=>({path:path.resolve('node_modules/three/src/Three.js')}));
 // The renderer's optional XR manager is not part of this touch-only room.
 b.onLoad({filter:/\/WebXRManager\.js$/},()=>({loader:'js',contents:`import {EventDispatcher} from '../../core/EventDispatcher.js';
 export class WebXRManager extends EventDispatcher{constructor(){super();this.enabled=false;this.isPresenting=false;}dispose(){}setAnimationLoop(){}getEnvironmentBlendMode(){}getSession(){return null;}}`}));
 // React's network-speed heuristic is unnecessary for a fully local bundle.
 b.onLoad({filter:/react-dom-client\.production\.js$/},async args=>({loader:'js',contents:(await fs.readFile(args.path,'utf8')).replaceAll('navigator.connection','undefined')}));
}};
const result=await build({entryPoints:['src/main.tsx'],bundle:true,format:'iife',target:['es2017','chrome61'],minify:true,outfile:`${out}/assets/main.js`,define:{'process.env.NODE_ENV':'"production"','__ROOM_BGM__':JSON.stringify(hasTrack?'./audio/room-theme.mp3':null)},jsx:'automatic',legalComments:'none',sourcemap:false,metafile:true,tsconfig:'tsconfig.json',plugins:[offlineCapabilities,{name:'local-css',setup(b){b.onLoad({filter:/\.css$/},async args=>{css.push(await fs.readFile(args.path,'utf8'));return {contents:'',loader:'js'};});}}]});
// Preserve import order, regardless of parallel module loading.
const main=await fs.readFile('src/main.tsx','utf8');const sheets=Array.from(main.matchAll(/import '(\.\/styles\/[^']+\.css)'/g),m=>m[1]);
const source=(await Promise.all(sheets.map(s=>fs.readFile(path.join('src',s),'utf8')))).join('\n');
const root=postcss.parse(source);
root.walkDecls(d=>{
 if(d.prop==='inset'){const v=d.value.trim().split(/\s+/);['top','right','bottom','left'].forEach((prop,i)=>d.cloneBefore({prop,value:v[i]||v[i%2]||v[0]}));d.remove();return;}
 if(d.prop==='margin-inline'){d.cloneBefore({prop:'margin-left'});d.cloneBefore({prop:'margin-right'});d.remove();return;}
 if(d.prop==='overflow'&&d.value==='clip')d.cloneBefore({value:'hidden'});
 if(/\b[sd lv]vh\b/.test(d.value)||/\b\d+(?:s|d|l)vh\b/.test(d.value))d.cloneBefore({value:d.value.replace(/(\d+(?:\.\d+)?)(?:s|d|l)vh/g,'$1vh')});
 if(d.prop==='gap')d.cloneBefore({prop:'grid-gap'});if(d.prop==='column-gap')d.cloneBefore({prop:'grid-column-gap'});
 // Physical fallbacks for declarations that predate min/max/clamp support.
 if(/\bclamp\(/.test(d.value)){const match=d.value.match(/clamp\(([^,]+),([^,]+),([^\)]+)\)/);if(match)d.cloneBefore({value:d.value.replace(match[0],match[2])});}
 if(/\bmin\(/.test(d.value)){const match=d.value.match(/min\(([^,]+),(.+)\)/);if(match)d.cloneBefore({value:match[1]});}
 if(/\bmax\(/.test(d.value)){const match=d.value.match(/max\(([^,]+),(.+)\)/);if(match)d.cloneBefore({value:match[1]});}
});
// ES2017 browsers understand rgba, but not every engine understands hex alpha.
root.walkDecls(d=>{d.value=d.value.replace(/#([\da-f]{8}|[\da-f]{4})\b/gi,(_,hex)=>{if(hex.length===4)hex=hex.split('').map(c=>c+c).join('');return `rgba(${parseInt(hex.slice(0,2),16)},${parseInt(hex.slice(2,4),16)},${parseInt(hex.slice(4,6),16)},${(parseInt(hex.slice(6,8),16)/255).toFixed(3)})`;});});
await fs.writeFile(`${out}/assets/style.css`,root.toString());
const html=(await fs.readFile('index.html','utf8')).replace('</head>','<link rel="stylesheet" href="./assets/style.css"></head>').replace('<script type="module" src="./src/main.tsx"></script>','<script src="./assets/main.js"></script>');await fs.writeFile(`${out}/index.html`,html);
await fs.mkdir('reports',{recursive:true});await fs.writeFile(`reports/build-inputs${web?'-web':''}.json`,JSON.stringify(result.metafile,null,2));
console.log(`Built ${web?'web':'offline'} / ${hasTrack?'custom BGM':'instrumental'} application in ${out}/`);
