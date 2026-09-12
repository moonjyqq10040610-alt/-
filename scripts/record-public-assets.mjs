// Run only after reviewing changes to the redistributable public assets.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
async function walk(dir){
 const files=[];
 for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  const file=path.posix.join(dir,entry.name);
  if(entry.isDirectory())files.push(...await walk(file));else files.push(file);
 }
 return files;
}
const manifest={};
for(const file of (await walk('public')).sort())manifest[file]=crypto.createHash('sha256').update(await fs.readFile(file)).digest('hex');
await fs.mkdir('tests/fixtures',{recursive:true});
await fs.writeFile('tests/fixtures/public-assets.json',JSON.stringify(manifest,null,2)+'\n');
console.log(`Recorded ${Object.keys(manifest).length} reviewed public assets.`);
