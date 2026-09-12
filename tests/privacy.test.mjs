import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const project=path.resolve(import.meta.dirname,'..');
async function walk(dir){const out=[];for(const entry of await fs.readdir(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())out.push(...await walk(file));else out.push(file);}return out;}
test('public media matches the reviewed AI illustrations and contains no personal recordings',async()=>{
 const files=await walk(path.join(project,'public'));const photos=files.filter(f=>f.includes('/memories/'));assert.equal(photos.length,12);assert.ok(files.every(f=>!/\.(m4a|mp3|mov|wav|jpeg|jpg|png)$/i.test(f)));
 const manifest=JSON.parse(await fs.readFile(path.join(project,'tests/fixtures/public-assets.json'),'utf8'));
 assert.deepEqual(files.map(f=>path.relative(project,f).split(path.sep).join('/')).sort(),Object.keys(manifest).sort());
 for(const file of files){
  const hash=crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex');
  assert.equal(hash,manifest[path.relative(project,file).split(path.sep).join('/')],path.basename(file));
 }
});
test('source and content contain no private paths, contact details or remote media',async()=>{
 const forbidden=/(?:\/Users\/|\/home\/|file:\/\/|localhost:\d|127\.0\.0\.1:\d)|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b1[3-9]\d{9}\b/i;
 for(const f of await walk(path.join(project,'src')))assert.equal(forbidden.test(await fs.readFile(f,'utf8')),false,path.relative(project,f));
 for(const f of await walk(path.join(project,'src/data')))assert.equal(/https?:\/\//.test(await fs.readFile(f,'utf8')),false,path.basename(f));
});
test('offline entry has classic local scripts, one HTML and all gallery files',async()=>{
 const html=await fs.readFile(path.join(project,'dist/index.html'),'utf8');assert.ok(html.includes('viewport-fit=cover'));assert.ok(!/type="module"|<base|<iframe|<object|<script(?![^>]*src=)[^>]*>\s*\S/i.test(html));assert.ok(html.includes('src="./assets/main.js"'));
 const files=await walk(path.join(project,'dist'));assert.equal(files.filter(f=>f.endsWith('.html')).length,1);assert.ok(files.every(f=>/\.(html|css|js|json|png|jpg|jpeg|gif|webp|svg|woff2?|)$/i.test(f)));assert.ok(!files.some(f=>/\.map$|node_modules|\.git|\.DS_Store/.test(f)));
 const js=await fs.readFile(path.join(project,'dist/assets/main.js'),'utf8');for(const pattern of [/\bfetch\(/,/XMLHttpRequest/,/new Worker\(/,/new Function\(/,/WebAssembly\./,/navigator\.clipboard/,/navigator\.connection/,/XRWebGLBinding/,/requestSession\(/,/window\.open\(/,/\.download=/])assert.ok(!pattern.test(js),String(pattern));
 for(const name of (await fs.readdir(path.join(project,'public/memories'))))await fs.access(path.join(project,'dist/memories',name));
});
